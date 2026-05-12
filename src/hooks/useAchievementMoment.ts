import { useState, useCallback } from 'react';
import type { AchievementMoment, AchievementMomentType, BadgeDefinition } from '@/data/types';
import { LEVEL_THRESHOLDS } from '@/data/types';

// Streak milestone thresholds
const STREAK_MILESTONES = [7, 14, 30, 100] as const;

// XP milestone thresholds
const XP_MILESTONES = [100, 500, 1000, 2000, 5000, 10000] as const;

// Perfect session minimum questions
const PERFECT_SESSION_MIN_QUESTIONS = 5;

// Achievement moment priorities (lower number = higher priority)
const MOMENT_PRIORITIES: Record<AchievementMomentType, number> = {
  'perfect-session': 1,
  'level-up': 2,
  'streak-milestone': 3,
  'badge-unlock': 4,
  'xp-milestone': 5,
};

interface UseAchievementMomentReturn {
  /** Current pending achievement moment */
  currentMoment: AchievementMoment | null;
  /** Check if there's an unshown moment */
  hasUnshownMoment: () => boolean;
  /** Acknowledge and clear the current moment */
  acknowledgeMoment: () => void;
  /** Check for level-up achievement */
  checkLevelUp: (_oldLevel: number, _newLevel: number) => AchievementMoment | null;
  /** Check for badge unlock achievement */
  checkBadgeUnlock: (_badge: BadgeDefinition) => AchievementMoment | null;
  /** Check for streak milestone achievement */
  checkStreakMilestone: (_streak: number) => AchievementMoment | null;
  /** Check for XP milestone achievement */
  checkXPMilestone: (_totalXP: number, _totalCorrect: number, _accuracy: number) => AchievementMoment | null;
  /** Check for perfect session achievement */
  checkPerfectSession: (_score: number, _totalQuestions: number, _streak: number) => AchievementMoment | null;
  /** Set current moment (used by App.tsx) */
  setCurrentMoment: (_moment: AchievementMoment | null) => void;
}

/**
 * Get subtitle for streak milestone
 */
function getStreakSubtitle(streak: number): string {
  if (streak >= 100) return '百日坚持，滴水穿石！';
  if (streak >= 30) return '一个月坚持，你真棒！';
  if (streak >= 14) return '两周坚持，养成好习惯！';
  return '一周坚持，继续加油！';
}

/**
 * Hook for detecting and managing achievement moments.
 * Encapsulates achievement detection logic with deduplication and priority ordering.
 * Does not persist any data - only manages in-memory state.
 */
export function useAchievementMoment(): UseAchievementMomentReturn {
  // Track shown moment IDs to prevent duplicates
  const [shownMomentIds, setShownMomentIds] = useState<Set<string>>(new Set());

  // Current pending moment
  const [currentMoment, setCurrentMomentState] = useState<AchievementMoment | null>(null);

  // Store the last checked milestone values to avoid re-triggering
  const [lastStreakMilestone, setLastStreakMilestone] = useState<number>(0);
  const [lastXPMilestone, setLastXPMilestone] = useState<number>(0);

  /**
   * Check if a moment has already been shown
   */
  const isMomentShown = useCallback((momentId: string): boolean => {
    return shownMomentIds.has(momentId);
  }, [shownMomentIds]);

  /**
   * Mark a moment as shown
   */
  const markMomentShown = useCallback((momentId: string) => {
    setShownMomentIds(prev => {
      const next = new Set(prev);
      next.add(momentId);
      return next;
    });
  }, []);

  /**
   * Check for level-up achievement
   */
  const checkLevelUp = useCallback((
    _oldLevel: number,
    newLevel: number
  ): AchievementMoment | null => {
    if (newLevel <= _oldLevel) return null;

    const momentId = `levelup-${newLevel}`;
    if (isMomentShown(momentId)) return null;

    // Calculate next XP needed for display
    const currentThreshold = LEVEL_THRESHOLDS[newLevel] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    const previousThreshold = LEVEL_THRESHOLDS[newLevel - 1] ?? 0;
    const nextXP = currentThreshold - previousThreshold;

    const moment: AchievementMoment = {
      id: momentId,
      type: 'level-up',
      title: `恭喜升级到 Lv.${newLevel}！`,
      subtitle: `继续加油，下一等级还需 ${nextXP} XP`,
      level: newLevel,
      createdAt: Date.now(),
    };

    markMomentShown(momentId);
    return moment;
  }, [isMomentShown, markMomentShown]);

  /**
   * Check for badge unlock achievement
   */
  const checkBadgeUnlock = useCallback((
    badge: BadgeDefinition
  ): AchievementMoment | null => {
    const momentId = `badge-${badge.id}`;
    if (isMomentShown(momentId)) return null;

    const moment: AchievementMoment = {
      id: momentId,
      type: 'badge-unlock',
      title: `解锁成就: ${badge.title}`,
      subtitle: badge.description,
      badgeId: badge.id,
      badgeTitle: badge.title,
      badgeIcon: badge.icon,
      createdAt: Date.now(),
    };

    markMomentShown(momentId);
    return moment;
  }, [isMomentShown, markMomentShown]);

  /**
   * Check for streak milestone achievement
   */
  const checkStreakMilestone = useCallback((
    streak: number
  ): AchievementMoment | null => {
    // Find the milestone this streak reached
    const milestone = STREAK_MILESTONES.find(m => m <= streak);
    if (!milestone) return null;

    // Check if this milestone was already triggered
    if (milestone <= lastStreakMilestone) return null;

    const momentId = `streak-${milestone}`;
    if (isMomentShown(momentId)) return null;

    setLastStreakMilestone(milestone);

    const subtitle = getStreakSubtitle(streak);
    const moment: AchievementMoment = {
      id: momentId,
      type: 'streak-milestone',
      title: `🔥 连续学习 ${streak} 天！`,
      subtitle,
      streak,
      createdAt: Date.now(),
    };

    markMomentShown(momentId);
    return moment;
  }, [isMomentShown, markMomentShown, lastStreakMilestone]);

  /**
   * Check for XP milestone achievement
   */
  const checkXPMilestone = useCallback((
    totalXP: number,
    totalCorrect: number,
    accuracy: number
  ): AchievementMoment | null => {
    // Find the highest milestone this XP reached
    const milestone = [...XP_MILESTONES]
      .reverse()
      .find(m => totalXP >= m);

    if (!milestone) return null;

    // Check if this milestone was already triggered
    if (milestone <= lastXPMilestone) return null;

    const momentId = `xp-${milestone}`;
    if (isMomentShown(momentId)) return null;

    setLastXPMilestone(milestone);

    const moment: AchievementMoment = {
      id: momentId,
      type: 'xp-milestone',
      title: `积累 ${milestone.toLocaleString()} XP，里程碑达成！`,
      subtitle: `已解答 ${totalCorrect} 道题，正确率 ${Math.round(accuracy)}%`,
      xp: milestone,
      totalCorrect,
      accuracy: Math.round(accuracy),
      createdAt: Date.now(),
    };

    markMomentShown(momentId);
    return moment;
  }, [isMomentShown, markMomentShown, lastXPMilestone]);

  /**
   * Check for perfect session achievement
   */
  const checkPerfectSession = useCallback((
    score: number,
    totalQuestions: number,
    streak: number
  ): AchievementMoment | null => {
    // Perfect session requires: all questions correct AND at least minimum questions
    if (totalQuestions < PERFECT_SESSION_MIN_QUESTIONS) return null;
    if (score < totalQuestions * 10) return null; // 10 points per question

    const momentId = `perfect-session-${Date.now()}`;
    if (isMomentShown(momentId)) return null;

    const moment: AchievementMoment = {
      id: momentId,
      type: 'perfect-session',
      title: '满分答完一轮练习！',
      subtitle: `${totalQuestions}/${totalQuestions} 正确率${streak > 0 ? `，${streak} 连击` : ''}`,
      accuracy: 100,
      streak,
      createdAt: Date.now(),
    };

    markMomentShown(momentId);
    return moment;
  }, [isMomentShown, markMomentShown]);

  /**
   * Check if there's an unshown moment
   */
  const hasUnshownMoment = useCallback((): boolean => {
    return currentMoment !== null;
  }, [currentMoment]);

  /**
   * Acknowledge and clear the current moment
   */
  const acknowledgeMoment = useCallback(() => {
    setCurrentMomentState(null);
  }, []);

  /**
   * Set the current moment (used by App.tsx to trigger display)
   */
  const setCurrentMoment = useCallback((moment: AchievementMoment | null) => {
    setCurrentMomentState(moment);
  }, []);

  return {
    currentMoment,
    hasUnshownMoment,
    acknowledgeMoment,
    checkLevelUp,
    checkBadgeUnlock,
    checkStreakMilestone,
    checkXPMilestone,
    checkPerfectSession,
    setCurrentMoment,
  };
}

/**
 * Sort moments by priority (for handling multiple simultaneous moments)
 */
export function sortMomentsByPriority(moments: AchievementMoment[]): AchievementMoment[] {
  return [...moments].sort((a, b) => {
    const priorityA = MOMENT_PRIORITIES[a.type] ?? 999;
    const priorityB = MOMENT_PRIORITIES[b.type] ?? 999;
    return priorityA - priorityB;
  });
}

export default useAchievementMoment;