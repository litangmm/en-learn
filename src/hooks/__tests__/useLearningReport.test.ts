import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type {
  LearningReport,
  LearnInsightData,
  ModeAccuracy,
  PracticeMode,
  HealthScoreLevel,
} from '@/data/types';
import {
  generateLearningReport,
  getPeriodLabel,
  formatDateString,
  formatShortDate,
  getDaysBetween,
} from '../useLearningReport';

// Mock storage for tests
vi.mock('@/services/storage', () => ({
  storage: {
    getBadges: vi.fn(() => ({
      unlocked: [
        { id: 'badge-1', unlockedAt: Date.now() },
        { id: 'badge-2', unlockedAt: Date.now() },
      ],
      progress: {
        totalAnswered: 100,
        totalCorrect: 80,
        totalSessions: 10,
        maxStreakEver: 5,
        perfectSessions: 2,
        totalReviews: 20,
        totalChallengesCompleted: 5,
      },
    })),
    getBadgeProgress: vi.fn(() => ({
      totalAnswered: 100,
      totalCorrect: 80,
      totalSessions: 10,
      maxStreakEver: 5,
      perfectSessions: 2,
      totalReviews: 20,
      totalChallengesCompleted: 5,
    })),
  },
}));

// Mock useLearnInsights to avoid dependency issues
vi.mock('@/hooks/useLearnInsights', () => ({
  useLearnInsights: vi.fn(() => createMockInsights()),
  calculateWeakModeRecommendation: vi.fn((modeAccuracy) => {
    const weakModes = modeAccuracy.filter(
      (m: { totalQuestions: number; accuracy: number }) => m.totalQuestions > 0 && m.accuracy < 70
    );
    if (weakModes.length === 0) return null;
    const weakest = weakModes.reduce(
      (prev: { accuracy: number }, curr: { accuracy: number }) =>
        curr.accuracy < prev.accuracy ? curr : prev
    );
    return {
      mode: weakest.mode,
      accuracy: weakest.accuracy,
      suggestion: 'Test suggestion',
      priority: weakest.accuracy < 50 ? 1 : 2,
    };
  }),
}));

// Mock useProgressStats
vi.mock('@/hooks/useProgressStats', () => ({
  useProgressStats: vi.fn(() => ({
    totalXP: 1000,
    level: 3,
    totalQuestions: 100,
    learningDays: 10,
    modeAccuracy: createMockModeAccuracy(),
  })),
}));

// Mock useWeeklyReport
vi.mock('@/hooks/useWeeklyReport', () => ({
  useWeeklyReport: vi.fn(() => ({
    report: {
      weekStart: '2024-01-01',
      weekEnd: '2024-01-07',
      xpEarned: 150,
      questionsAnswered: 50,
      correctAnswers: 40,
      bestStreak: 5,
      learningDays: 7,
      sessionsCompleted: 10,
      accuracy: 80,
      generatedAt: Date.now(),
    },
    shouldShow: false,
    dismiss: vi.fn(),
    markShown: vi.fn(),
    refresh: vi.fn(),
  })),
}));

// Helper functions for creating mock data
function createMockInsights(): LearnInsightData {
  return {
    healthScore: {
      level: 'medium' as HealthScoreLevel,
      score: 75,
      color: '#f59e0b',
      icon: 'activity',
    },
    xpProfile: {
      totalXP: 1000,
      currentLevel: 3,
      progressToNextLevel: 50,
    },
    streak: {
      currentStreak: 5,
      longestStreak: 10,
      isActive: true,
    },
    accuracy: {
      total: 72,
      trend: 'up',
    },
    abilityModeAccuracy: createMockModeAccuracy(),
    trendData: [],
    weaknessPatterns: [],
    churnRisk: {
      level: 'low',
      isAtRisk: false,
    },
    goalCompletion: {
      dailyCompleted: 5,
      dailyTotal: 10,
      weeklyCompleted: 3,
      weeklyTotal: 5,
    },
    flowState: {
      currentState: 'normal',
      isFatigued: false,
      recommendedBreak: false,
    },
    insights: [],
    lastUpdated: Date.now(),
  };
}

function createMockModeAccuracy(): ModeAccuracy[] {
  return [
    { mode: 'fill-in-blanks' as PracticeMode, accuracy: 80, totalQuestions: 50, correctCount: 40 },
    { mode: 'dictation' as PracticeMode, accuracy: 45, totalQuestions: 20, correctCount: 9 },
    { mode: 'multiple-choice' as PracticeMode, accuracy: 75, totalQuestions: 20, correctCount: 15 },
    { mode: 'sentence-reorder' as PracticeMode, accuracy: 70, totalQuestions: 10, correctCount: 7 },
  ];
}

describe('useLearningReport', () => {
  describe('pure functions', () => {
    describe('getPeriodLabel', () => {
      it('returns same month date range label', () => {
        const label = getPeriodLabel('2024-01-01', '2024-01-07');
        expect(label).toBe('1月1-7日学习报告');
      });

      it('returns cross month date range label', () => {
        const label = getPeriodLabel('2024-01-28', '2024-02-03');
        expect(label).toBe('1月28-2月3日学习报告');
      });
    });

    describe('formatDateString', () => {
      it('formats timestamp to YYYY-MM-DD', () => {
        const timestamp = new Date('2024-01-15T12:00:00Z').getTime();
        const result = formatDateString(timestamp);
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    describe('formatShortDate', () => {
      it('formats YYYY-MM-DD to MM/DD', () => {
        const result = formatShortDate('2024-01-15');
        expect(result).toBe('1/15');
      });

      it('handles invalid format', () => {
        const result = formatShortDate('invalid');
        expect(result).toBe('invalid');
      });
    });

    describe('getDaysBetween', () => {
      it('calculates days between timestamps', () => {
        const start = new Date('2024-01-01').getTime();
        const end = new Date('2024-01-08').getTime();
        const days = getDaysBetween(start, end);
        expect(days).toBe(7);
      });

      it('returns 0 for same day', () => {
        const timestamp = Date.now();
        const days = getDaysBetween(timestamp, timestamp);
        expect(days).toBe(0);
      });
    });

    describe('generateLearningReport', () => {
      const mockBadges = [
        { id: 'badge-1', title: '初次尝试', description: '完成第一道题', icon: 'Star' },
        { id: 'badge-2', title: '连对5题', description: '连续答对5道题', icon: 'Flame' },
      ];

      const mockInsights = createMockInsights();
      const mockModeAccuracy = createMockModeAccuracy();

      it('generates report with all required fields', () => {
        const report = generateLearningReport({
          insights: mockInsights,
          progressStats: {
            totalXP: 1000,
            level: 3,
            totalQuestions: 100,
            learningDays: 10,
          },
          weeklyReport: {
            weekXP: 150,
            weekQuestions: 50,
            weekAccuracy: 80,
          },
          modeAccuracy: mockModeAccuracy,
          badges: mockBadges,
          unlockedBadgeIds: ['badge-1'],
        });

        expect(report.id).toMatch(/^report-/);
        expect(report.periodLabel).toBeTruthy();
        expect(report.healthScore).toBeDefined();
        expect(report.healthScore.score).toBe(75);
        expect(report.xp.total).toBe(1000);
        expect(report.xp.weeklyGained).toBe(150);
        expect(report.accuracy.total).toBe(72);
        expect(report.streak.current).toBe(5);
        expect(report.practice.totalQuestions).toBe(100);
        expect(report.weakModeRecommendation).toBeDefined();
        expect(report.weakModeRecommendation?.mode).toBe('dictation');
        expect(report.achievements).toHaveLength(1);
        expect(report.nextActions.length).toBeGreaterThan(0);
      });

      it('identifies dictation as weak mode when it has low accuracy', () => {
        const report = generateLearningReport({
          insights: mockInsights,
          progressStats: {
            totalXP: 1000,
            level: 3,
            totalQuestions: 100,
            learningDays: 10,
          },
          weeklyReport: {
            weekXP: 150,
            weekQuestions: 50,
            weekAccuracy: 80,
          },
          modeAccuracy: mockModeAccuracy,
          badges: mockBadges,
          unlockedBadgeIds: [],
        });

        expect(report.weakModeRecommendation).not.toBeNull();
        expect(report.weakModeRecommendation?.mode).toBe('dictation');
        expect(report.weakModeRecommendation?.accuracy).toBe(45);
      });

      it('returns null weak mode when all modes are above threshold', () => {
        const highAccuracyModes: ModeAccuracy[] = [
          { mode: 'fill-in-blanks' as PracticeMode, accuracy: 85, totalQuestions: 50, correctCount: 42 },
          { mode: 'dictation' as PracticeMode, accuracy: 75, totalQuestions: 20, correctCount: 15 },
          { mode: 'multiple-choice' as PracticeMode, accuracy: 80, totalQuestions: 20, correctCount: 16 },
          { mode: 'sentence-reorder' as PracticeMode, accuracy: 78, totalQuestions: 10, correctCount: 8 },
        ];

        const report = generateLearningReport({
          insights: mockInsights,
          progressStats: {
            totalXP: 1000,
            level: 3,
            totalQuestions: 100,
            learningDays: 10,
          },
          weeklyReport: {
            weekXP: 150,
            weekQuestions: 50,
            weekAccuracy: 80,
          },
          modeAccuracy: highAccuracyModes,
          badges: mockBadges,
          unlockedBadgeIds: [],
        });

        expect(report.weakModeRecommendation).toBeNull();
      });

      it('includes achievements from unlocked badges', () => {
        const report = generateLearningReport({
          insights: mockInsights,
          progressStats: {
            totalXP: 1000,
            level: 3,
            totalQuestions: 100,
            learningDays: 10,
          },
          weeklyReport: {
            weekXP: 150,
            weekQuestions: 50,
            weekAccuracy: 80,
          },
          modeAccuracy: mockModeAccuracy,
          badges: mockBadges,
          unlockedBadgeIds: ['badge-1', 'badge-2'],
        });

        expect(report.achievements).toHaveLength(2);
        expect(report.achievements[0].id).toBe('badge-1');
        expect(report.achievements[1].id).toBe('badge-2');
      });

      it('generates next actions based on health level', () => {
        const lowHealthInsights = {
          ...mockInsights,
          healthScore: {
            ...mockInsights.healthScore,
            level: 'critical' as HealthScoreLevel,
          },
        };

        const report = generateLearningReport({
          insights: lowHealthInsights,
          progressStats: {
            totalXP: 1000,
            level: 3,
            totalQuestions: 100,
            learningDays: 10,
          },
          weeklyReport: {
            weekXP: 150,
            weekQuestions: 50,
            weekAccuracy: 80,
          },
          modeAccuracy: mockModeAccuracy,
          badges: mockBadges,
          unlockedBadgeIds: [],
        });

        expect(report.nextActions.some(a => a.includes('降低练习强度'))).toBe(true);
      });

      it('recommends practicing weak mode', () => {
        const report = generateLearningReport({
          insights: mockInsights,
          progressStats: {
            totalXP: 1000,
            level: 3,
            totalQuestions: 100,
            learningDays: 10,
          },
          weeklyReport: {
            weekXP: 150,
            weekQuestions: 50,
            weekAccuracy: 80,
          },
          modeAccuracy: mockModeAccuracy,
          badges: mockBadges,
          unlockedBadgeIds: [],
        });

        expect(report.nextActions.some(a => a.includes('听写'))).toBe(true);
      });
    });
  });
});