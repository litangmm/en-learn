import { useMemo } from 'react';
import { storage } from '@/services/storage';
import { LEVEL_THRESHOLDS, MILESTONE_DEFINITIONS, type XPProfile, type PracticeMode, type Milestone } from '@/data/types';
import { ALL_MODES } from './useProgressStats';

/**
 * Mode-specific accuracy breakdown.
 */
export interface ModeAccuracyBreakdown {
  mode: PracticeMode;
  accuracy: number;
  totalQuestions: number;
  correctCount: number;
}

/**
 * Unlocked milestone with details.
 */
export interface UnlockedMilestoneInfo {
  id: string;
  title: string;
  titleEn: string;
  icon: string;
  xpReward: number;
  requiredDays: number;
  unlockedAt: number;
}

/**
 * Badge progress summary.
 */
export interface BadgeProgressSummary {
  totalAnswered: number;
  totalCorrect: number;
  totalSessions: number;
  maxStreakEver: number;
  perfectSessions: number;
  totalReviews: number;
  totalChallengesCompleted: number;
}

/**
 * Level and XP profile summary.
 */
export interface XPProfileSummary {
  totalXP: number;
  currentLevel: number;
  currentXP: number;
  progressToNextLevel: number;
  nextLevelXP: number | null;
  isMaxLevel: boolean;
}

/**
 * Comprehensive learning profile data.
 * Aggregates all learning data from XPProfile, SessionHistory, ModeStats, BadgeProgress, and Milestones.
 */
export interface LearningProfile {
  /** Total unique learning days from history dates */
  totalLearningDays: number;
  /** Total questions answered across all sources */
  totalQuestions: number;
  /** Total correct answers */
  totalCorrect: number;
  /** Overall accuracy percentage (0-100) */
  totalAccuracy: number;
  /** Maximum streak ever achieved */
  maxStreakEver: number;
  /** XP and level profile summary */
  xpProfile: XPProfileSummary;
  /** Mode-specific accuracy breakdown for all 4 modes */
  modeAccuracyBreakdown: ModeAccuracyBreakdown[];
  /** Unlocked milestones with details and unlock dates */
  unlockedMilestones: UnlockedMilestoneInfo[];
  /** Badge progress summary */
  badgeProgress: BadgeProgressSummary;
  /** Number of unlocked milestones */
  unlockedMilestoneCount: number;
  /** Number of total milestones defined */
  totalMilestones: number;
  /** Whether user has any learning activity */
  hasActivity: boolean;
}

/**
 * Get mode accuracy breakdown from mode stats.
 */
function getModeAccuracyBreakdown(): ModeAccuracyBreakdown[] {
  const modeStats = storage.getModeStats();
  const badgeProgress = storage.getBadgeProgress();
  const history = storage.getHistory();

  // Check if we have any mode-specific data
  const hasModeData = Object.keys(modeStats).length > 0;

  // Calculate fallback values from history if no mode stats exist
  const historyModeStats: Partial<Record<PracticeMode, { questions: number; correct: number }>> = {};
  history.forEach(entry => {
    if (entry.mode) {
      if (!historyModeStats[entry.mode]) {
        historyModeStats[entry.mode] = { questions: 0, correct: 0 };
      }
      const stats = historyModeStats[entry.mode]!;
      stats.questions += entry.totalQuestions;
      stats.correct += entry.correctCount;
    }
  });

  // Use mode stats if available, otherwise fall back to history mode stats or badge progress
  return ALL_MODES.map(mode => {
    let questions = 0;
    let correct = 0;

    if (hasModeData && modeStats[mode]) {
      const stats = modeStats[mode]!;
      questions = stats.questions;
      correct = stats.correct;
    } else if (historyModeStats[mode]) {
      const stats = historyModeStats[mode]!;
      questions = stats.questions;
      correct = stats.correct;
    } else {
      // Fallback: distribute badge progress uniformly across modes
      questions = badgeProgress.totalAnswered;
      correct = badgeProgress.totalCorrect;
    }

    const accuracy = questions > 0 ? Math.round((correct / questions) * 100) : 0;

    return {
      mode,
      accuracy,
      totalQuestions: questions,
      correctCount: correct,
    };
  });
}

/**
 * Get XP profile summary.
 */
function getXPProfileSummary(xpProfile: XPProfile): XPProfileSummary {
  const { totalXP, currentLevel } = xpProfile;
  const thresholds = LEVEL_THRESHOLDS as unknown as number[];
  const maxLevel = thresholds.length;

  // Calculate current XP within current level
  const prevThreshold = currentLevel > 1 ? thresholds[currentLevel - 2] : 0;
  const currentXP = totalXP - prevThreshold;

  // Calculate progress to next level
  const isMaxLevel = currentLevel >= maxLevel;
  const nextThreshold = isMaxLevel ? null : thresholds[currentLevel - 1];

  let progressToNextLevel: number;
  if (isMaxLevel) {
    progressToNextLevel = 100;
  } else {
    // Handle edge case where prevThreshold equals nextThreshold (shouldn't happen with valid thresholds)
    const range = nextThreshold! - prevThreshold;
    if (range <= 0) {
      progressToNextLevel = 0;
    } else {
      progressToNextLevel = Math.round(((totalXP - prevThreshold) / range) * 100);
    }
  }

  return {
    totalXP,
    currentLevel,
    currentXP,
    progressToNextLevel: Math.min(100, Math.max(0, progressToNextLevel)),
    nextLevelXP: nextThreshold,
    isMaxLevel,
  };
}

/**
 * Get unlocked milestones with details.
 */
function getUnlockedMilestoneInfo(unlockedMilestones: Milestone[]): UnlockedMilestoneInfo[] {
  return unlockedMilestones.map(milestone => {
    const definition = MILESTONE_DEFINITIONS.find(def => def.id === milestone.id);
    return {
      id: milestone.id,
      title: definition?.title ?? milestone.id,
      titleEn: definition?.titleEn ?? '',
      icon: definition?.icon ?? '🏆',
      xpReward: definition?.xpReward ?? 0,
      requiredDays: definition?.requiredDays ?? 0,
      unlockedAt: milestone.unlockedAt,
    };
  }).sort((a, b) => a.unlockedAt - b.unlockedAt);
}

/**
 * Calculate total learning days from history.
 */
function calculateTotalLearningDays(): number {
  const history = storage.getHistory();
  const xpProfile = storage.getXPProfile();

  // Calculate unique dates from history
  const uniqueDates = new Set<string>();
  history.forEach(entry => {
    const date = new Date(entry.timestamp).toISOString().split('T')[0];
    uniqueDates.add(date);
  });

  // Also include today if there's any XP (current session)
  if (xpProfile.totalXP > 0) {
    const today = new Date().toISOString().split('T')[0];
    uniqueDates.add(today);
  }

  return uniqueDates.size;
}

/**
 * Calculate total questions and correct answers.
 */
function calculateTotalQuestionsAndCorrect(): { totalQuestions: number; totalCorrect: number } {
  const history = storage.getHistory();
  const badgeProgress = storage.getBadgeProgress();

  let totalQuestions = 0;
  let totalCorrect = 0;

  // Add from history
  history.forEach(entry => {
    totalQuestions += entry.totalQuestions;
    totalCorrect += entry.correctCount;
  });

  // Add from badge progress (to avoid double counting with history, we rely on badge progress
  // as the canonical source for cumulative totals, and history for session details)
  // Note: badge progress is already counted via mode stats in useProgressStats,
  // but here we use it directly as it's the cumulative record
  totalQuestions = badgeProgress.totalAnswered;
  totalCorrect = badgeProgress.totalCorrect;

  return { totalQuestions, totalCorrect };
}

/**
 * Hook that provides a comprehensive learning profile by aggregating data from:
 * - XPProfile (XP and level progress)
 * - SessionHistory (learning days, questions, accuracy)
 * - ModeStats (per-mode accuracy breakdown)
 * - BadgeProgress (cumulative stats, max streak)
 * - Milestones (unlocked milestones with details)
 *
 * This hook is read-only and derives all data from storage using useMemo.
 * It doesn't trigger any storage updates.
 */
export function useLearningProfile(): LearningProfile {
  return useMemo(() => {
    // Get all data from storage
    const xpProfile = storage.getXPProfile();
    const badgeProgress = storage.getBadgeProgress();
    const milestonesState = storage.getMilestones();

    // Calculate XP profile summary
    const xpProfileSummary = getXPProfileSummary(xpProfile);

    // Calculate total learning days
    const totalLearningDays = calculateTotalLearningDays();

    // Calculate total questions and correct answers
    const { totalQuestions, totalCorrect } = calculateTotalQuestionsAndCorrect();

    // Calculate overall accuracy
    const totalAccuracy = totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

    // Get mode accuracy breakdown
    const modeAccuracyBreakdown = getModeAccuracyBreakdown();

    // Get unlocked milestones with details
    const unlockedMilestones = getUnlockedMilestoneInfo(milestonesState.unlockedMilestones);

    // Get badge progress summary
    const badgeProgressSummary: BadgeProgressSummary = {
      totalAnswered: badgeProgress.totalAnswered,
      totalCorrect: badgeProgress.totalCorrect,
      totalSessions: badgeProgress.totalSessions,
      maxStreakEver: badgeProgress.maxStreakEver,
      perfectSessions: badgeProgress.perfectSessions,
      totalReviews: badgeProgress.totalReviews,
      totalChallengesCompleted: badgeProgress.totalChallengesCompleted,
    };

    // Check if user has any activity
    const hasActivity = totalQuestions > 0 || xpProfile.totalXP > 0 || milestonesState.unlockedMilestones.length > 0;

    return {
      totalLearningDays,
      totalQuestions,
      totalCorrect,
      totalAccuracy,
      maxStreakEver: badgeProgress.maxStreakEver,
      xpProfile: xpProfileSummary,
      modeAccuracyBreakdown,
      unlockedMilestones,
      badgeProgress: badgeProgressSummary,
      unlockedMilestoneCount: unlockedMilestones.length,
      totalMilestones: MILESTONE_DEFINITIONS.length,
      hasActivity,
    };
  }, []);
}