import type { Mistake } from '@/data/types';

const MAX_WEIGHT = 5.0;
const DEFAULT_WEIGHT = 1.0;
const MISTAKE_WEIGHT_INCREMENT = 0.5;
const OVERDUE_BOOST = 1.5;
const NOT_DUE_PENALTY = 0.3;
const NEW_WORD_PENALTY = 0.6; // Reduce new word exposure to 60% of normal

/**
 * Information about a sentence's weight calculation for visualization.
 */
export interface WeightExplanation {
  /** The sentence ID */
  sentenceId: string;
  /** The final calculated weight */
  totalWeight: number;
  /** Base weight (always 1.0) */
  baseWeight: number;
  /** Weight contribution from mistake records */
  mistakeWeight: number;
  /** Weight contribution from error rate */
  errorRateWeight: number;
  /** Spaced repetition modifier applied */
  spacedRepetitionModifier: number;
  /** Whether this sentence is marked as a new word */
  isNewWord: boolean;
  /** Weight contribution from new word penalty */
  newWordPenalty: number;
  /** Current spaced repetition state */
  spacedRepetitionState: 'new' | 'due' | 'overdue' | 'not-due';
  /** Explanation text in Chinese */
  explanation: string;
}

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

    // Check if this is a new word (no mistakes at all)
    const isNewWord = relevantMistakes.length === 0;

    // Base weight
    let weight = DEFAULT_WEIGHT;

    // Calculate mistake weight and error rate weight for experienced words
    let mistakeWeight = 0;
    let errorRateWeight = 0;

    if (!isNewWord) {
      // Add 0.5 for each mistake record
      mistakeWeight = relevantMistakes.length * MISTAKE_WEIGHT_INCREMENT;
      weight += mistakeWeight;

      // Calculate error rate boost
      let totalErrors = 0;
      let totalAttempts = 0;

      for (const mistake of relevantMistakes) {
        totalErrors += mistake.wrongAnswers.length;
        totalAttempts += mistake.attempts;
      }

      if (totalAttempts > 0) {
        const errorRate = totalErrors / totalAttempts;
        errorRateWeight = errorRate * 1.0;
        weight += errorRateWeight;
      }
    }

    // Calculate spaced repetition modifier
    let spacedRepetitionModifier = 1.0;

    if (isNewWord) {
      // New words get penalized to reduce exposure rate
      spacedRepetitionModifier = NEW_WORD_PENALTY;
    } else {
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
    }

    // Apply spaced repetition modifier to final weight
    weight *= spacedRepetitionModifier;

    // Cap at maximum weight
    return Math.min(weight, MAX_WEIGHT);
  }

  /**
   * Get detailed weight explanation for a sentence.
   * Useful for visualizing the weight calculation algorithm.
   *
   * @param sentenceId - The sentence ID to explain
   * @param allMistakes - Array of all mistake records
   * @param currentTime - Current timestamp in ms for spaced repetition calculation
   * @returns WeightExplanation object with detailed breakdown
   */
  function getWeightExplanation(
    sentenceId: string,
    allMistakes: Mistake[],
    currentTime: number = Date.now()
  ): WeightExplanation {
    // Filter mistakes for this sentence
    const relevantMistakes = allMistakes.filter((m) => m.sentenceId === sentenceId);

    // Check if this is a new word (no mistakes at all)
    const isNewWord = relevantMistakes.length === 0;

    // Calculate base components
    const baseWeight = DEFAULT_WEIGHT;
    let mistakeWeight = 0;
    let errorRateWeight = 0;
    let totalErrors = 0;
    let totalAttempts = 0;

    if (!isNewWord) {
      mistakeWeight = relevantMistakes.length * MISTAKE_WEIGHT_INCREMENT;

      for (const mistake of relevantMistakes) {
        totalErrors += mistake.wrongAnswers.length;
        totalAttempts += mistake.attempts;
      }

      if (totalAttempts > 0) {
        const errorRate = totalErrors / totalAttempts;
        errorRateWeight = errorRate * 1.0;
      }
    }

    // Calculate spaced repetition modifier and state
    let spacedRepetitionModifier = 1.0;
    let spacedRepetitionState: 'new' | 'due' | 'overdue' | 'not-due' = 'new';

    if (isNewWord) {
      spacedRepetitionModifier = NEW_WORD_PENALTY;
      spacedRepetitionState = 'new';
    } else {
      for (const mistake of relevantMistakes) {
        if (mistake.nextReviewAt !== undefined) {
          if (mistake.nextReviewAt > currentTime) {
            spacedRepetitionModifier = Math.min(spacedRepetitionModifier, NOT_DUE_PENALTY);
            spacedRepetitionState = 'not-due';
          } else if (mistake.nextReviewAt <= currentTime) {
            let correctCount = 0;
            let totalReviews = 0;

            if (mistake.reviewHistory && mistake.reviewHistory.length > 0) {
              for (const review of mistake.reviewHistory) {
                totalReviews++;
                if (review.isCorrect) correctCount++;
              }
            }

            const reviewAccuracyBonus = totalReviews > 0
              ? Math.max(0, 1 - (correctCount / totalReviews)) * 0.5
              : 0;

            const boost = OVERDUE_BOOST + reviewAccuracyBonus;
            spacedRepetitionModifier = Math.max(spacedRepetitionModifier, boost);
            spacedRepetitionState = 'overdue';
          }
        } else {
          spacedRepetitionState = 'due';
        }
      }
    }

    // Calculate final weight
    let totalWeight = (baseWeight + mistakeWeight + errorRateWeight) * spacedRepetitionModifier;
    totalWeight = Math.min(totalWeight, MAX_WEIGHT);

    // Generate explanation text in Chinese
    let explanation = '';
    if (isNewWord) {
      explanation = `新词：初始权重 ${baseWeight.toFixed(1)}，新词降权系数 ${NEW_WORD_PENALTY}，最终权重 ${totalWeight.toFixed(2)}。新词曝光率降低，确保不会过于频繁出现。`;
    } else {
      const parts: string[] = [];
      parts.push(`基础权重 ${baseWeight.toFixed(1)}`);
      if (mistakeWeight > 0) {
        parts.push(`错题记录 +${mistakeWeight.toFixed(1)}`);
      }
      if (errorRateWeight > 0) {
        parts.push(`错误率 +${errorRateWeight.toFixed(2)}`);
      }
      parts.push(`复习状态 ${spacedRepetitionModifier.toFixed(2)}`);
      explanation = parts.join('，') + `，最终权重 ${totalWeight.toFixed(2)}。`;
    }

    return {
      sentenceId,
      totalWeight,
      baseWeight,
      mistakeWeight,
      errorRateWeight,
      spacedRepetitionModifier,
      isNewWord,
      newWordPenalty: isNewWord ? NEW_WORD_PENALTY : 1.0,
      spacedRepetitionState,
      explanation,
    };
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
    getWeightExplanation,
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