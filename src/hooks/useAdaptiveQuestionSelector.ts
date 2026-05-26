/**
 * useAdaptiveQuestionSelector Hook
 *
 * Implements adaptive question selection algorithm that integrates with:
 * - useQuestionWeighting: for weight calculation
 * - usePracticeRecommendations: for priority recommendations
 * - useWeaknessDetection: for weakness data
 * - useAdaptiveQuestionContext: for flow state integration
 *
 * Selection strategies:
 * - 'priority': Focus on high-priority items (high-error, low-accuracy)
 * - 'balanced': Mix of practice types (weak areas + new content)
 * - 'focus-weak': Exclusively focus on weak areas
 *
 * Flow state adjustments:
 * - 'focused': Increase difficulty weight, prioritize challenging content
 * - 'normal': Standard balanced selection
 * - 'fatigued': Reduce difficulty, prioritize easier content
 */

import { useState, useCallback, useMemo } from 'react';
import type { Weakness, PracticeRecommendation } from '@/data/types';
import { useQuestionWeighting } from '@/hooks/useQuestionWeighting';
import { useWeaknessDetection } from '@/hooks/useWeaknessDetection';
import { storage } from '@/services/storage';

/**
 * Selection strategy types for question prioritization.
 */
export type QuestionSelectionStrategy = 'priority' | 'balanced' | 'focus-weak';

/**
 * Flow state types affecting selection difficulty.
 */
export type FlowState = 'focused' | 'normal' | 'fatigued';

/**
 * Priority score breakdown for debugging/visualization.
 */
export interface PriorityScore {
  sentenceId: string;
  /** Base priority from recommendation (0 if not recommended) */
  recommendationPriority: number;
  /** Weight from mistake history */
  weight: number;
  /** Weakness multiplier (1.0 if not a weakness) */
  weaknessMultiplier: number;
  /** Flow state modifier applied */
  flowModifier: number;
  /** Final composite priority score */
  totalScore: number;
}

/**
 * Hook return type for useAdaptiveQuestionSelector.
 */
export interface UseAdaptiveQuestionSelectorReturn {
  /** Get selected sentence IDs based on strategy and available sentences */
  selectQuestions: (_sentenceIds: string[], _strategy: QuestionSelectionStrategy) => string[];
  /** Get priority score for a specific sentence */
  getPriorityScore: (_sentenceId: string) => PriorityScore;
  /** Current strategy being used */
  currentStrategy: QuestionSelectionStrategy;
  /** Set the selection strategy */
  setStrategy: (_strategy: QuestionSelectionStrategy) => void;
  /** Get all weakness sentence IDs */
  getWeaknessSentenceIds: () => string[];
  /** Get all recommended sentence IDs */
  getRecommendedSentenceIds: () => string[];
}

// ---------------------------------------------------------------------------
// Strategy Selection Algorithms
// ---------------------------------------------------------------------------

/**
 * Priority strategy: Return highest priority sentences from recommendations.
 * Focuses on high-priority items (high-error, low-accuracy).
 *
 * @param sentenceIds - Available sentence IDs
 * @param recommendations - Sorted by priority (1 = highest)
 * @param flowState - Current flow state for adjustments
 * @returns Selected sentence IDs ordered by priority
 */
function selectByPriority(
  _sentenceIds: string[],
  recommendations: PracticeRecommendation[],
  flowState: FlowState
): string[] {
  // If no recommendations, fall back to taking first 5 from sentenceIds
  const availableIds = recommendations.length > 0
    ? recommendations.map((rec) => rec.targetSentenceId)
    : _sentenceIds;

  // Filter to only IDs that exist in sentenceIds
  const filteredIds = availableIds.filter((id) => _sentenceIds.includes(id));

  if (filteredIds.length === 0) {
    return _sentenceIds.slice(0, 5);
  }

  // Apply flow state adjustments to recommendation order
  const flowAdjustedIds = applyFlowStateAdjustment(filteredIds, flowState);

  // Return up to 5 from recommendations
  return flowAdjustedIds.slice(0, 5);
}

/**
 * Balanced strategy: Mix of high-weight sentences + recommendations.
 * Balances weak areas with new content.
 *
 * @param sentenceIds - Available sentence IDs
 * @param recommendations - Practice recommendations
 * @param weights - Sentence weights from useQuestionWeighting
 * @param flowState - Current flow state for adjustments
 * @returns Selected sentence IDs with balanced mix
 */
function selectByBalanced(
  sentenceIds: string[],
  recommendations: PracticeRecommendation[],
  weights: Map<string, number>,
  flowState: FlowState
): string[] {
  if (sentenceIds.length === 0) {
    return [];
  }

  // If only 1-2 sentences, return all
  if (sentenceIds.length <= 2) {
    return sentenceIds;
  }

  // Split: 60% recommendations (high priority), 40% high-weight
  const recommendedIds = new Set(
    recommendations.map((rec) => rec.targetSentenceId).filter((id) => sentenceIds.includes(id))
  );

  // Get high-weight sentences (top 50% by weight)
  const weightedIds = sentenceIds
    .map((id) => ({ id, weight: weights.get(id) ?? 1.0 }))
    .sort((a, b) => b.weight - a.weight);

  // Select top 50% as candidates for balanced mix
  const topHalfCount = Math.ceil(sentenceIds.length / 2);
  const topWeightedIds = weightedIds.slice(0, topHalfCount).map((w) => w.id);

  // Build balanced selection: up to 3 from recommendations, 2 from high-weight
  const selected: string[] = [];

  // Add recommendations (up to 3)
  for (const id of recommendedIds) {
    if (selected.length >= 3) break;
    if (!selected.includes(id)) {
      selected.push(id);
    }
  }

  // Add high-weight non-recommended (up to 2)
  for (const id of topWeightedIds) {
    if (selected.length >= 5) break;
    if (!selected.includes(id)) {
      selected.push(id);
    }
  }

  // Fill remaining slots if needed
  if (selected.length < 3 && sentenceIds.length > selected.length) {
    const remaining = sentenceIds.filter((id) => !selected.includes(id));
    selected.push(...remaining.slice(0, 3 - selected.length));
  }

  // Apply flow state adjustment
  return applyFlowStateAdjustment(selected, flowState);
}

/**
 * Focus-weak strategy: Filter to only sentences with detected weaknesses.
 * Exclusively focuses on weak areas.
 *
 * @param sentenceIds - Available sentence IDs
 * @param weaknesses - Detected weaknesses by sentence ID
 * @param weights - Sentence weights
 * @param flowState - Current flow state for adjustments
 * @returns Selected sentence IDs (only weak ones if available)
 */
function selectByFocusWeak(
  _sentenceIds: string[],
  weaknesses: Map<string, Weakness>,
  weights: Map<string, number>,
  flowState: FlowState
): string[] {
  // Filter to only sentences with weakness
  const weakIds = _sentenceIds.filter((id) => weaknesses.has(id));

  if (weakIds.length === 0) {
    // No weaknesses found, fall back to weighted selection
    const fallback = _sentenceIds
      .map((id) => ({ id, weight: weights.get(id) ?? 1.0 }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5)
      .map((w) => w.id);
    return applyFlowStateAdjustment(fallback, flowState);
  }

  // Sort by weight (most problematic first)
  const sortedWeakIds = weakIds
    .map((id) => ({ id, weight: weights.get(id) ?? 1.0 }))
    .sort((a, b) => b.weight - a.weight)
    .map((w) => w.id);

  // Apply flow state adjustment
  return applyFlowStateAdjustment(sortedWeakIds, flowState);
}

// ---------------------------------------------------------------------------
// Flow State Adjustments
// ---------------------------------------------------------------------------

/**
 * Apply flow state adjustment to selected sentences.
 *
 * - focused: Prioritize challenging content (higher weight)
 * - normal: Keep standard order
 * - fatigued: De-prioritize difficult content, boost easier ones
 */
function applyFlowStateAdjustment(
  sentenceIds: string[],
  flowState: FlowState
): string[] {
  if (flowState === 'normal' || sentenceIds.length <= 1) {
    return sentenceIds;
  }

  // Clone to avoid mutation
  const result = [...sentenceIds];

  if (flowState === 'focused') {
    // Focused state: boost higher-weight items to front
    // Keep order but may prioritize challenging content
    // Since we already have weighted selection, just ensure top items are challenging
    // This is a no-op since we already selected by weight
    return result;
  }

  if (flowState === 'fatigued') {
    // Fatigued state: reverse priority - move easier content to front
    // "Easier" is indicated by lower weight (less mistakes/errors)
    // Since weights are sorted descending (high weight = high priority for difficulty),
    // we want to move lower-weight items forward
    return result.reverse();
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main Hook
// ---------------------------------------------------------------------------

/**
 * Custom hook for adaptive question selection.
 *
 * Integrates with:
 * - useQuestionWeighting: for weighted sentence selection
 * - useWeaknessDetection: for weakness filtering
 * - useAdaptiveQuestionContext: for flow state integration
 *
 * @returns Object with selection methods and current strategy
 */
export function useAdaptiveQuestionSelector(): UseAdaptiveQuestionSelectorReturn {
  // Current selection strategy
  const [currentStrategy, setCurrentStrategy] = useState<QuestionSelectionStrategy>('balanced');

  // Get question weighting functions
  const { getSentenceWeight } = useQuestionWeighting();

  // Get all weaknesses (from storage)
  const weaknesses = useWeaknessDetection();

  // Get context for flow state
  const context = useMemo(() => {
    try {
      return storage.getAdaptiveQuestionContext();
    } catch {
      return null;
    }
  }, []);

  // Get flow state from context
  const flowState: FlowState = context?.flowState ?? 'normal';

  // Get recommendations from context (memoized to prevent unnecessary recalculations)
  const recommendations = useMemo<PracticeRecommendation[]>(() => {
    return context?.recommendations ?? [];
  }, [context?.recommendations]);

  // Build weakness map for fast lookup
  const weaknessMap = useMemo(() => {
    const map = new Map<string, Weakness>();
    for (const w of weaknesses) {
      map.set(w.sentenceId, w);
    }
    return map;
  }, [weaknesses]);

  // Build weight map for sentence IDs
  const buildWeightMap = useCallback(
    (sentenceIds: string[]): Map<string, number> => {
      const allMistakes = storage.getMistakes();
      const map = new Map<string, number>();
      const currentTime = Date.now();

      for (const id of sentenceIds) {
        const weight = getSentenceWeight(id, allMistakes, currentTime);
        map.set(id, weight);
      }
      return map;
    },
    [getSentenceWeight]
  );

  /**
   * Calculate priority score for a sentence.
   *
   * Score components:
   * - Recommendation priority (0 if not recommended, 1-3 otherwise)
   * - Weight from mistake history (1.0-5.0)
   * - Weakness multiplier (1.0 if not weak, up to 1.5 if weak)
   * - Flow modifier (adjusts based on current flow state)
   */
  const getPriorityScore = useCallback(
    (sentenceId: string): PriorityScore => {
      const allMistakes = storage.getMistakes();

      // Recommendation priority (1 = highest, 3 = lowest, 0 = not recommended)
      let recommendationPriority = 0;
      const rec = recommendations.find((r) => r.targetSentenceId === sentenceId);
      if (rec) {
        recommendationPriority = rec.priority;
      }

      // Weight from mistake history
      const weight = getSentenceWeight(sentenceId, allMistakes);

      // Weakness multiplier
      let weaknessMultiplier = 1.0;
      if (weaknessMap.has(sentenceId)) {
        const weakness = weaknessMap.get(sentenceId)!;
        // Apply multiplier based on weakness type severity
        switch (weakness.weakType) {
          case 'high-error':
            weaknessMultiplier = 1.5;
            break;
          case 'low-accuracy':
            weaknessMultiplier = 1.3;
            break;
          case 'review-neglected':
            weaknessMultiplier = 1.2;
            break;
          case 'mode-weak':
            weaknessMultiplier = 1.1;
            break;
        }
      }

      // Flow modifier
      let flowModifier = 1.0;
      if (flowState === 'focused') {
        // Focused: boost high weight/difficulty
        flowModifier = weight > 2.0 ? 1.3 : 0.9;
      } else if (flowState === 'fatigued') {
        // Fatigued: reduce high weight, boost low weight
        flowModifier = weight > 2.0 ? 0.7 : 1.2;
      }

      // Calculate total score
      const totalScore = (weight * weaknessMultiplier * flowModifier) + (4 - recommendationPriority);

      return {
        sentenceId,
        recommendationPriority,
        weight,
        weaknessMultiplier,
        flowModifier,
        totalScore,
      };
    },
    [getSentenceWeight, recommendations, weaknessMap, flowState]
  );

  /**
   * Select questions based on strategy.
   *
   * @param sentenceIds - Available sentence IDs to select from
   * @param strategy - Selection strategy to apply
   * @returns Selected sentence IDs in priority order
   */
  const selectQuestions = useCallback(
    (sentenceIds: string[], strategy: QuestionSelectionStrategy): string[] => {
      if (sentenceIds.length === 0) {
        return [];
      }

      // If only 1 sentence, return it
      if (sentenceIds.length === 1) {
        return sentenceIds;
      }

      // Build weight map for the given sentence IDs
      const weightMap = buildWeightMap(sentenceIds);

      switch (strategy) {
        case 'priority':
          return selectByPriority(sentenceIds, recommendations, flowState);

        case 'balanced':
          return selectByBalanced(sentenceIds, recommendations, weightMap, flowState);

        case 'focus-weak':
          return selectByFocusWeak(sentenceIds, weaknessMap, weightMap, flowState);

        default:
          return selectByBalanced(sentenceIds, recommendations, weightMap, flowState);
      }
    },
    [buildWeightMap, recommendations, weaknessMap, flowState]
  );

  /**
   * Get all weakness sentence IDs.
   */
  const getWeaknessSentenceIds = useCallback((): string[] => {
    return Array.from(weaknessMap.keys());
  }, [weaknessMap]);

  /**
   * Get all recommended sentence IDs.
   */
  const getRecommendedSentenceIds = useCallback((): string[] => {
    return recommendations.map((r) => r.targetSentenceId);
  }, [recommendations]);

  return {
    selectQuestions,
    getPriorityScore,
    currentStrategy,
    setStrategy: setCurrentStrategy,
    getWeaknessSentenceIds,
    getRecommendedSentenceIds,
  };
}

// ---------------------------------------------------------------------------
// Re-export types for consumers
// ---------------------------------------------------------------------------

export type { Weakness, PracticeRecommendation };

export default useAdaptiveQuestionSelector;