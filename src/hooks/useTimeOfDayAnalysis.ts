/**
 * useTimeOfDayAnalysis Hook
 *
 * Analyzes learning session data to identify patterns in time-of-day learning efficiency.
 * Groups sessions by time periods and calculates accuracy metrics for each.
 *
 * Time periods (8 segments aligned with daily routine):
 * - 凌晨 (dawn): 0-6
 * - 早晨 (morning): 6-9
 * - 上午 (late morning): 9-12
 * - 中午 (noon): 12-14
 * - 下午 (afternoon): 14-18
 * - 傍晚 (evening): 18-20
 * - 晚上 (night): 20-23
 * - 深夜 (late night): 23-24
 */

import { useMemo } from 'react';
import { storage } from '@/services/storage';
import type { SessionHistory } from '@/data/types';

// Time period definitions
export const TIME_PERIODS = {
  dawn: { id: 'dawn', name: '凌晨', startHour: 0, endHour: 6, emoji: '🌙' },
  morning: { id: 'morning', name: '早晨', startHour: 6, endHour: 9, emoji: '🌅' },
  late_morning: { id: 'late_morning', name: '上午', startHour: 9, endHour: 12, emoji: '☀️' },
  noon: { id: 'noon', name: '中午', startHour: 12, endHour: 14, emoji: '🌞' },
  afternoon: { id: 'afternoon', name: '下午', startHour: 14, endHour: 18, emoji: '🌤️' },
  evening: { id: 'evening', name: '傍晚', startHour: 18, endHour: 20, emoji: '🌆' },
  night: { id: 'night', name: '晚上', startHour: 20, endHour: 23, emoji: '🌃' },
  late_night: { id: 'late_night', name: '深夜', startHour: 23, endHour: 24, emoji: '🌑' },
} as const;

export type TimePeriodId = keyof typeof TIME_PERIODS;

/**
 * Get time period ID from hour (0-23)
 */
export function getTimePeriodId(hour: number): TimePeriodId {
  if (hour >= 0 && hour < 6) return 'dawn';
  if (hour >= 6 && hour < 9) return 'morning';
  if (hour >= 9 && hour < 12) return 'late_morning';
  if (hour >= 12 && hour < 14) return 'noon';
  if (hour >= 14 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 20) return 'evening';
  if (hour >= 20 && hour < 23) return 'night';
  return 'late_night';
}

/**
 * Metrics for a single time period
 */
export interface TimePeriodMetrics {
  periodId: TimePeriodId;
  periodName: string;
  emoji: string;
  /** Number of sessions in this period */
  sessionCount: number;
  /** Total questions answered in this period */
  totalQuestions: number;
  /** Total correct answers in this period */
  correctAnswers: number;
  /** Average accuracy percentage (0-100) */
  averageAccuracy: number;
  /** Total time spent (seconds) */
  totalDuration: number;
  /** Most productive hour in this period (0-23) */
  peakHour: number | null;
}

/**
 * Overall time-of-day analysis result
 */
export interface TimeOfDayAnalysis {
  /** Metrics for each time period that has data */
  periodMetrics: TimePeriodMetrics[];
  /** The time period with highest average accuracy */
  bestPeriod: TimePeriodMetrics | null;
  /** The time period with lowest average accuracy */
  worstPeriod: TimePeriodMetrics | null;
  /** Total sessions analyzed */
  totalSessions: number;
  /** Total learning time (seconds) */
  totalDuration: number;
  /** Whether there's enough data for meaningful analysis */
  hasEnoughData: boolean;
  /** Suggested recommendation based on patterns */
  recommendation: string;
}

/**
 * Calculate metrics for a single time period from sessions
 */
function calculatePeriodMetrics(
  periodId: TimePeriodId,
  sessions: SessionHistory[]
): TimePeriodMetrics {
  // Shared period data map
  const periodMap: Record<TimePeriodId, { name: string; startHour: number; endHour: number; emoji: string }> = {
    dawn: { name: '凌晨', startHour: 0, endHour: 6, emoji: '🌙' },
    morning: { name: '早晨', startHour: 6, endHour: 9, emoji: '🌅' },
    late_morning: { name: '上午', startHour: 9, endHour: 12, emoji: '☀️' },
    noon: { name: '中午', startHour: 12, endHour: 14, emoji: '🌞' },
    afternoon: { name: '下午', startHour: 14, endHour: 18, emoji: '🌤️' },
    evening: { name: '傍晚', startHour: 18, endHour: 20, emoji: '🌆' },
    night: { name: '晚上', startHour: 20, endHour: 23, emoji: '🌃' },
    late_night: { name: '深夜', startHour: 23, endHour: 24, emoji: '🌑' },
  };
  const period = periodMap[periodId];
  if (!period) {
    throw new Error(`Invalid time period ID: ${periodId}`);
  }

  const periodSessions = sessions.filter((session) => {
    const hour = new Date(session.timestamp).getHours();
    return hour >= period.startHour && hour < period.endHour;
  });

  const totalQuestions = periodSessions.reduce((sum, s) => sum + s.totalQuestions, 0);
  const correctAnswers = periodSessions.reduce((sum, s) => sum + s.correctCount, 0);
  const totalDuration = periodSessions.reduce((sum, s) => sum + s.duration, 0);
  const averageAccuracy = totalQuestions > 0
    ? Math.round((correctAnswers / totalQuestions) * 100)
    : 0;

  // Find peak hour (hour with most sessions)
  const hourCounts = new Map<number, number>();
  periodSessions.forEach((session) => {
    const hour = new Date(session.timestamp).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  });
  let peakHour: number | null = null;
  let maxCount = 0;
  hourCounts.forEach((count, hour) => {
    if (count > maxCount) {
      maxCount = count;
      peakHour = hour;
    }
  });

  return {
    periodId,
    periodName: period.name,
    emoji: period.emoji,
    sessionCount: periodSessions.length,
    totalQuestions,
    correctAnswers,
    averageAccuracy,
    totalDuration,
    peakHour,
  };
}

/**
 * Generate recommendation based on time-of-day patterns
 */
function generateRecommendation(
  periodMetrics: TimePeriodMetrics[],
  bestPeriod: TimePeriodMetrics | null
): string {
  // Shared period data map
  const periodMap: Record<TimePeriodId, { name: string; startHour: number; endHour: number; emoji: string }> = {
    dawn: { name: '凌晨', startHour: 0, endHour: 6, emoji: '🌙' },
    morning: { name: '早晨', startHour: 6, endHour: 9, emoji: '🌅' },
    late_morning: { name: '上午', startHour: 9, endHour: 12, emoji: '☀️' },
    noon: { name: '中午', startHour: 12, endHour: 14, emoji: '🌞' },
    afternoon: { name: '下午', startHour: 14, endHour: 18, emoji: '🌤️' },
    evening: { name: '傍晚', startHour: 18, endHour: 20, emoji: '🌆' },
    night: { name: '晚上', startHour: 20, endHour: 23, emoji: '🌃' },
    late_night: { name: '深夜', startHour: 23, endHour: 24, emoji: '🌑' },
  };

  if (periodMetrics.length === 0) {
    return '开始学习后，我们会分析你的最佳学习时段';
  }

  if (periodMetrics.length < 3) {
    return '数据积累中，继续练习以获得更准确的时段分析';
  }

  if (bestPeriod && bestPeriod.sessionCount >= 3) {
    const best = periodMap[bestPeriod.periodId];
    return `你在${best.name}（${best.startHour}:00-${best.endHour}:00）学习效率最高，建议优先安排学习时间`;
  }

  // Check for patterns
  const highAccuracyPeriods = periodMetrics.filter((p) => p.averageAccuracy >= 70);
  if (highAccuracyPeriods.length >= 2) {
    const periodNames = highAccuracyPeriods.map((p) => p.periodName).join('和');
    return `你在${periodNames}时段表现优秀，继续保持！`;
  }

  const lowAccuracyPeriods = periodMetrics.filter((p) => p.sessionCount >= 3 && p.averageAccuracy < 50);
  if (lowAccuracyPeriods.length >= 1) {
    const periodNames = lowAccuracyPeriods.map((p) => p.periodName).join('和');
    return `建议避免在${periodNames}时段进行高强度学习`;
  }

  return '继续保持均匀的学习节奏，你的表现很稳定';
}

/**
 * Hook that analyzes learning patterns by time of day
 */
export function useTimeOfDayAnalysis(): TimeOfDayAnalysis {
  return useMemo(() => {
    const history = storage.getHistory();

    // Calculate metrics for all time periods
    const allPeriodIds: TimePeriodId[] = [
      'dawn',
      'morning',
      'late_morning',
      'noon',
      'afternoon',
      'evening',
      'night',
      'late_night',
    ];

    const periodMetrics = allPeriodIds
      .map((periodId) => calculatePeriodMetrics(periodId, history))
      .filter((metrics) => metrics.sessionCount > 0); // Only include periods with data

    // Find best and worst periods
    const periodsWithEnoughData = periodMetrics.filter((p) => p.sessionCount >= 2);
    const bestPeriod = periodsWithEnoughData.length > 0
      ? periodsWithEnoughData.reduce((best, current) =>
          current.averageAccuracy > best.averageAccuracy ? current : best
        )
      : null;

    const worstPeriod = periodsWithEnoughData.length > 0
      ? periodsWithEnoughData.reduce((worst, current) =>
          current.averageAccuracy < worst.averageAccuracy ? current : worst
        )
      : null;

    const totalSessions = periodMetrics.reduce((sum, p) => sum + p.sessionCount, 0);
    const totalDuration = periodMetrics.reduce((sum, p) => sum + p.totalDuration, 0);

    // Need at least 5 sessions for meaningful analysis
    const hasEnoughData = totalSessions >= 5;

    return {
      periodMetrics,
      bestPeriod,
      worstPeriod,
      totalSessions,
      totalDuration,
      hasEnoughData,
      recommendation: generateRecommendation(periodMetrics, bestPeriod),
    };
  }, []);
}

export default useTimeOfDayAnalysis;
