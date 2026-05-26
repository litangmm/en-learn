import { describe, it, expect, vi } from 'vitest';
import {
  calculateHealthScore,
  generateWeaknessPatterns,
  calculateGoalCompletionRate,
  calculateAccuracyTrend,
  generateInsights,
  aggregateLearnInsights,
} from '../useLearnInsights';
import type { ChurnRiskLevel, SessionHistory } from '@/data/types';

// Mock storage
vi.mock('@/services/storage', () => ({
  storage: {
    getHistory: vi.fn(() => []),
    getMistakes: vi.fn(() => []),
    getXPProfile: vi.fn(() => ({ totalXP: 1000, currentLevel: 3 })),
  },
}));

// Mock useProgressStats
vi.mock('../useProgressStats', () => ({
  useProgressStats: vi.fn(() => ({
    totalXP: 1000,
    level: 3,
    progressToNextLevel: 50,
    learningDays: 10,
    totalAccuracy: 75,
    modeAccuracy: [],
  })),
}));

// Mock useWeaknessStats
vi.mock('../useWeaknessStats', () => ({
  useWeaknessStats: vi.fn(() => ({
    stats: {
      totalWeakCount: 5,
      byDictionary: {},
      byType: {},
      overallStrength: 70,
    },
  })),
}));

// Mock useGoals
vi.mock('../useGoals', () => ({
  useGoals: vi.fn(() => ({
    dailyGoals: [{ current: 5, target: 10, completed: false }],
    weeklyGoals: [{ current: 20, target: 50, completed: false }],
    completedDailyGoals: 0,
    completedWeeklyGoals: 0,
  })),
}));

// Mock useFlowState
vi.mock('../useFlowState', () => ({
  useFlowState: vi.fn(() => ({
    flowState: 'normal',
    fatigueSignals: [],
  })),
}));

// Mock useWeaknessDetection
vi.mock('../useWeaknessDetection', () => ({
  detectAllWeaknesses: vi.fn(() => []),
}));

describe('calculateHealthScore', () => {
  it('should return high health score for excellent metrics', () => {
    // Perfect score: 100 accuracy, 10 streak, 100% goals, no weaknesses, no fatigue
    const result = calculateHealthScore(100, 10, 'low', 1, 0, false);

    expect(result.level).toBe('high');
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.color).toBe('#22c55e');
  });

  it('should return medium health score for good metrics', () => {
    const result = calculateHealthScore(80, 5, 'low', 0.8, 1, false);

    expect(result.level).toBe('medium');
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.score).toBeLessThan(80);
    expect(result.color).toBe('#f59e0b');
  });

  it('should return low health score for struggling metrics', () => {
    // Higher accuracy, no churn penalty, minimal weaknesses
    const result = calculateHealthScore(70, 4, 'low', 0.6, 1, false);

    expect(result.level).toBe('low');
    expect(result.score).toBeGreaterThanOrEqual(40);
    expect(result.score).toBeLessThan(60);
    expect(result.color).toBe('#f97316');
  });

  it('should return critical health score for poor metrics', () => {
    const result = calculateHealthScore(20, 0, 'critical', 0, 10, true);

    expect(result.level).toBe('critical');
    expect(result.score).toBeLessThan(40);
    expect(result.color).toBe('#ef4444');
  });

  it('should apply churn risk penalty correctly', () => {
    const base = calculateHealthScore(70, 3, 'low', 0.7, 2, false);
    const withHighChurn = calculateHealthScore(70, 3, 'high', 0.7, 2, false);

    expect(withHighChurn.score).toBeLessThan(base.score);
  });

  it('should apply fatigue penalty', () => {
    const normal = calculateHealthScore(70, 3, 'low', 0.7, 2, false);
    const fatigued = calculateHealthScore(70, 3, 'low', 0.7, 2, true);

    expect(fatigued.score).toBeLessThan(normal.score);
  });

  it('should apply weakness penalty', () => {
    const noWeak = calculateHealthScore(70, 3, 'low', 0.7, 0, false);
    const withWeak = calculateHealthScore(70, 3, 'low', 0.7, 5, false);

    expect(withWeak.score).toBeLessThan(noWeak.score);
  });

  it('should cap score at 100', () => {
    const result = calculateHealthScore(100, 20, 'low', 1, 0, false);

    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('should not go below 0', () => {
    const result = calculateHealthScore(0, 0, 'critical', 0, 20, true);

    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it('should return valid level for any input', () => {
    const result = calculateHealthScore(50, 5, 'medium', 0.5, 3, false);

    expect(['critical', 'low', 'medium', 'high']).toContain(result.level);
  });
});

describe('generateWeaknessPatterns', () => {
  it('should return empty array when no weaknesses', () => {
    const result = generateWeaknessPatterns([]);

    expect(result).toEqual([]);
  });

  it('should generate patterns for high-error weaknesses', () => {
    const weaknesses = [
      { sentenceId: '1', weakType: 'high-error', dictionaryId: 'd1', accuracy: 0.3, wrongCount: 5 },
      { sentenceId: '2', weakType: 'high-error', dictionaryId: 'd1', accuracy: 0.4, wrongCount: 3 },
    ];

    const result = generateWeaknessPatterns(weaknesses);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].patternType).toBe('accuracy');
    expect(result[0].title).toBe('高频错误');
  });

  it('should generate patterns for low-accuracy weaknesses', () => {
    const weaknesses = [
      { sentenceId: '1', weakType: 'low-accuracy', dictionaryId: 'd1', accuracy: 0.5, wrongCount: 2 },
    ];

    const result = generateWeaknessPatterns(weaknesses);

    expect(result.some(p => p.patternType === 'accuracy')).toBe(true);
  });

  it('should generate patterns for review-neglected weaknesses', () => {
    const weaknesses = [
      { sentenceId: '1', weakType: 'review-neglected', dictionaryId: 'd1', accuracy: 0.6, wrongCount: 1 },
    ];

    const result = generateWeaknessPatterns(weaknesses);

    expect(result.some(p => p.patternType === 'neglected')).toBe(true);
  });

  it('should sort patterns by severity', () => {
    const weaknesses = [
      { sentenceId: '1', weakType: 'high-error', dictionaryId: 'd1', accuracy: 0.3, wrongCount: 2 },
      { sentenceId: '2', weakType: 'review-neglected', dictionaryId: 'd1', accuracy: 0.6, wrongCount: 1 },
    ];

    const result = generateWeaknessPatterns(weaknesses);

    expect(result[0].severity).toBeGreaterThanOrEqual(result[1].severity);
  });

  it('should include suggested actions', () => {
    const weaknesses = [
      { sentenceId: '1', weakType: 'high-error', dictionaryId: 'd1', accuracy: 0.3, wrongCount: 5 },
    ];

    const result = generateWeaknessPatterns(weaknesses);

    expect(result[0].suggestedAction).toBeDefined();
    expect(result[0].suggestedAction.length).toBeGreaterThan(0);
  });
});

describe('calculateGoalCompletionRate', () => {
  it('should return 1 when all goals completed', () => {
    const result = calculateGoalCompletionRate(5, 5, 3, 3);

    expect(result).toBe(1);
  });

  it('should return 0 when no goals completed', () => {
    const result = calculateGoalCompletionRate(0, 5, 0, 3);

    expect(result).toBe(0);
  });

  it('should return average when partial completion', () => {
    const result = calculateGoalCompletionRate(5, 10, 0, 10);

    expect(result).toBe(0.25);
  });

  it('should handle missing daily goals', () => {
    const result = calculateGoalCompletionRate(0, 0, 5, 10);

    expect(result).toBe(0.5);
  });

  it('should handle missing weekly goals', () => {
    const result = calculateGoalCompletionRate(5, 10, 0, 0);

    expect(result).toBe(0.5);
  });

  it('should return 0 when no goals exist', () => {
    const result = calculateGoalCompletionRate(0, 0, 0, 0);

    expect(result).toBe(0);
  });
});

describe('calculateAccuracyTrend', () => {
  const createHistory = (accuracies: number[]): SessionHistory[] => {
    return accuracies.map((accuracy, index) => ({
      id: `session-${index}`,
      timestamp: Date.now() - (accuracies.length - index) * 86400000,
      duration: 300000,
      dictionaryId: 'test',
      dictionaryName: 'Test',
      score: 100,
      totalQuestions: 10,
      correctCount: Math.round(accuracy * 10),
      accuracy,
    }));
  };

  it('should return stable when insufficient data', () => {
    const result = calculateAccuracyTrend(createHistory([70, 80]), 5);

    expect(result).toBe('stable');
  });

  it('should return up when accuracy improving', () => {
    const result = calculateAccuracyTrend(createHistory([60, 65, 70, 80, 90]), 5);

    expect(result).toBe('up');
  });

  it('should return down when accuracy declining', () => {
    const result = calculateAccuracyTrend(createHistory([90, 85, 80, 70, 60]), 5);

    expect(result).toBe('down');
  });

  it('should return stable when accuracy is flat', () => {
    const result = calculateAccuracyTrend(createHistory([75, 75, 75, 75, 75]), 5);

    expect(result).toBe('stable');
  });

  it('should handle empty history', () => {
    const result = calculateAccuracyTrend([], 5);

    expect(result).toBe('stable');
  });
});

describe('generateInsights', () => {
  const baseParams = {
    healthScore: { level: 'medium' as const, score: 65, color: '#f59e0b', icon: 'activity' },
    accuracy: 70,
    accuracyTrend: 'stable' as const,
    streak: 3,
    weakCount: 2,
    churnRisk: 'low' as ChurnRiskLevel,
    goalCompletionRate: 0.5,
    isFatigued: false,
    flowState: 'normal' as const,
  };

  it('should generate health insight for high health score', () => {
    const params = { ...baseParams, healthScore: { ...baseParams.healthScore, level: 'high' as const, score: 85 } };
    const result = generateInsights(params);

    expect(result.some(i => i.section === 'health' && i.title === '学习状态优秀')).toBe(true);
  });

  it('should generate health insight for critical health score', () => {
    const params = { ...baseParams, healthScore: { ...baseParams.healthScore, level: 'critical' as const, score: 30 } };
    const result = generateInsights(params);

    expect(result.some(i => i.title.includes('调整'))).toBe(true);
  });

  it('should generate streak insight for high streak', () => {
    const params = { ...baseParams, streak: 7 };
    const result = generateInsights(params);

    expect(result.some(i => i.title.includes('7'))).toBe(true);
  });

  it('should generate streak insight for zero streak', () => {
    const params = { ...baseParams, streak: 0 };
    const result = generateInsights(params);

    expect(result.some(i => i.section === 'recommendation' && i.title.includes('开始'))).toBe(true);
  });

  it('should generate accuracy insight when trending up', () => {
    const params = { ...baseParams, accuracyTrend: 'up' as const, accuracy: 85 };
    const result = generateInsights(params);

    expect(result.some(i => i.title.includes('提升'))).toBe(true);
  });

  it('should generate accuracy insight when trending down', () => {
    const params = { ...baseParams, accuracyTrend: 'down' as const, accuracy: 50 };
    const result = generateInsights(params);

    expect(result.some(i => i.title.includes('下降'))).toBe(true);
  });

  it('should generate weakness insight when weakCount > 0', () => {
    const params = { ...baseParams, weakCount: 5 };
    const result = generateInsights(params);

    expect(result.some(i => i.section === 'weakness')).toBe(true);
  });

  it('should generate churn insight for high risk', () => {
    const params = { ...baseParams, churnRisk: 'high' as ChurnRiskLevel };
    const result = generateInsights(params);

    expect(result.some(i => i.section === 'recommendation')).toBe(true);
  });

  it('should generate fatigue insight when fatigued', () => {
    const params = { ...baseParams, isFatigued: true };
    const result = generateInsights(params);

    expect(result.some(i => i.title.includes('休息'))).toBe(true);
  });

  it('should sort insights by priority', () => {
    const result = generateInsights(baseParams);

    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].priority).toBeLessThanOrEqual(result[i].priority);
    }
  });

  it('should include generatedAt timestamp', () => {
    const result = generateInsights(baseParams);

    expect(result.every(i => i.generatedAt > 0)).toBe(true);
  });
});

describe('aggregateLearnInsights', () => {
  const baseParams = {
    xpProfile: { totalXP: 1000, currentLevel: 3, progressToNextLevel: 50 },
    learningDays: 10,
    totalAccuracy: 75,
    streak: { currentStreak: 5, longestStreak: 10, isActive: true },
    history: [],
    weaknessStats: { totalWeakCount: 3 },
    churnRisk: 'low' as ChurnRiskLevel,
    dailyGoals: { completed: 5, total: 10 },
    weeklyGoals: { completed: 20, total: 50 },
    flowState: 'normal' as const,
    isFatigued: false,
  };

  it('should return LearnInsightData structure', () => {
    const result = aggregateLearnInsights(baseParams);

    expect(result.healthScore).toBeDefined();
    expect(result.xpProfile).toBeDefined();
    expect(result.streak).toBeDefined();
    expect(result.accuracy).toBeDefined();
    expect(result.weaknessPatterns).toBeDefined();
    expect(result.churnRisk).toBeDefined();
    expect(result.goalCompletion).toBeDefined();
    expect(result.flowState).toBeDefined();
    expect(result.insights).toBeDefined();
    expect(result.lastUpdated).toBeDefined();
  });

  it('should calculate health score', () => {
    const result = aggregateLearnInsights(baseParams);

    expect(result.healthScore.score).toBeGreaterThanOrEqual(0);
    expect(result.healthScore.score).toBeLessThanOrEqual(100);
    expect(['critical', 'low', 'medium', 'high']).toContain(result.healthScore.level);
  });

  it('should calculate accuracy trend', () => {
    const result = aggregateLearnInsights(baseParams);

    expect(['up', 'down', 'stable']).toContain(result.accuracy.trend);
  });

  it('should calculate churn risk correctly', () => {
    const result = aggregateLearnInsights(baseParams);

    expect(result.churnRisk.level).toBe('low');
    expect(result.churnRisk.isAtRisk).toBe(false);
  });

  it('should reflect flow state', () => {
    const result = aggregateLearnInsights(baseParams);

    expect(result.flowState.currentState).toBe('normal');
    expect(result.flowState.isFatigued).toBe(false);
  });

  it('should calculate goal completion correctly', () => {
    const result = aggregateLearnInsights(baseParams);

    expect(result.goalCompletion.dailyCompleted).toBe(5);
    expect(result.goalCompletion.dailyTotal).toBe(10);
    expect(result.goalCompletion.weeklyCompleted).toBe(20);
    expect(result.goalCompletion.weeklyTotal).toBe(50);
  });
});

describe('useLearnInsights hook', () => {
  // The actual hook test is limited since it depends on storage
  // We focus on testing the pure functions
  it('should export necessary types and functions', () => {
    expect(calculateHealthScore).toBeDefined();
    expect(generateWeaknessPatterns).toBeDefined();
    expect(calculateGoalCompletionRate).toBeDefined();
    expect(calculateAccuracyTrend).toBeDefined();
    expect(generateInsights).toBeDefined();
    expect(aggregateLearnInsights).toBeDefined();
  });
});
