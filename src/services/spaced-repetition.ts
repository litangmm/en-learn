import { REVIEW_INTERVALS } from '@/data/types';
import type { ReviewResult } from '@/data/types';

/**
 * Maximum review interval in days (cap for the spaced repetition algorithm)
 */
export const MAX_INTERVAL_DAYS = 30;

/**
 * Calculates the next review interval based on the current interval and answer correctness.
 *
 * SM-2 algorithm variant:
 * - On correct answer: interval doubles (1→2→4→8→16→30), capped at 30
 * - On incorrect answer: reset to 1 day
 *
 * @param currentInterval - Current interval in days (0 = first review)
 * @param isCorrect - Whether the user answered correctly
 * @returns The new interval in days
 */
export function calculateNextReviewInterval(
  currentInterval: number,
  isCorrect: boolean
): number {
  // First review ever (no previous interval)
  if (currentInterval === 0) {
    return isCorrect ? 1 : 1;
  }

  if (isCorrect) {
    // Double the interval, capped at MAX_INTERVAL_DAYS
    const doubled = currentInterval * 2;
    return Math.min(doubled, MAX_INTERVAL_DAYS);
  }

  // Wrong answer: reset to 1 day
  return 1;
}

/**
 * Calculates the next review date based on current time and interval.
 *
 * @param intervalDays - Interval in days
 * @returns Timestamp (milliseconds) for the next review
 */
export function calculateNextReviewDate(intervalDays: number): number {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  return now + intervalDays * oneDayMs;
}

/**
 * Creates a ReviewResult from an answer outcome.
 *
 * @param isCorrect - Whether the user answered correctly
 * @param interval - The interval used for this review (before calculating next)
 * @returns A complete ReviewResult object
 */
export function createReviewResult(
  isCorrect: boolean,
  interval: number
): ReviewResult {
  return {
    timestamp: Date.now(),
    isCorrect,
    interval,
    nextReviewDate: calculateNextReviewDate(
      calculateNextReviewInterval(interval, isCorrect)
    ),
  };
}

/**
 * Gets all items that are due for review.
 * Filters mistakes by:
 * 1. No nextReviewAt set (never reviewed, always due)
 * 2. nextReviewAt <= now (past due)
 *
 * @param mistakes - Array of Mistake objects
 * @returns Array of Mistake objects that need review
 */
export function getDueReviewItems<T extends { nextReviewAt?: number }>(
  mistakes: T[]
): T[] {
  const now = Date.now();
  return mistakes.filter(
    (m) => m.nextReviewAt === undefined || m.nextReviewAt <= now
  );
}

/**
 * Calculates the current interval for a mistake based on reviewedCount.
 * Maps reviewedCount to REVIEW_INTERVALS array.
 *
 * @param reviewedCount - Number of times this item has been reviewed
 * @returns Current interval in days
 */
export function getCurrentInterval(reviewedCount: number): number {
  return REVIEW_INTERVALS[Math.min(reviewedCount, REVIEW_INTERVALS.length - 1)];
}

/**
 * Gets the current next review date for a mistake.
 * Falls back to 'now' (due immediately) if not set.
 *
 * @param mistake - Mistake object
 * @returns Timestamp of next review (or 0 if not set, meaning due now)
 */
export function getNextReviewTimestamp(mistake: { nextReviewAt?: number }): number {
  return mistake.nextReviewAt ?? 0;
}

/**
 * Checks if an item is due for review based on its nextReviewAt field.
 *
 * @param nextReviewAt - Next review timestamp (or undefined for never reviewed)
 * @returns true if the item should be reviewed now
 */
export function isDue(nextReviewAt?: number): boolean {
  if (nextReviewAt === undefined) {
    return true; // Never reviewed, always due
  }
  return nextReviewAt <= Date.now();
}