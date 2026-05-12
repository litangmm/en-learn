import { useMemo } from 'react';
import type { ChurnSignal, ChurnAssessment, SignalSeverity, ChurnRiskLevel, SessionHistory } from '@/data/types';
import { getTodayDateString, getYesterdayDateString } from '@/utils/dateUtils';

// ============================================================================
// Threshold Constants
// ============================================================================

/** Thresholds for session gap detection (in days) */
const SESSION_GAP_THRESHOLDS = {
  high: 3,
  critical: 7,
} as const;

/** Thresholds for review backlog detection (in overdue items) */
const REVIEW_BACKLOG_THRESHOLDS = {
  high: 10,
  critical: 25,
} as const;

/** Threshold for accuracy drop detection (percentage decline) */
const ACCURACY_DROP_THRESHOLD = 15;

/** Number of recent sessions to analyze for accuracy trends */
const ACCURACY_WINDOW_SIZE = 5;

/** Threshold for goal slack detection (percentage behind) */
const GOAL_SLACK_THRESHOLD = 50;

/** Threshold for streak broken detection (days without review) */
const STREAK_BROKEN_THRESHOLD_DAYS = 2;

// ============================================================================
// Pure Calculation Functions
// ============================================================================

/**
 * Calculate session gap signal from practice history.
 * Detects when user hasn't practiced for a concerning period.
 */
export function calculateSessionGapSignal(history: SessionHistory[]): ChurnSignal | null {
  if (history.length === 0) {
    // No history - check if user is completely new
    return null;
  }

  // Sort by timestamp descending (most recent first)
  const sorted = [...history].sort((a, b) => b.timestamp - a.timestamp);
  const lastSession = sorted[0];
  const now = Date.now();
  const daysSinceLastSession = Math.floor((now - lastSession.timestamp) / (1000 * 60 * 60 * 24));

  if (daysSinceLastSession >= SESSION_GAP_THRESHOLDS.critical) {
    return {
      id: `session_gap_${Date.now()}`,
      type: 'session_gap',
      severity: 'critical',
      description: `已 ${daysSinceLastSession} 天没有练习了`,
      value: daysSinceLastSession,
      threshold: SESSION_GAP_THRESHOLDS.critical,
      detectedAt: Date.now(),
    };
  }

  if (daysSinceLastSession >= SESSION_GAP_THRESHOLDS.high) {
    return {
      id: `session_gap_${Date.now()}`,
      type: 'session_gap',
      severity: 'high',
      description: `已 ${daysSinceLastSession} 天没有练习了`,
      value: daysSinceLastSession,
      threshold: SESSION_GAP_THRESHOLDS.high,
      detectedAt: Date.now(),
    };
  }

  return null;
}

/**
 * Calculate review backlog signal from spaced repetition data.
 * Detects when user has accumulated too many overdue reviews.
 */
export function calculateReviewBacklogSignal(overdueCount: number): ChurnSignal | null {
  if (overdueCount >= REVIEW_BACKLOG_THRESHOLDS.critical) {
    return {
      id: `review_backlog_${Date.now()}`,
      type: 'review_backlog',
      severity: 'critical',
      description: `有 ${overdueCount} 道复习题待完成`,
      value: overdueCount,
      threshold: REVIEW_BACKLOG_THRESHOLDS.critical,
      detectedAt: Date.now(),
    };
  }

  if (overdueCount >= REVIEW_BACKLOG_THRESHOLDS.high) {
    return {
      id: `review_backlog_${Date.now()}`,
      type: 'review_backlog',
      severity: 'high',
      description: `复习队列积压 ${overdueCount} 道题`,
      value: overdueCount,
      threshold: REVIEW_BACKLOG_THRESHOLDS.high,
      detectedAt: Date.now(),
    };
  }

  return null;
}

/**
 * Calculate accuracy drop signal from recent session history.
 * Detects when user's accuracy is trending downward.
 */
export function calculateAccuracyDropSignal(history: SessionHistory[]): ChurnSignal | null {
  if (history.length < ACCURACY_WINDOW_SIZE) {
    return null;
  }

  // Sort by timestamp descending and take recent sessions
  const sorted = [...history].sort((a, b) => b.timestamp - a.timestamp);
  const recentSessions = sorted.slice(0, ACCURACY_WINDOW_SIZE);

  // Calculate average accuracy for recent and older sessions
  const recentCount = Math.min(3, Math.floor(ACCURACY_WINDOW_SIZE / 2));
  const recentAvg = recentSessions.slice(0, recentCount).reduce((sum, s) => sum + s.accuracy, 0) / recentCount;
  const olderAvg = recentSessions.slice(recentCount).reduce((sum, s) => sum + s.accuracy, 0) / (recentSessions.length - recentCount);

  if (olderAvg === 0) {
    return null;
  }

  const declinePercent = ((olderAvg - recentAvg) / olderAvg) * 100;

  if (declinePercent >= ACCURACY_DROP_THRESHOLD) {
    return {
      id: `accuracy_drop_${Date.now()}`,
      type: 'accuracy_drop',
      severity: 'medium',
      description: `正确率下降了 ${declinePercent.toFixed(0)}%`,
      value: Math.round(declinePercent),
      threshold: ACCURACY_DROP_THRESHOLD,
      detectedAt: Date.now(),
    };
  }

  return null;
}

/**
 * Calculate goal slack signal from goal progress data.
 * Detects when user is significantly behind on their daily/weekly goals.
 */
export function calculateGoalSlackSignal(
  dailyGoalProgress: { current: number; target: number }[],
  weeklyGoalProgress: { current: number; target: number }[]
): ChurnSignal | null {
  // Check daily goals first
  for (const goal of dailyGoalProgress) {
    if (goal.target > 0) {
      const behindPercent = ((goal.target - goal.current) / goal.target) * 100;
      if (behindPercent >= GOAL_SLACK_THRESHOLD && goal.current < goal.target) {
        return {
          id: `goal_slack_${Date.now()}`,
          type: 'goal_slack',
          severity: 'high',
          description: `今日目标完成度 ${((goal.current / goal.target) * 100).toFixed(0)}%`,
          value: Math.round(behindPercent),
          threshold: GOAL_SLACK_THRESHOLD,
          detectedAt: Date.now(),
        };
      }
    }
  }

  // Check weekly goals
  for (const goal of weeklyGoalProgress) {
    if (goal.target > 0) {
      const behindPercent = ((goal.target - goal.current) / goal.target) * 100;
      if (behindPercent >= GOAL_SLACK_THRESHOLD && goal.current < goal.target) {
        return {
          id: `goal_slack_${Date.now()}`,
          type: 'goal_slack',
          severity: 'medium',
          description: `本周目标完成度 ${((goal.current / goal.target) * 100).toFixed(0)}%`,
          value: Math.round(behindPercent),
          threshold: GOAL_SLACK_THRESHOLD,
          detectedAt: Date.now(),
        };
      }
    }
  }

  return null;
}

/**
 * Calculate streak broken signal from review streak data.
 * Detects when user hasn't reviewed for 2+ days (streak at risk).
 */
export function calculateStreakBrokenSignal(
  lastReviewDate: string | null,
  currentStreak: number
): ChurnSignal | null {
  if (lastReviewDate === null) {
    return null; // No streak data yet
  }

  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  // Streak is broken if last review was before yesterday
  if (lastReviewDate < yesterday) {
    const lastReview = new Date(lastReviewDate);
    const diffTime = Math.abs(new Date(today).getTime() - lastReview.getTime());
    const daysSince = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (daysSince >= STREAK_BROKEN_THRESHOLD_DAYS) {
      return {
        id: `streak_broken_${Date.now()}`,
        type: 'streak_broken',
        severity: 'high',
        description: `连续学习已中断 ${daysSince} 天`,
        value: daysSince,
        threshold: STREAK_BROKEN_THRESHOLD_DAYS,
        detectedAt: Date.now(),
      };
    }
  }

  // Streak is at risk if last review was yesterday (still high severity)
  if (lastReviewDate === yesterday && currentStreak > 0) {
    return {
      id: `streak_broken_${Date.now()}`,
      type: 'streak_broken',
      severity: 'high',
      description: '连续学习 streak 面临中断风险',
      value: 1,
      threshold: STREAK_BROKEN_THRESHOLD_DAYS,
      detectedAt: Date.now(),
    };
  }

  return null;
}

/**
 * Calculate all churn signals from available data sources.
 * Pure function with no side effects.
 */
export function calculateChurnSignals(params: {
  history: SessionHistory[];
  overdueCount: number;
  dailyGoalProgress: { current: number; target: number }[];
  weeklyGoalProgress: { current: number; target: number }[];
  lastReviewDate: string | null;
  currentStreak: number;
}): ChurnSignal[] {
  const signals: ChurnSignal[] = [];

  // Calculate each signal type
  const sessionGapSignal = calculateSessionGapSignal(params.history);
  if (sessionGapSignal) signals.push(sessionGapSignal);

  const reviewBacklogSignal = calculateReviewBacklogSignal(params.overdueCount);
  if (reviewBacklogSignal) signals.push(reviewBacklogSignal);

  const accuracyDropSignal = calculateAccuracyDropSignal(params.history);
  if (accuracyDropSignal) signals.push(accuracyDropSignal);

  const goalSlackSignal = calculateGoalSlackSignal(params.dailyGoalProgress, params.weeklyGoalProgress);
  if (goalSlackSignal) signals.push(goalSlackSignal);

  const streakBrokenSignal = calculateStreakBrokenSignal(params.lastReviewDate, params.currentStreak);
  if (streakBrokenSignal) signals.push(streakBrokenSignal);

  return signals;
}

/**
 * Determine churn risk level based on detected signals.
 * Rules:
 * - critical if any signal is critical OR 3+ high signals
 * - high if 2+ high signals OR 1 critical
 * - medium if 1+ signals
 * - low if no signals
 */
export function getChurnRiskLevel(signals: ChurnSignal[]): ChurnRiskLevel {
  if (signals.length === 0) {
    return 'low';
  }

  const criticalCount = signals.filter(s => s.severity === 'critical').length;
  const highCount = signals.filter(s => s.severity === 'high').length;

  // Critical: any critical signal OR 3+ high signals
  if (criticalCount > 0 || highCount >= 3) {
    return 'critical';
  }

  // High: 2+ high signals
  if (highCount >= 2) {
    return 'high';
  }

  // Medium: at least 1 signal (any severity)
  return 'medium';
}

/**
 * Get top N risk factors sorted by severity.
 * Severity order: critical > high > medium
 */
export function getTopRiskFactors(signals: ChurnSignal[], count: number = 2): ChurnSignal[] {
  const severityOrder: Record<SignalSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
  };

  return [...signals]
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, count);
}

/**
 * Generate churn assessment from detected signals.
 * Pure function with no side effects.
 */
export function generateChurnAssessment(params: {
  history: SessionHistory[];
  overdueCount: number;
  dailyGoalProgress: { current: number; target: number }[];
  weeklyGoalProgress: { current: number; target: number }[];
  lastReviewDate: string | null;
  currentStreak: number;
}): ChurnAssessment {
  const signals = calculateChurnSignals(params);
  const riskLevel = getChurnRiskLevel(signals);
  const topRiskFactors = getTopRiskFactors(signals, 2);

  const recommendedAction = getRecommendedAction(riskLevel, topRiskFactors);

  return {
    riskLevel,
    signals,
    topRiskFactors,
    assessedAt: Date.now(),
    recommendedAction,
  };
}

/**
 * Get recommended action based on risk level and top factors.
 */
function getRecommendedAction(
  riskLevel: ChurnRiskLevel,
  topFactors: ChurnSignal[]
): string | undefined {
  if (riskLevel === 'low') {
    return undefined;
  }

  if (topFactors.length === 0) {
    return '开始练习保持学习节奏';
  }

  // Customize action based on top factor type
  const topType = topFactors[0].type;

  switch (topType) {
    case 'session_gap':
      return '今天开始练习恢复节奏';
    case 'review_backlog':
      return '完成复习队列中的题目';
    case 'accuracy_drop':
      return '通过练习巩固知识点';
    case 'goal_slack':
      return '完成今日学习目标';
    case 'streak_broken':
      return '开始今日练习延续 streak';
    default:
      return '开始练习保持学习节奏';
  }
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for detecting and managing user churn signals.
 * Combines data from multiple hooks to generate comprehensive churn assessment.
 */
export function useChurnSignals(params: {
  history: SessionHistory[];
  overdueCount: number;
  dailyGoalProgress: { current: number; target: number }[];
  weeklyGoalProgress: { current: number; target: number }[];
  lastReviewDate: string | null;
  currentStreak: number;
}): {
  assessment: ChurnAssessment;
  signals: ChurnSignal[];
  riskLevel: ChurnRiskLevel;
  topRiskFactors: ChurnSignal[];
  shouldShowBanner: boolean;
} {
  // Extract dependency values to avoid complex expressions in useMemo deps
  const historyLength = params.history.length;
  const overdueCount = params.overdueCount;
  const dailyGoalProgressStr = params.dailyGoalProgress.map(g => `${g.current}:${g.target}`).join(',');
  const weeklyGoalProgressStr = params.weeklyGoalProgress.map(g => `${g.current}:${g.target}`).join(',');
  const lastReviewDate = params.lastReviewDate;
  const currentStreak = params.currentStreak;

  const assessment = useMemo(
    () => generateChurnAssessment(params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      historyLength,
      overdueCount,
      dailyGoalProgressStr,
      weeklyGoalProgressStr,
      lastReviewDate,
      currentStreak,
    ]
  );

  // Banner should show for high or critical risk levels
  const shouldShowBanner = assessment.riskLevel === 'high' || assessment.riskLevel === 'critical';

  return {
    assessment,
    signals: assessment.signals,
    riskLevel: assessment.riskLevel,
    topRiskFactors: assessment.topRiskFactors,
    shouldShowBanner,
  };
}

export default useChurnSignals;