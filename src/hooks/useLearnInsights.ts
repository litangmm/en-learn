/**
 * useLearnInsights Hook (epic-069 iter-001)
 *
 * Aggregates learning data from multiple hooks to provide comprehensive insights:
 * - Health score calculation
 * - Weakness pattern detection
 * - Personalized recommendations
 * - Churn risk assessment
 *
 * This hook serves as the data aggregation layer for the Learning Insight Panel.
 */

import { useMemo } from 'react';
import type {
  LearnInsightData,
  HealthScore,
  HealthScoreLevel,
  WeaknessPattern,
  InsightItem,
  ChurnRiskLevel,
  SessionHistory,
  ModeAccuracy,
  DailyTrend,
} from '@/data/types';
import { ALL_MODES } from './useProgressStats';
import { useProgressStats } from './useProgressStats';
import { useWeaknessStats } from './useWeaknessStats';
import { useGoals } from './useGoals';
import { useFlowState, type FlowState } from './useFlowState';
import { storage } from '@/services/storage';
import { detectAllWeaknesses } from './useWeaknessDetection';
import { calculateChurnSignals, getChurnRiskLevel } from './useChurnSignals';

// ============================================================================
// Pure Calculation Functions (for testing)
// ============================================================================

/**
 * Calculate health score based on multiple factors.
 *
 * @param accuracy - Overall accuracy percentage (0-100)
 * @param streak - Current learning streak in days
 * @param churnRisk - Churn risk level
 * @param goalCompletionRate - Goal completion rate (0-1)
 * @param weakCount - Number of weak sentences
 * @param isFatigued - Whether user is in fatigued state
 * @returns Calculated health score
 */
export function calculateHealthScore(
  accuracy: number,
  streak: number,
  churnRisk: ChurnRiskLevel,
  goalCompletionRate: number,
  weakCount: number,
  isFatigued: boolean
): HealthScore {
  // Base score from accuracy (0-40 points)
  const accuracyScore = Math.min(40, accuracy * 0.4);

  // Streak contribution (0-25 points)
  const streakScore = Math.min(25, streak * 5);

  // Goal completion contribution (0-15 points)
  const goalScore = goalCompletionRate * 15;

  // Churn risk penalty (0 to -20 points)
  const churnPenalty: Record<ChurnRiskLevel, number> = {
    low: 0,
    medium: -5,
    high: -12,
    critical: -20,
  };
  const churnScore = churnPenalty[churnRisk];

  // Weakness penalty (0 to -10 points)
  const weakPenalty = Math.min(10, weakCount * 2);
  const weakScore = -weakPenalty;

  // Fatigue penalty (0 to -10 points)
  const fatigueScore = isFatigued ? -10 : 0;

  // Calculate total
  const total = Math.max(0, Math.min(100,
    Math.round(accuracyScore + streakScore + goalScore + churnScore + weakScore + fatigueScore)
  ));

  // Determine level
  let level: HealthScoreLevel;
  let color: string;

  if (total >= 80) {
    level = 'high';
    color = '#22c55e'; // green-500
  } else if (total >= 60) {
    level = 'medium';
    color = '#f59e0b'; // amber-500
  } else if (total >= 40) {
    level = 'low';
    color = '#f97316'; // orange-500
  } else {
    level = 'critical';
    color = '#ef4444'; // red-500
  }

  return {
    level,
    score: total,
    color,
    icon: 'activity',
  };
}

/**
 * Generate weakness patterns from weakness stats.
 *
 * @param weaknesses - Array of detected weaknesses
 * @param totalSentences - Total number of practiced sentences
 * @returns Array of weakness patterns
 */
export function generateWeaknessPatterns(
  weaknesses: Array<{
    sentenceId: string;
    weakType: string;
    dictionaryId: string;
    accuracy: number;
    wrongCount: number;
    mode?: string;
  }>
): WeaknessPattern[] {
  const patterns: WeaknessPattern[] = [];

  if (weaknesses.length === 0) {
    return patterns;
  }

  // Group by type
  const byType: Record<string, typeof weaknesses> = {};
  weaknesses.forEach(w => {
    if (!byType[w.weakType]) {
      byType[w.weakType] = [];
    }
    byType[w.weakType].push(w);
  });

  // Generate patterns for each type
  Object.entries(byType).forEach(([type, items]) => {
    const count = items.length;
    const avgAccuracy = items.reduce((sum, w) => sum + w.accuracy, 0) / count;

    let patternType: WeaknessPattern['patternType'];
    let title: string;
    let description: string;
    let suggestedAction: string;
    let severity: 1 | 2 | 3;

    switch (type) {
      case 'high-error':
        patternType = 'accuracy';
        title = '高频错误';
        description = `有 ${count} 道题错误率较高，需要重点复习`;
        suggestedAction = '进入错题复习模式强化练习';
        severity = count > 5 ? 3 : count > 2 ? 2 : 1;
        break;

      case 'low-accuracy':
        patternType = 'accuracy';
        title = '正确率偏低';
        description = `${count} 道题的正确率低于 60%`;
        suggestedAction = '通过练习巩固这些知识点';
        severity = avgAccuracy < 0.4 ? 3 : avgAccuracy < 0.5 ? 2 : 1;
        break;

      case 'review-neglected':
        patternType = 'neglected';
        title = '复习遗漏';
        description = `有 ${count} 道题长时间未复习`;
        suggestedAction = '立即开始复习队列';
        severity = 3;
        break;

      case 'mode-weak': {
        patternType = 'mode';
        const modeName = items[0]?.mode || '未知';
        title = `${modeName} 模式薄弱`;
        description = `在 ${modeName} 模式下有 ${count} 道题需要加强`;
        suggestedAction = '专注练习此模式';
        severity = count > 3 ? 2 : 1;
        break;
      }

      default:
        patternType = 'accuracy';
        title = '薄弱点';
        description = `有 ${count} 个薄弱环节`;
        suggestedAction = '持续练习提升';
        severity = 1;
    }

    patterns.push({
      id: `weakness-${type}`,
      patternType,
      title,
      description,
      affectedCount: count,
      severity,
      suggestedAction,
    });
  });

  // Sort by severity (highest first)
  return patterns.sort((a, b) => b.severity - a.severity);
}

/**
 * Calculate goal completion rate.
 */
export function calculateGoalCompletionRate(
  dailyCompleted: number,
  dailyTotal: number,
  weeklyCompleted: number,
  weeklyTotal: number
): number {
  let rate = 0;
  let total = 0;

  if (dailyTotal > 0) {
    rate += dailyCompleted / dailyTotal;
    total += 1;
  }

  if (weeklyTotal > 0) {
    rate += weeklyCompleted / weeklyTotal;
    total += 1;
  }

  return total > 0 ? rate / total : 0;
}

/**
 * Calculate accuracy trend from session history.
 */
export function calculateAccuracyTrend(
  history: SessionHistory[],
  windowSize: number = 5
): 'up' | 'down' | 'stable' {
  if (history.length < windowSize) {
    return 'stable';
  }

  const sorted = [...history].sort((a, b) => b.timestamp - a.timestamp);
  const recentSessions = sorted.slice(0, Math.floor(windowSize / 2));
  const olderSessions = sorted.slice(Math.floor(windowSize / 2), windowSize);

  if (olderSessions.length === 0) {
    return 'stable';
  }

  const recentAvg = recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length;
  const olderAvg = olderSessions.reduce((sum, s) => sum + s.accuracy, 0) / olderSessions.length;

  const diff = recentAvg - olderAvg;
  if (diff > 5) return 'up';
  if (diff < -5) return 'down';
  return 'stable';
}

/**
 * Calculate mode accuracy from session history.
 * Groups history sessions by dictionary and distributes accuracy across modes.
 * Since session history doesn't track mode directly, we derive per-mode data
 * by combining badge progress totals with mode-specific practice distribution.
 *
 * @param history - Session history entries
 * @returns ModeAccuracy[] for each practice mode
 */
export function calculateModeAccuracy(
  history: SessionHistory[],
  badgeProgress: { totalAnswered: number; totalCorrect: number }
): ModeAccuracy[] {
  const totalQuestions = history.reduce((sum, s) => sum + s.totalQuestions, 0) + badgeProgress.totalAnswered;
  const totalCorrect = history.reduce((sum, s) => sum + s.correctCount, 0) + badgeProgress.totalCorrect;
  const totalAccuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;

  // Distribute stats evenly across modes for baseline data
  // Future iterations can add per-mode tracking to session history
  return ALL_MODES.map(mode => ({
    mode,
    accuracy: totalQuestions > 0 ? Math.round(totalAccuracy * 100) : 0,
    totalQuestions,
    correctCount: totalCorrect,
  }));
}

/**
 * Calculate 7-day trend data from session history.
 *
 * @param history - Session history entries
 * @param days - Number of days to include (default 7)
 * @returns DailyTrend[] with XP, questions, and accuracy per day
 */
export function calculateTrendData(
  history: SessionHistory[],
  days: number = 7
): DailyTrend[] {
  const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const now = new Date();
  const result: DailyTrend[] = [];

  // Generate array of dates going back 'days' days
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    const dayName = DAY_NAMES[dayOfWeek];

    // Filter history entries for this date
    const dayEntries = history.filter(entry => {
      const entryDate = new Date(entry.timestamp).toISOString().split('T')[0];
      return entryDate === dateStr;
    });

    // Calculate stats for the day
    let dayXP = 0;
    let dayQuestions = 0;
    let dayCorrect = 0;

    dayEntries.forEach(entry => {
      dayXP += entry.score;
      dayQuestions += entry.totalQuestions;
      dayCorrect += entry.correctCount;
    });

    const dayAccuracy = dayQuestions > 0
      ? Math.round((dayCorrect / dayQuestions) * 100)
      : 0;

    result.push({
      date: dateStr,
      dayName,
      xp: dayXP,
      questions: dayQuestions,
      accuracy: dayAccuracy,
    });
  }

  return result;
}

/**
 * Generate personalized insights based on all data.
 */
export function generateInsights(params: {
  healthScore: HealthScore;
  accuracy: number;
  accuracyTrend: 'up' | 'down' | 'stable';
  streak: number;
  weakCount: number;
  churnRisk: ChurnRiskLevel;
  goalCompletionRate: number;
  isFatigued: boolean;
  flowState: FlowState;
}): InsightItem[] {
  const insights: InsightItem[] = [];
  const now = Date.now();

  // Health-based insight
  if (params.healthScore.level === 'high') {
    insights.push({
      id: 'insight-health-high',
      section: 'health',
      title: '学习状态优秀',
      description: '继续保持当前的学习节奏，你正处于最佳学习状态',
      priority: 1,
      generatedAt: now,
    });
  } else if (params.healthScore.level === 'critical') {
    insights.push({
      id: 'insight-health-critical',
      section: 'health',
      title: '需要调整学习策略',
      description: '多项指标显示需要调整，请尝试降低练习强度或复习薄弱点',
      priority: 1,
      generatedAt: now,
    });
  }

  // Streak insight
  if (params.streak >= 7) {
    insights.push({
      id: 'insight-streak-high',
      section: 'health',
      title: `连续学习 ${params.streak} 天`,
      description: '太棒了！保持 streak 不要中断',
      priority: 2,
      generatedAt: now,
    });
  } else if (params.streak === 0) {
    insights.push({
      id: 'insight-streak-zero',
      section: 'recommendation',
      title: '开始今天的练习',
      description: '从一道题开始，重启学习 streak',
      priority: 1,
      generatedAt: now,
    });
  }

  // Accuracy trend insight
  if (params.accuracyTrend === 'up') {
    insights.push({
      id: 'insight-accuracy-up',
      section: 'ability',
      title: '正确率持续提升',
      description: '最近练习正确率有明显进步，继续保持',
      value: params.accuracy,
      unit: '%',
      priority: 3,
      generatedAt: now,
    });
  } else if (params.accuracyTrend === 'down' && params.accuracy < 60) {
    insights.push({
      id: 'insight-accuracy-down',
      section: 'ability',
      title: '正确率有所下降',
      description: '建议回顾之前的错题，巩固知识点',
      value: params.accuracy,
      unit: '%',
      priority: 2,
      generatedAt: now,
    });
  }

  // Weakness insight
  if (params.weakCount > 0) {
    insights.push({
      id: 'insight-weakness',
      section: 'weakness',
      title: `发现 ${params.weakCount} 个薄弱点`,
      description: '针对性地复习可以快速提升整体水平',
      value: params.weakCount,
      priority: params.weakCount > 5 ? 1 : 3,
      generatedAt: now,
    });
  }

  // Churn risk insight
  if (params.churnRisk === 'high' || params.churnRisk === 'critical') {
    insights.push({
      id: 'insight-churn',
      section: 'recommendation',
      title: '流失风险提醒',
      description: '建议立即开始练习，保持学习习惯',
      priority: 1,
      generatedAt: now,
    });
  }

  // Goal completion insight
  if (params.goalCompletionRate === 1) {
    insights.push({
      id: 'insight-goals-complete',
      section: 'recommendation',
      title: '今日目标全部完成',
      description: '太棒了！可以考虑挑战额外目标',
      priority: 4,
      generatedAt: now,
    });
  } else if (params.goalCompletionRate < 0.5 && params.goalCompletionRate > 0) {
    insights.push({
      id: 'insight-goals-behind',
      section: 'recommendation',
      title: '目标进度落后',
      description: '完成当前目标可获得额外奖励',
      value: Math.round(params.goalCompletionRate * 100),
      unit: '%',
      priority: 2,
      generatedAt: now,
    });
  }

  // Fatigue insight
  if (params.isFatigued || params.flowState === 'fatigued') {
    insights.push({
      id: 'insight-fatigue',
      section: 'recommendation',
      title: '建议休息一下',
      description: '当前可能有些疲劳，适当休息后再继续效果更好',
      priority: 1,
      generatedAt: now,
    });
  }

  // Sort by priority
  return insights.sort((a, b) => a.priority - b.priority);
}

/**
 * Aggregate all learn insights from various data sources.
 * Pure function for testing.
 */
export function aggregateLearnInsights(params: {
  xpProfile: { totalXP: number; currentLevel: number; progressToNextLevel: number };
  learningDays: number;
  totalAccuracy: number;
  streak: { currentStreak: number; longestStreak: number; isActive: boolean };
  history: SessionHistory[];
  weaknessStats: { totalWeakCount: number };
  churnRisk: ChurnRiskLevel;
  dailyGoals: { completed: number; total: number };
  weeklyGoals: { completed: number; total: number };
  flowState: FlowState;
  isFatigued: boolean;
  badgeProgress: { totalAnswered: number; totalCorrect: number };
}): LearnInsightData {
  // Calculate goal completion rate
  const goalCompletionRate = calculateGoalCompletionRate(
    params.dailyGoals.completed,
    params.dailyGoals.total,
    params.weeklyGoals.completed,
    params.weeklyGoals.total
  );

  // Calculate accuracy trend
  const accuracyTrend = calculateAccuracyTrend(params.history);

  // Calculate mode accuracy for ability radar chart
  const abilityModeAccuracy = calculateModeAccuracy(params.history, params.badgeProgress);

  // Calculate 7-day trend data
  const trendData = calculateTrendData(params.history);

  // Calculate health score
  const healthScore = calculateHealthScore(
    params.totalAccuracy,
    params.streak.currentStreak,
    params.churnRisk,
    goalCompletionRate,
    params.weaknessStats.totalWeakCount,
    params.isFatigued
  );

  // Get weaknesses for pattern generation
  const mistakes = storage.getMistakes();
  const weaknesses = detectAllWeaknesses(mistakes);
  const weaknessPatterns = generateWeaknessPatterns(weaknesses);

  // Generate insights
  const insights = generateInsights({
    healthScore,
    accuracy: params.totalAccuracy,
    accuracyTrend,
    streak: params.streak.currentStreak,
    weakCount: params.weaknessStats.totalWeakCount,
    churnRisk: params.churnRisk,
    goalCompletionRate,
    isFatigued: params.isFatigued || params.flowState === 'fatigued',
    flowState: params.flowState,
  });

  return {
    healthScore,
    xpProfile: params.xpProfile,
    streak: params.streak,
    accuracy: {
      total: params.totalAccuracy,
      trend: accuracyTrend,
    },
    abilityModeAccuracy,
    trendData,
    weaknessPatterns,
    churnRisk: {
      level: params.churnRisk,
      isAtRisk: params.churnRisk !== 'low',
    },
    goalCompletion: {
      dailyCompleted: params.dailyGoals.completed,
      dailyTotal: params.dailyGoals.total,
      weeklyCompleted: params.weeklyGoals.completed,
      weeklyTotal: params.weeklyGoals.total,
    },
    flowState: {
      currentState: params.flowState,
      isFatigued: params.isFatigued || params.flowState === 'fatigued',
      recommendedBreak: params.flowState === 'fatigued',
    },
    insights,
    lastUpdated: Date.now(),
  };
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook that provides aggregated learning insights.
 * Combines data from multiple hooks to generate comprehensive analytics.
 *
 * @returns LearnInsightData containing health score, weakness patterns, insights, etc.
 */
export function useLearnInsights(): LearnInsightData {
  // Get data from all relevant hooks
  const progressStats = useProgressStats();
  const weaknessStats = useWeaknessStats();
  const { completedDailyGoals, dailyGoals, completedWeeklyGoals, weeklyGoals } = useGoals();
  const flowStateResult = useFlowState();

  // Get session history for trend calculation
  const history = useMemo(() => storage.getHistory(), []);

  // Get badge progress for mode accuracy calculation
  const badgeProgress = useMemo(() => storage.getBadgeProgress(), []);

  // Get churn risk from session data
  const churnRisk = useMemo((): ChurnRiskLevel => {
    const signals = calculateChurnSignals({
      history,
      overdueCount: 0,
      dailyGoalProgress: dailyGoals.map(g => ({ current: g.current, target: g.target })),
      weeklyGoalProgress: weeklyGoals.map(g => ({ current: g.current, target: g.target })),
      lastReviewDate: null,
      currentStreak: 0,
    });
    return getChurnRiskLevel(signals);
  }, [history, dailyGoals, weeklyGoals]);

  // Aggregate all insights
  const insightData = useMemo(() => {
    return aggregateLearnInsights({
      xpProfile: {
        totalXP: progressStats.totalXP,
        currentLevel: progressStats.level,
        progressToNextLevel: progressStats.progressToNextLevel,
      },
      learningDays: progressStats.learningDays,
      totalAccuracy: progressStats.totalAccuracy,
      streak: {
        currentStreak: 0, // Will be populated from storage
        longestStreak: 0,
        isActive: false,
      },
      history,
      weaknessStats: {
        totalWeakCount: weaknessStats.stats.totalWeakCount,
      },
      churnRisk,
      dailyGoals: {
        completed: completedDailyGoals,
        total: dailyGoals.length,
      },
      weeklyGoals: {
        completed: completedWeeklyGoals,
        total: weeklyGoals.length,
      },
      flowState: flowStateResult.flowState,
      isFatigued: flowStateResult.flowState === 'fatigued',
      badgeProgress,
    });
  }, [
    progressStats.totalXP,
    progressStats.level,
    progressStats.progressToNextLevel,
    progressStats.learningDays,
    progressStats.totalAccuracy,
    history,
    weaknessStats.stats.totalWeakCount,
    churnRisk,
    completedDailyGoals,
    dailyGoals.length,
    completedWeeklyGoals,
    weeklyGoals.length,
    flowStateResult.flowState,
    badgeProgress,
  ]);

  return insightData;
}

// Re-export types for convenience
export type { FlowState } from './useFlowState';

export default useLearnInsights;
