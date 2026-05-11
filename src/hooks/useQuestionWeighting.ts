import type { Mistake } from '@/data/types';

const MAX_WEIGHT = 5.0;
const DEFAULT_WEIGHT = 1.0;
const MISTAKE_WEIGHT_INCREMENT = 0.5;
const OVERDUE_BOOST = 1.5;
const NOT_DUE_PENALTY = 0.3;

/**
 * Hook providing adaptive question weighting for practice sessions.
 *
 * Prioritizes sentences based on mistake history:
 * - Sentences with more mistakes get higher weight
 * - Sentences with higher error rate get additional boost
 * - New sentences (never seen) get default weight
 */
export function useQuestionWeighting() {
  /**
   * Calculate weight for a sentence based on mistake history.
   *
   * Weight formula:
   * - Default weight: 1.0 (new sentences never seen before)
   * - For each mistake record matching the sentenceId: increase by 0.5
   * - Additional boost: (totalErrors / totalAttempts) * 1.0
   * - Spaced repetition modifiers:
   *   - If not due for review (nextReviewAt > currentTime): apply NOT_DUE_PENALTY (0.3)
   *   - If overdue for review (nextReviewAt <= currentTime): apply OVERDUE_BOOST (1.5) + reviewAccuracyBonus
   *   - reviewAccuracyBonus = max(0, 1 - (correctCount / totalCount)) * 0.5
   * - Maximum weight cap: 5.0
   *
   * @param sentenceId - The sentence ID to calculate weight for
   * @param allMistakes - Array of all mistake records
   * @param currentTime - Current timestamp in ms for spaced repetition calculation
   * @returns Weight value between 1.0 and MAX_WEIGHT (5.0)
   */
  function getSentenceWeight(
    sentenceId: string,
    allMistakes: Mistake[],
    currentTime: number = Date.now()
  ): number {
    // Filter mistakes for this sentence
    const relevantMistakes = allMistakes.filter((m) => m.sentenceId === sentenceId);

    if (relevantMistakes.length === 0) {
      return DEFAULT_WEIGHT;
    }

    // Base weight
    let weight = DEFAULT_WEIGHT;

    // Add 0.5 for each mistake record
    weight += relevantMistakes.length * MISTAKE_WEIGHT_INCREMENT;

    // Calculate error rate boost
    let totalErrors = 0;
    let totalAttempts = 0;

    for (const mistake of relevantMistakes) {
      totalErrors += mistake.wrongAnswers.length;
      totalAttempts += mistake.attempts;
    }

    if (totalAttempts > 0) {
      const errorRate = totalErrors / totalAttempts;
      weight += errorRate * 1.0;
    }

    // Apply spaced repetition modifier
    let spacedRepetitionModifier = 1.0;

    for (const mistake of relevantMistakes) {
      if (mistake.nextReviewAt !== undefined) {
        if (mistake.nextReviewAt > currentTime) {
          // Not due for review yet - memory is stable, reduce frequency
          spacedRepetitionModifier = Math.min(spacedRepetitionModifier, NOT_DUE_PENALTY);
        } else if (mistake.nextReviewAt <= currentTime) {
          // Overdue for review - forgetting curve decay, prioritize
          // Calculate accuracy bonus based on review history
          let correctCount = 0;
          let totalReviews = 0;

          if (mistake.reviewHistory && mistake.reviewHistory.length > 0) {
            for (const review of mistake.reviewHistory) {
              totalReviews++;
              if (review.isCorrect) correctCount++;
            }
          }

          // reviewAccuracyBonus: higher bonus for lower accuracy
          // max 0.5 for 0% accuracy, 0 for 100% accuracy
          const reviewAccuracyBonus = totalReviews > 0
            ? Math.max(0, 1 - (correctCount / totalReviews)) * 0.5
            : 0;

          const boost = OVERDUE_BOOST + reviewAccuracyBonus;
          spacedRepetitionModifier = Math.max(spacedRepetitionModifier, boost);
        }
      }
    }

    // Apply spaced repetition modifier to final weight
    weight *= spacedRepetitionModifier;

    // Cap at maximum weight
    return Math.min(weight, MAX_WEIGHT);
  }

  /**
   * Get weighted sentence IDs with higher weights prioritized early.
   *
   * Algorithm:
   * 1. Calculate weight for each sentence based on mistake history and spaced repetition state
   * 2. For first 5 sentences: use weighted random selection
   * 3. Fill remaining slots with random shuffle
   * 4. Return top N sentences in randomized order
   *
   * @param sentenceIds - Array of sentence IDs to weight
   * @param allMistakes - Array of all mistake records
   * @param count - Number of sentences to return (default: 5)
   * @param currentTime - Current timestamp in ms for spaced repetition calculation
   * @returns Array of sentence IDs with weights applied
   */
  function getWeightedSentenceIds(
    sentenceIds: string[],
    allMistakes: Mistake[],
    count: number = 5,
    currentTime: number = Date.now()
  ): string[] {
    if (sentenceIds.length === 0) {
      return [];
    }

    // If requested count >= available, return all in random order
    if (count >= sentenceIds.length) {
      return shuffleArray([...sentenceIds]);
    }

    // Calculate weights for all sentences
    const weightedSentences = sentenceIds.map((id) => ({
      id,
      weight: getSentenceWeight(id, allMistakes, currentTime),
    }));

    // Sort by weight descending (higher weight = more priority)
    weightedSentences.sort((a, b) => b.weight - a.weight);

    // Select first 5 using weighted random
    const topCount = Math.min(5, weightedSentences.length);
    const selectedWeighted = weightedRandomSelect(weightedSentences.slice(0, topCount), topCount);

    // If we need more, fill with random selection from remaining
    const remaining = weightedSentences
      .filter((s) => !selectedWeighted.some((selected) => selected.id === s.id))
      .map((s) => s.id);

    const remainingNeeded = count - selectedWeighted.length;
    const selectedRemaining = shuffleArray(remaining).slice(0, remainingNeeded);

    // Combine and shuffle for final order
    const allSelected = [...selectedWeighted.map((s) => s.id), ...selectedRemaining];

    return shuffleArray(allSelected);
  }

  return {
    getSentenceWeight,
    getWeightedSentenceIds,
  };
}

/**
 * Select N items from weighted array using weighted random selection.
 * Higher weight = higher probability of being selected.
 */
function weightedRandomSelect<T extends { id: string; weight: number }>(
  items: T[],
  count: number
): T[] {
  if (items.length <= count) {
    return items;
  }

  const result: T[] = [];
  const remaining = [...items];

  for (let i = 0; i < count && remaining.length > 0; i++) {
    const selected = selectWeightedRandom(remaining);
    result.push(selected);
    // Remove selected from remaining
    const idx = remaining.findIndex((r) => r.id === selected.id);
    if (idx !== -1) {
      remaining.splice(idx, 1);
    }
  }

  return result;
}

/**
 * Select a single item from weighted array using weighted random selection.
 */
function selectWeightedRandom<T extends { id: string; weight: number }>(
  items: T[]
): T {
  if (items.length === 0) {
    throw new Error('Cannot select from empty array');
  }

  if (items.length === 1) {
    return items[0];
  }

  // Calculate total weight
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

  // Generate random value between 0 and totalWeight
  let random = Math.random() * totalWeight;

  // Find the item that corresponds to the random value
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) {
      return item;
    }
  }

  // Fallback: return last item (shouldn't happen with proper math)
  return items[items.length - 1];
}

/**
 * Fisher-Yates shuffle algorithm.
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}