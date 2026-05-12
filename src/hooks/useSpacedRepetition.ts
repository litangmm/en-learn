import { useState, useCallback, useMemo } from 'react';
import type { Mistake, ReviewResult } from '@/data/types';
import { storage } from '@/services/storage';
import { getDueReviewItems } from '@/services/spaced-repetition';

/**
 * Hook providing spaced repetition scheduling and review queue management.
 *
 * Features:
 * - Lazy-loading access to items due for review
 * - Recording review results with full history tracking
 * - Live due-count for UI badge/indicator display
 * - SM-2 algorithm variant for interval scheduling
 */
export function useSpacedRepetition() {
  /**
   * Current list of due review items. Lazily loaded.
   * Refresh by calling refresh().
   */
  const [dueItems, setDueItems] = useState<Mistake[]>(() =>
    getDueReviewItems(storage.getMistakes())
  );

  /**
   * Refreshes the due items list from storage.
   */
  const refresh = useCallback(() => {
    setDueItems(getDueReviewItems(storage.getMistakes()));
  }, []);

  /**
   * Number of items currently due for review.
   */
  const dueCount = useMemo(() => dueItems.length, [dueItems]);

  /**
   * Records a review result for a sentence.
   *
   * Side effects:
   * - Appends a ReviewResult entry to the mistake's reviewHistory
   * - Updates nextReviewAt and lastReviewedAt
   * - Increments reviewedCount on correct answers
   * - Refreshes the dueItems state
   *
   * @param sentenceId - The sentence that was reviewed
   * @param isCorrect - Whether the user answered correctly
   */
  const recordReviewResult = useCallback((sentenceId: string, isCorrect: boolean) => {
    // Use the canonical storage method for updating review results
    const updated = storage.updateMistakeReviewResult(sentenceId, isCorrect);
    if (updated) {
      // Refresh due items to reflect new scheduling
      refresh();
    }
  }, [refresh]);

  /**
   * Gets the review history for a specific sentence.
   *
   * @param sentenceId - The sentence ID
   * @returns Array of ReviewResult entries, or empty array if none
   */
  const getReviewHistory = useCallback((sentenceId: string): ReviewResult[] => {
    const mistakes = storage.getMistakes();
    const mistake = mistakes.find((m) => m.sentenceId === sentenceId);
    return mistake?.reviewHistory ?? [];
  }, []);

  /**
   * Checks if a sentence is due for review.
   *
   * @param sentenceId - The sentence ID
   * @returns true if the item is due (or never reviewed)
   */
  const isDue = useCallback((sentenceId: string): boolean => {
    const mistakes = storage.getMistakes();
    const mistake = mistakes.find((m) => m.sentenceId === sentenceId);
    if (!mistake) return false;
    return mistake.nextReviewAt === undefined || mistake.nextReviewAt <= Date.now();
  }, []);

  /**
   * Gets the next review date for a specific sentence.
   *
   * @param sentenceId - The sentence ID
   * @returns Timestamp of next review, or null if never scheduled
   */
  const getNextReviewDate = useCallback((sentenceId: string): number | null => {
    const mistakes = storage.getMistakes();
    const mistake = mistakes.find((m) => m.sentenceId === sentenceId);
    return mistake?.nextReviewAt ?? null;
  }, []);

  /**
   * Gets all mistakes for a given dictionary.
   *
   * @param dictionaryId - The dictionary ID to filter by
   * @returns Array of Mistake objects
   */
  const getMistakesByDictionary = useCallback((dictionaryId: string): Mistake[] => {
    return storage.getMistakes().filter((m) => m.dictionaryId === dictionaryId);
  }, []);

  return {
    /** Current list of items due for review */
    dueItems,
    /** Number of items due for review */
    dueCount,
    /** Refresh dueItems from storage */
    refresh,
    /** Record a review result and update scheduling */
    recordReviewResult,
    /** Get review history for a specific sentence */
    getReviewHistory,
    /** Check if a sentence is currently due */
    isDue,
    /** Get next review timestamp for a specific sentence */
    getNextReviewDate,
    /** Get all mistakes for a specific dictionary */
    getMistakesByDictionary,
  };
}

export default useSpacedRepetition;