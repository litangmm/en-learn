import { useMemo } from 'react';
import { storage } from '@/services/storage';
import { LEVEL_THRESHOLDS, type XPProfile, type PracticeMode, type ModeAccuracy, type DailyTrend } from '@/data/types';

export interface ProgressStats {
  xp: XPProfile;
  level: number;
  totalXP: number;
  currentXP: number;
  progressToNextLevel: number;
  learningDays: number;
  totalAccuracy: number;
  completedDictionaries: number;
  totalQuestions: number;
  totalCorrect: number;
  modeAccuracy: ModeAccuracy[];
}

/** All practice modes for radar chart */
export const ALL_MODES: PracticeMode[] = ['fill-in-blanks', 'multiple-choice', 'sentence-reorder', 'dictation'];

/** Chinese labels for practice modes */
export const MODE_LABELS: Record<PracticeMode, string> = {
  'fill-in-blanks': '填空',
  'multiple-choice': '选择',
  'sentence-reorder': '排序',
  'dictation': '听写',
};

/** Day name labels */
const DAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/**
 * Hook that derives progress statistics from storage data.
 * Provides XP profile, learning days, accuracy, and dictionary completion stats.
 */
export function useProgressStats(): ProgressStats {
  return useMemo(() => {
    // Get XP profile from storage
    const xpProfile = storage.getXPProfile();

    // Calculate level info
    const { totalXP, currentLevel } = xpProfile;

    // Calculate current XP within current level
    const thresholds = LEVEL_THRESHOLDS as unknown as number[];
    const prevThreshold = currentLevel > 1 ? thresholds[currentLevel - 2] : 0;
    const currentXP = totalXP - prevThreshold;

    // Calculate progress to next level
    const nextThreshold = thresholds[currentLevel - 1] || thresholds[thresholds.length - 1];
    const progressToNextLevel = currentLevel >= thresholds.length
      ? 100
      : Math.round(((totalXP - prevThreshold) / (nextThreshold - prevThreshold)) * 100);

    // Get history for learning days and accuracy
    const history = storage.getHistory();

    // Calculate learning days (unique dates from history)
    const uniqueDates = new Set<string>();
    history.forEach(entry => {
      const date = new Date(entry.timestamp).toISOString().split('T')[0];
      uniqueDates.add(date);
    });

    // Also include today if there's any XP (current session)
    if (totalXP > 0) {
      const today = new Date().toISOString().split('T')[0];
      uniqueDates.add(today);
    }

    const learningDays = uniqueDates.size;

    // Calculate total accuracy from history
    let totalQuestions = 0;
    let totalCorrect = 0;
    history.forEach(entry => {
      totalQuestions += entry.totalQuestions;
      totalCorrect += entry.correctCount;
    });

    // Add badge progress for additional stats
    const badgeProgress = storage.getBadgeProgress();
    totalQuestions += badgeProgress.totalAnswered;
    totalCorrect += badgeProgress.totalCorrect;

    const totalAccuracy = totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

    // Count completed dictionaries (dictionaries with history entries)
    const completedDictIds = new Set<string>();
    history.forEach(entry => {
      completedDictIds.add(entry.dictionaryId);
    });

    const completedDictionaries = completedDictIds.size;

    return {
      xp: xpProfile,
      level: currentLevel,
      totalXP,
      currentXP,
      progressToNextLevel,
      learningDays,
      totalAccuracy,
      completedDictionaries,
      totalQuestions,
      totalCorrect,
      modeAccuracy: getModeAccuracy(),
    };
  }, []);
}

/**
 * Get mode accuracy data for the radar chart.
 * Since SessionHistory doesn't store mode, we use the XP profile to derive overall stats
 * and distribute based on practice patterns. For now, return uniform distribution
 * with actual totals, as mode-specific tracking is not available.
 */
export function getModeAccuracy(): ModeAccuracy[] {
  const badgeProgress = storage.getBadgeProgress();
  const totalAnswered = badgeProgress.totalAnswered;
  const totalCorrect = badgeProgress.totalCorrect;

  // Since we don't have per-mode tracking in storage yet,
  // distribute total stats evenly across modes for radar display.
  // This provides a baseline; future iterations can add per-mode tracking.
  return ALL_MODES.map(mode => ({
    mode,
    accuracy: totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0,
    totalQuestions: totalAnswered,
    correctCount: totalCorrect,
  }));
}

/**
 * Get daily XP trend for the past N days.
 * Returns array of daily data with XP, questions, and accuracy.
 */
export function getDailyXP(days: number = 7): DailyTrend[] {
  const history = storage.getHistory();
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