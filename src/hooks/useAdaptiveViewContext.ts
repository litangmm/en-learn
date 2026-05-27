/**
 * useAdaptiveViewContext Hook
 *
 * Integrates learning state from multiple sources to produce an adaptive view state
 * for the ViewRouter's dynamic view priority system.
 *
 * Data sources:
 * - useFlowState: for flowState ('focused'|'normal'|'fatigued') and fatigueSignals
 * - useAdaptiveQuestionContext: for practiceProfile (weaknesses, mistakes, XP, level)
 *
 * Output:
 * - Adaptive state with difficulty level, priority adjustments, recommended views
 * - Used by ViewRouter to dynamically prioritize which views to show
 *
 * This hook is session-scoped — state resets when the user starts a new session
 * (matching the session-scoped nature of flow state tracking).
 */

import { useMemo } from 'react';
import type { FlowState } from '@/hooks/useAdaptiveQuestionSelector';
import { useFlowState, type FatigueSignal } from '@/hooks/useFlowState';
import { useAdaptiveQuestionContext } from '@/hooks/useAdaptiveQuestionContext';
import type { ViewDifficultyLevel } from '@/components/routing/schema';
import type { Weakness } from '@/data/types';

// ---------------------------------------------------------------------------
// Adaptive View State Types
// ---------------------------------------------------------------------------

/**
 * Aggregated adaptive state for view prioritization.
 * Produced by useAdaptiveViewContext and consumed by ViewRouter.
 */
export interface AdaptiveViewState {
  /** Current difficulty level derived from flow and practice data */
  difficultyLevel: ViewDifficultyLevel;
  /** Priority adjustment factor for view ordering (multiplicative) */
  priorityAdjustment: number;
  /** Recommended view IDs in priority order for the current state */
  recommendedViews: string[];
  /** Current flow state driving the adaptations */
  flowState: FlowState;
  /** Active fatigue signals for UI feedback */
  fatigueSignals: FatigueSignal[];
  /** Whether the user has significant weaknesses affecting view priority */
  hasWeaknessBias: boolean;
  /** Total weakness count for severity assessment */
  weaknessCount: number;
  /** Recent accuracy (0-1) from flow tracking */
  recentAccuracy: number;
}

/**
 * Mapping from FlowState to difficulty level.
 */
const FLOW_DIFFICULTY_MAP: Record<FlowState, ViewDifficultyLevel> = {
  focused: 'hard',
  normal: 'normal',
  fatigued: 'easy',
};

/**
 * Mapping from FlowState to priority adjustment multiplier.
 * Higher = boost priority of harder/challenging views.
 * Lower = boost priority of easier/supportive views.
 */
const FLOW_PRIORITY_ADJUSTMENT_MAP: Record<FlowState, number> = {
  focused: 1.2,   // Boost challenging content
  normal: 1.0,    // No adjustment
  fatigued: 0.8,  // De-prioritize hard content
};

// ---------------------------------------------------------------------------
// Weakness-based View Priority Recommendations
// ---------------------------------------------------------------------------

/**
 * Determines which views are recommended based on weakness profile.
 * Views that address weak areas are prioritized when weaknesses are present.
 *
 * @param weaknesses - Detected weaknesses for the user
 * @returns Ordered list of recommended view IDs
 */
function getWeaknessRecommendedViews(weaknesses: Weakness[]): string[] {
  if (weaknesses.length === 0) {
    // No weaknesses — no special view recommendations
    return [];
  }

  const recommended: string[] = [];

  // Classify weaknesses by type
  const highError = weaknesses.filter((w) => w.weakType === 'high-error');
  const lowAccuracy = weaknesses.filter((w) => w.weakType === 'low-accuracy');
  const reviewNeglected = weaknesses.filter((w) => w.weakType === 'review-neglected');
  const modeWeak = weaknesses.filter((w) => w.weakType === 'mode-weak');

  // High-error weaknesses → prioritize practice/review
  if (highError.length > 0) {
    recommended.push('practice');
  }

  // Low-accuracy → prioritize learning materials / explanations
  if (lowAccuracy.length > 0) {
    recommended.push('learning');
  }

  // Review neglected → prioritize review
  if (reviewNeglected.length > 0) {
    recommended.push('review');
  }

  // Mode weakness → suggest switching practice mode
  if (modeWeak.length > 0) {
    recommended.push('modes');
  }

  // Deduplicate and return
  return [...new Set(recommended)];
}

// ---------------------------------------------------------------------------
// Main Hook
// ---------------------------------------------------------------------------

/**
 * Custom hook that aggregates flow state and practice profile into a unified
 * adaptive view state for the ViewRouter.
 *
 * This hook does NOT mutate any state — it is a pure read of derived values.
 * It does not subscribe to storage updates (unlike useAdaptiveQuestionContext
 * which has auto-save side effects).
 *
 * @returns AdaptiveViewState with difficulty, priority, recommended views, and signals
 */
export function useAdaptiveViewContext(): AdaptiveViewState {
  // Source 1: Flow state (session-scoped)
  const { flowState, fatigueSignals, recentAccuracy } = useFlowState();

  // Source 2: Practice profile from adaptive context
  const { context } = useAdaptiveQuestionContext();

  // Derived values
  const adaptiveState = useMemo<AdaptiveViewState>(() => {
    const weaknesses = context.weaknesses ?? [];

    // Determine difficulty level from flow state
    const difficultyLevel = FLOW_DIFFICULTY_MAP[flowState];

    // Determine priority adjustment from flow state
    const priorityAdjustment = FLOW_PRIORITY_ADJUSTMENT_MAP[flowState];

    // Get weakness-recommended views
    const weaknessRecommendedViews = getWeaknessRecommendedViews(weaknesses);

    // Flow-state-recommended views (in addition to weakness recommendations)
    const flowRecommendedViews: string[] =
      flowState === 'focused'
        ? ['challenge', 'leaderboard']     // Confident users get competitive views
        : flowState === 'fatigued'
          ? ['progress', 'achievement']     // Fatigued users get encouraging views
          : [];

    // Merge and deduplicate recommended views
    const allRecommended = [...weaknessRecommendedViews, ...flowRecommendedViews];
    const recommendedViews = [...new Set(allRecommended)];

    // Weakness bias flag: true if significant weaknesses exist
    const hasWeaknessBias = weaknesses.length > 2;

    return {
      difficultyLevel,
      priorityAdjustment,
      recommendedViews,
      flowState,
      fatigueSignals,
      hasWeaknessBias,
      weaknessCount: weaknesses.length,
      recentAccuracy,
    };
  }, [context, flowState, fatigueSignals, recentAccuracy]);

  return adaptiveState;
}

export default useAdaptiveViewContext;
