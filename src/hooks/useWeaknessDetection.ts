import { useMemo } from 'react';
import type { Mistake, Weakness, WeaknessDefinition, WeaknessType } from '@/data/types';
import { storage } from '@/services/storage';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Default weakness detection parameters.
 */
export const DEFAULT_WEAKNESS_DEFINITION: WeaknessDefinition = {
  weakType: 'high-error',
  accuracyThreshold: 0.6,
  sentenceCountThreshold: 3,
  reviewNeglectedDays: 7,
};

/**
 * Hook providing weakness detection for practice sentences.
 *
 * Analyzes mistake history to identify sentences the user struggles with:
 * - 'high-error': 3+ wrong answers on the same sentence
 * - 'low-accuracy': accuracy below 60%
 * - 'review-neglected': not reviewed in 7+ days
 *
 * Pure function implementation for testability.
 */
export function useWeaknessDetection(dictionaryId?: string) {
  return useMemo(() => {
    const mistakes = storage.getMistakes();
    const filtered = dictionaryId
      ? mistakes.filter((m) => m.dictionaryId === dictionaryId)
      : mistakes;
    return detectAllWeaknesses(filtered, DEFAULT_WEAKNESS_DEFINITION);
  }, [dictionaryId]);
}

/**
 * Detect weaknesses for a single mistake record.
 *
 * A sentence can have multiple weakness types simultaneously.
 */
export function detectWeaknessesFromMistake(
  mistake: Mistake,
  definition: WeaknessDefinition = DEFAULT_WEAKNESS_DEFINITION
): Weakness[] {
  const now = Date.now();
  const weaknesses: Weakness[] = [];

  const wrongCount = mistake.wrongAnswers.length;
  const correctCount = mistake.correctAnswers.length;
  const totalAttempts = mistake.attempts;
  const reviewCount = mistake.reviewedCount;

  // Calculate accuracy (0-1 scale)
  const accuracy = totalAttempts > 0 ? correctCount / totalAttempts : 0;

  // Calculate days since last review (null if never reviewed)
  const lastReviewTs = mistake.lastReviewedAt;
  const daysSinceLastReview: number | null = lastReviewTs != null
    ? Math.floor((now - lastReviewTs) / DAY_MS)
    : null;

  // high-error: 3+ wrong answers
  if (wrongCount >= definition.sentenceCountThreshold) {
    weaknesses.push({
      sentenceId: mistake.sentenceId,
      dictionaryId: mistake.dictionaryId,
      weakType: 'high-error',
      accuracy,
      wrongCount,
      correctCount,
      reviewCount,
      daysSinceLastReview,
      detectedAt: now,
    });
  }

  // low-accuracy: accuracy below threshold (e.g. below 60%)
  if (accuracy > 0 && accuracy < definition.accuracyThreshold) {
    weaknesses.push({
      sentenceId: mistake.sentenceId,
      dictionaryId: mistake.dictionaryId,
      weakType: 'low-accuracy',
      accuracy,
      wrongCount,
      correctCount,
      reviewCount,
      daysSinceLastReview,
      detectedAt: now,
    });
  }

  // review-neglected: not reviewed in 7+ days AND has been reviewed at least once
  if (reviewCount >= 1 && daysSinceLastReview != null && daysSinceLastReview >= definition.reviewNeglectedDays) {
    weaknesses.push({
      sentenceId: mistake.sentenceId,
      dictionaryId: mistake.dictionaryId,
      weakType: 'review-neglected',
      accuracy,
      wrongCount,
      correctCount,
      reviewCount,
      daysSinceLastReview,
      detectedAt: now,
    });
  }

  // mode-weak: 2+ incorrect reviews
  const incorrectReviews = mistake.reviewHistory?.filter((r) => !r.isCorrect).length ?? 0;
  if (incorrectReviews >= 2) {
    weaknesses.push({
      sentenceId: mistake.sentenceId,
      dictionaryId: mistake.dictionaryId,
      weakType: 'mode-weak',
      accuracy,
      wrongCount,
      correctCount,
      reviewCount,
      daysSinceLastReview,
      detectedAt: now,
    });
  }

  return weaknesses;
}

/**
 * Get all weaknesses from an array of mistakes.
 * Deduplicates by sentenceId — if a sentence has multiple weakness types,
 * only the most severe (first detected) is kept per type.
 */
export function detectAllWeaknesses(
  mistakes: Mistake[],
  definition: WeaknessDefinition = DEFAULT_WEAKNESS_DEFINITION
): Weakness[] {
  const seen = new Map<string, Weakness>();
  for (const mistake of mistakes) {
    const w = detectWeaknessesFromMistake(mistake, definition);
    for (const weakness of w) {
      // Keep entry if not already present (first type wins)
      if (!seen.has(weakness.sentenceId)) {
        seen.set(weakness.sentenceId, weakness);
      }
    }
  }
  return Array.from(seen.values());
}

/**
 * Get weaknesses filtered by dictionary.
 */
export function getWeaknessesByDictionary(
  weaknesses: Weakness[],
  dictionaryId: string
): Weakness[] {
  return weaknesses.filter((w) => w.dictionaryId === dictionaryId);
}

/**
 * Get weakness count by type.
 */
export function getWeaknessCountByType(weaknesses: Weakness[]): Record<WeaknessType, number> {
  const counts: Record<WeaknessType, number> = {
    'high-error': 0,
    'low-accuracy': 0,
    'review-neglected': 0,
    'mode-weak': 0,
  };
  for (const w of weaknesses) {
    counts[w.weakType]++;
  }
  return counts;
}

/**
 * Calculate overall strength score (0-100).
 * Based on: percentage of non-weak sentences among all mistakes.
 * Fewer weaknesses = higher strength.
 */
export function calculateOverallStrength(
  totalMistakes: number,
  weakCount: number
): number {
  if (totalMistakes === 0) return 100;
  const ratio = weakCount / totalMistakes;
  return Math.round((1 - ratio) * 100);
}
