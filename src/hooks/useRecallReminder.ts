import { useState, useMemo, useCallback } from 'react';
import { useReviewStreak } from './useReviewStreak';
import { useSpacedRepetition } from './useSpacedRepetition';
import { storage } from '@/services/storage';
import { getTodayDateString, getYesterdayDateString } from '@/utils/dateUtils';

/**
 * Recall reminder status
 */
export type RecallReminderStatus = 'idle' | 'due-soon' | 'due-now' | 'streak-at-risk';

/**
 * State returned by useRecallReminder hook
 */
export interface RecallReminderState {
  /** Current reminder status */
  status: RecallReminderStatus;
  /** Number of items due for review */
  dueCount: number;
  /** Timestamp when reminder was last dismissed, or null */
  lastDismissed: number | null;
  /** Dismiss the reminder (sets lastDismissed to now) */
  dismiss: () => void;
  /** Whether the reminder can be shown (not dismissed within 4 hours) */
  canShow: boolean;
}

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

/**
 * Hook that analyzes review streak and spaced repetition data to compute
 * reminder status, preventing spam via lastDismissed timestamp.
 */
export function useRecallReminder(): RecallReminderState {
  const { data: streakData } = useReviewStreak();
  const { dueCount } = useSpacedRepetition();

  const [lastDismissed, setLastDismissed] = useState<number | null>(() => {
    try {
      return storage.getRecallReminderDismissed();
    } catch {
      console.warn('[useRecallReminder] Failed to load dismiss state');
      return null;
    }
  });

  /**
   * Compute whether reminder is still in cooldown period
   */
  const canShow = useMemo(() => {
    if (lastDismissed === null) return true;
    const now = Date.now();
    return now - lastDismissed > FOUR_HOURS_MS;
  }, [lastDismissed]);

  /**
   * Compute reminder status based on rules
   */
  const status = useMemo((): RecallReminderStatus => {
    // Rule 1: If dismissed within last 4 hours, return idle
    if (!canShow) {
      return 'idle';
    }

    // Rule 2: If dueCount === 0, return idle (nothing to review)
    if (dueCount === 0) {
      return 'idle';
    }

    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();
    const lastReviewDate = streakData.lastReviewDate;

    // Rule 3: If streak is active (lastReviewDate === today), return idle
    if (lastReviewDate === today) {
      return 'idle';
    }

    // Rule 4: If lastReviewDate === yesterday AND dueCount > 0, return streak-at-risk
    if (lastReviewDate === yesterday) {
      return 'streak-at-risk';
    }

    // Rule 5: If dueCount > 0 AND (lastReviewDate is older than yesterday OR null), return due-now
    return 'due-now';
  }, [canShow, dueCount, streakData.lastReviewDate]);

  /**
   * Dismiss the reminder (sets lastDismissed to now)
   */
  const dismiss = useCallback(() => {
    const now = Date.now();
    try {
      storage.setRecallReminderDismissed(now);
    } catch (error) {
      console.warn('[useRecallReminder] Failed to save dismiss state:', error);
    }
    setLastDismissed(now);
  }, []);

  return {
    status,
    dueCount,
    lastDismissed,
    dismiss,
    canShow,
  };
}

export default useRecallReminder;
