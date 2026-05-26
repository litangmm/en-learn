/**
 * useLearningReport Hook (epic-069 iter-004)
 *
 * Generates a comprehensive learning health report from aggregated insights data.
 * This report can be displayed in a panel or exported as a shareable card.
 *
 * Key features:
 * - Aggregates data from useLearnInsights and useProgressStats
 * - Generates shareable report with period summary
 * - Identifies weakest mode and provides recommendations
 * - Collects recent achievements and milestones
 */

import { useMemo } from 'react';
import type {
  LearningReport,
  LearnInsightData,
  PracticeMode,
  HealthScoreLevel,
  ModeAccuracy,
} from '@/data/types';
import { useLearnInsights } from './useLearnInsights';
import { useProgressStats } from './useProgressStats';
import { useWeeklyReport } from './useWeeklyReport';
import { BADGE_DEFINITIONS, storage } from '@/services/storage';
import { calculateWeakModeRecommendation } from './useLearnInsights';

// ============================================================================
// Constants
// ============================================================================

const HEALTH_LEVEL_LABELS: Record<HealthScoreLevel, string> = {
  high: '优秀',
  medium: '良好',
  low: '待提升',
  critical: '需要关注',
};

const MODE_LABELS: Record<PracticeMode, string> = {
  'fill-in-blanks': '填空',
  'dictation': '听写',
  'multiple-choice': '选择',
  'sentence-reorder': '排序',
};

// ============================================================================
// Pure Calculation Functions (for testing)
// ============================================================================

/**
 * Get the period label based on the date range.
 */
export function getPeriodLabel(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startMonth = start.getMonth() + 1;
  const startDay = start.getDate();
  const endMonth = end.getMonth() + 1;
  const endDay = end.getDate();

  if (startMonth === endMonth) {
    return `${startMonth}月${startDay}-${endDay}日学习报告`;
  }
  return `${startMonth}月${startDay}-${endMonth}月${endDay}日学习报告`;
}

/**
 * Format a timestamp to date string (YYYY-MM-DD).
 */
export function formatDateString(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toISOString().split('T')[0];
}

/**
 * Format a date string to display format (MM/DD).
 */
export function formatShortDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
}

/**
 * Calculate the number of days between two timestamps.
 */
export function getDaysBetween(startTimestamp: number, endTimestamp: number): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.floor((endTimestamp - startTimestamp) / MS_PER_DAY);
}

/**
 * Generate the learning report from raw data.
 * This is a pure function for easy testing.
 */
export function generateLearningReport(params: {
  insights: LearnInsightData;
  progressStats: {
    totalXP: number;
    level: number;
    totalQuestions: number;
    learningDays: number;
  };
  weeklyReport: {
    weekXP: number;
    weekQuestions: number;
    weekAccuracy: number;
  };
  modeAccuracy: ModeAccuracy[];
  badges: Array<{ id: string; title: string; description: string; icon: string }>;
  unlockedBadgeIds: string[];
}): LearningReport {
  const now = Date.now();
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6); // Last 7 days including today

  const startDate = formatDateString(weekStart.getTime());
  const endDate = formatDateString(now);

  // Get weak mode recommendation
  const weakModeRecommendation = calculateWeakModeRecommendation(params.modeAccuracy);

  // Get achievements from unlocked badges (top 3 recent)
  const achievements = params.unlockedBadgeIds
    .slice(0, 3)
    .map((id) => {
      const badge = params.badges.find((b) => b.id === id);
      if (!badge) return null;
      return {
        id: badge.id,
        title: badge.title,
        description: badge.description,
        icon: badge.icon,
      };
    })
    .filter(Boolean) as LearningReport['achievements'];

  // Get personalized insights (top 3 high priority)
  const insights = params.insights.insights
    .filter((i) => i.priority <= 2)
    .slice(0, 3);

  // Generate next action recommendations
  const nextActions = generateNextActions({
    healthLevel: params.insights.healthScore.level,
    weakMode: weakModeRecommendation?.mode || null,
    streak: params.insights.streak.currentStreak,
    goalCompletion: params.insights.goalCompletion,
  });

  return {
    id: `report-${endDate}`,
    periodLabel: getPeriodLabel(startDate, endDate),
    generatedAt: now,
    period: {
      startDate,
      endDate,
    },
    healthScore: {
      score: params.insights.healthScore.score,
      level: params.insights.healthScore.level,
      label: HEALTH_LEVEL_LABELS[params.insights.healthScore.level],
    },
    xp: {
      total: params.progressStats.totalXP,
      level: params.progressStats.level,
      weeklyGained: params.weeklyReport.weekXP,
    },
    accuracy: {
      total: params.insights.accuracy.total,
      trend: params.insights.accuracy.trend,
    },
    streak: {
      current: params.insights.streak.currentStreak,
      best: params.insights.streak.longestStreak,
    },
    practice: {
      totalQuestions: params.progressStats.totalQuestions,
      totalSessions: params.insights.insights.length, // Will be replaced with actual session count
      modesPracticed: params.modeAccuracy.filter((m) => m.totalQuestions > 0).length,
    },
    weakModeRecommendation: weakModeRecommendation
      ? {
          mode: weakModeRecommendation.mode,
          accuracy: weakModeRecommendation.accuracy,
          suggestion: weakModeRecommendation.suggestion,
          priority: weakModeRecommendation.priority,
        }
      : null,
    achievements,
    insights,
    nextActions,
  };
}

/**
 * Generate next action recommendations based on user's state.
 */
function generateNextActions(params: {
  healthLevel: HealthScoreLevel;
  weakMode: PracticeMode | null;
  streak: number;
  goalCompletion: {
    dailyCompleted: number;
    dailyTotal: number;
    weeklyCompleted: number;
    weeklyTotal: number;
  };
}): string[] {
  const actions: string[] = [];

  // Health-based actions
  if (params.healthLevel === 'critical') {
    actions.push('建议降低练习强度，重点复习薄弱知识点');
  } else if (params.healthLevel === 'low') {
    actions.push('保持每日练习节奏，注意劳逸结合');
  } else if (params.healthLevel === 'high') {
    actions.push('状态极佳，可以挑战更高难度的练习');
  }

  // Weak mode recommendation
  if (params.weakMode) {
    const modeLabel = MODE_LABELS[params.weakMode] || params.weakMode;
    actions.push(`加强 ${modeLabel} 模式的练习`);
  }

  // Streak-based actions
  if (params.streak >= 7) {
    actions.push('继续保持 streak，连续学习是进步的关键');
  } else if (params.streak === 0) {
    actions.push('今天就开始练习，重启你的学习 streak');
  }

  // Goal-based actions
  if (params.goalCompletion.dailyTotal > 0) {
    const remaining = params.goalCompletion.dailyTotal - params.goalCompletion.dailyCompleted;
    if (remaining > 0) {
      actions.push(`今日目标还差 ${remaining} 个，继续加油`);
    } else {
      actions.push('今日目标已完成，可以挑战额外练习');
    }
  }

  // Limit to 3 actions
  return actions.slice(0, 3);
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook that generates the learning health report.
 * Combines data from multiple sources to create a shareable report.
 */
export function useLearningReport(): LearningReport {
  const insights = useLearnInsights();
  const progressStats = useProgressStats();
  const weeklyReport = useWeeklyReport();

  // Get mode accuracy data
  const modeAccuracy = useMemo(() => insights.abilityModeAccuracy, [insights.abilityModeAccuracy]);

  // Get badges data
  const badgesData = useMemo(() => {
    const badgeState = storage.getBadges();
    // Get unlocked badge IDs from the badge state
    const unlockedBadgeIds = badgeState.unlocked.map(b => b.id);
    // Use BADGE_DEFINITIONS for all badge definitions
    return {
      badges: BADGE_DEFINITIONS,
      unlockedBadgeIds,
    };
  }, []);

  // Generate report
  const report = useMemo(() => {
    // Get weekly report data from the hook's report property
    const weeklyData = weeklyReport.report;
    const weekXP = weeklyData?.xpEarned || 0;
    const weekQuestions = weeklyData?.questionsAnswered || 0;
    const weekAccuracy = weeklyData?.accuracy || 0;

    return generateLearningReport({
      insights,
      progressStats: {
        totalXP: progressStats.totalXP,
        level: progressStats.level,
        totalQuestions: progressStats.totalQuestions,
        learningDays: progressStats.learningDays,
      },
      weeklyReport: {
        weekXP,
        weekQuestions,
        weekAccuracy,
      },
      modeAccuracy,
      badges: badgesData.badges,
      unlockedBadgeIds: badgesData.unlockedBadgeIds,
    });
  }, [
    insights,
    progressStats.totalXP,
    progressStats.level,
    progressStats.totalQuestions,
    progressStats.learningDays,
    weeklyReport.report,
    modeAccuracy,
    badgesData.badges,
    badgesData.unlockedBadgeIds,
  ]);

  return report;
}

export default useLearningReport;