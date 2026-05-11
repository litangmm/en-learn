import { useMemo } from 'react';
import { storage } from '@/services/storage';
import { LEVEL_THRESHOLDS, type XPProfile } from '@/data/types';

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
}

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
    };
  }, []);
}