/**
 * useAdaptiveQuestionContext Hook
 *
 * Aggregates learning state data from multiple sources to provide a unified
 * context for adaptive question selection.
 *
 * Data sources:
 * - useXP: for totalXP, currentLevel, currentStreak
 * - Storage: for mistakes data (via StorageService.getMistakes())
 * - useFlowState: for flowState and fatigueSignals
 *
 * This hook integrates with storage to persist the context and provide
 * auto-save with debouncing.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type { AdaptiveQuestionContext } from '@/data/types';
import { useXP } from '@/hooks/useXP';
import { useFlowState, type FatigueSignal } from '@/hooks/useFlowState';
import { storage } from '@/services/storage';

// Default context for initialization
const DEFAULT_CONTEXT: AdaptiveQuestionContext = {
  totalXP: 0,
  currentLevel: 1,
  currentStreak: 0,
  mistakes: [],
  weaknesses: [],
  recommendations: [],
  flowState: 'normal',
  fatigueSignals: [],
  updatedAt: Date.now(),
};

// Debounce delay for auto-save (ms)
const AUTO_SAVE_DEBOUNCE_MS = 1000;

/**
 * Hook return type for useAdaptiveQuestionContext
 */
export interface UseAdaptiveQuestionContextReturn {
  /** The aggregated learning context */
  context: AdaptiveQuestionContext;
  /** Force refresh the context data from all sources */
  refresh: () => void;
}

/**
 * Custom hook that aggregates learning state data from multiple sources.
 *
 * This hook provides a unified view of the user's learning state, combining:
 * - XP data (level, total XP, streak)
 * - Mistake data from storage
 * - Flow state and fatigue signals from session tracking
 *
 * The hook handles:
 * - Initial state loading from storage
 * - Auto-save with debouncing to prevent excessive writes
 * - Graceful defaults for missing data
 * - Stable return values to prevent infinite re-renders
 *
 * @returns An object containing the aggregated context and a refresh function
 */
export function useAdaptiveQuestionContext(): UseAdaptiveQuestionContextReturn {
  // Track if this is the initial mount
  const isInitialMountRef = useRef(true);

  // Load initial state from storage
  const [context, setContext] = useState<AdaptiveQuestionContext>(() => {
    try {
      return storage.getAdaptiveQuestionContext();
    } catch {
      return { ...DEFAULT_CONTEXT, updatedAt: Date.now() };
    }
  });

  // Aggregate data from useXP hook
  const { profile, streak } = useXP();

  // Aggregate flow state data
  const { flowState, fatigueSignals } = useFlowState();

  // Ref to track the current context for auto-save effect
  const contextRef = useRef<AdaptiveQuestionContext>(context);

  // Debounce timer ref for auto-save
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update context when any source data changes
  useEffect(() => {
    // Load mistakes from storage (fresh each time to get latest)
    let mistakes: ReturnType<typeof storage.getMistakes>;
    try {
      mistakes = storage.getMistakes();
    } catch {
      mistakes = [];
    }

    // Build new context from aggregated sources
    const newContext: AdaptiveQuestionContext = {
      totalXP: profile?.totalXP ?? 0,
      currentLevel: profile?.currentLevel ?? 1,
      currentStreak: streak ?? 0,
      mistakes: mistakes ?? [],
      weaknesses: contextRef.current.weaknesses,
      recommendations: contextRef.current.recommendations,
      flowState: flowState ?? 'normal',
      fatigueSignals: normalizeFatigueSignals(fatigueSignals),
      updatedAt: Date.now(),
    };

    // Only update if data actually changed (deep comparison)
    if (!isDeepEqual(contextRef.current, newContext)) {
      contextRef.current = newContext;
      setContext(newContext);
    }
  }, [profile?.totalXP, profile?.currentLevel, streak, flowState, fatigueSignals]);

  // Auto-save with debouncing
  useEffect(() => {
    // Skip initial mount save to avoid unnecessary writes
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounced save to storage
    saveTimeoutRef.current = setTimeout(() => {
      try {
        storage.saveAdaptiveQuestionContext(contextRef.current);
      } catch (error) {
        console.warn('[useAdaptiveQuestionContext] Failed to save context:', error);
      }
    }, AUTO_SAVE_DEBOUNCE_MS);

    // Cleanup on unmount or when context changes
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
    // Only re-run when context changes significantly (not every render)
  }, [context.totalXP, context.currentLevel, context.currentStreak, context.flowState]);

  /**
   * Force refresh the context data from all sources.
   * This bypasses the memoization to ensure fresh data is loaded.
   */
  const refresh = useCallback(() => {
    // Clear the initial mount flag to ensure save on refresh
    isInitialMountRef.current = false;

    // Load fresh data from storage
    let freshMistakes: ReturnType<typeof storage.getMistakes>;
    try {
      freshMistakes = storage.getMistakes();
    } catch {
      freshMistakes = [];
    }

    // Also get fresh XP profile
    const freshProfile = storage.getXPProfile();

    const newContext: AdaptiveQuestionContext = {
      totalXP: freshProfile?.totalXP ?? 0,
      currentLevel: freshProfile?.currentLevel ?? 1,
      currentStreak: streak ?? 0,
      mistakes: freshMistakes,
      weaknesses: contextRef.current.weaknesses,
      recommendations: contextRef.current.recommendations,
      flowState: flowState ?? 'normal',
      fatigueSignals: normalizeFatigueSignals(fatigueSignals),
      updatedAt: Date.now(),
    };

    contextRef.current = newContext;
    setContext(newContext);

    // Immediate save on refresh
    try {
      storage.saveAdaptiveQuestionContext(newContext);
    } catch (error) {
      console.warn('[useAdaptiveQuestionContext] Failed to save context on refresh:', error);
    }
  }, [profile, streak, flowState, fatigueSignals]);

  // Memoize return value to prevent unnecessary re-renders
  const returnValue = useMemo<UseAdaptiveQuestionContextReturn>(() => ({
    context,
    refresh,
  }), [context, refresh]);

  return returnValue;
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

/**
 * Normalize fatigue signals to the format expected by AdaptiveQuestionContext.
 * Handles both the full FatigueSignal type from useFlowState and simplified versions.
 */
function normalizeFatigueSignals(
  signals: FatigueSignal[] | undefined
): Array<{
  type: 'accuracy' | 'consecutive_errors' | 'speed';
  description: string;
  severity: number;
}> {
  if (!signals || signals.length === 0) {
    return [];
  }

  return signals.map((signal) => ({
    type: signal.type,
    description: signal.description,
    severity: signal.severity,
  }));
}

/**
 * Deep equality check for context objects.
 * Used to prevent unnecessary updates when nothing has changed.
 */
function isDeepEqual(a: AdaptiveQuestionContext, b: AdaptiveQuestionContext): boolean {
  // Quick checks for primitives
  if (a.totalXP !== b.totalXP) return false;
  if (a.currentLevel !== b.currentLevel) return false;
  if (a.currentStreak !== b.currentStreak) return false;
  if (a.flowState !== b.flowState) return false;

  // Check mistakes array length (common case)
  if (a.mistakes.length !== b.mistakes.length) return false;

  // Check mistakes for differences (by sentenceId as key)
  if (a.mistakes.length > 0) {
    const aIds = new Set(a.mistakes.map((m) => m.sentenceId));
    const bIds = new Set(b.mistakes.map((m) => m.sentenceId));
    if (aIds.size !== bIds.size) return false;
    for (const id of aIds) {
      if (!bIds.has(id)) return false;
    }
  }

  // Check fatigue signals
  const aSignals = a.fatigueSignals ?? [];
  const bSignals = b.fatigueSignals ?? [];
  if (aSignals.length !== bSignals.length) return false;
  for (let i = 0; i < aSignals.length; i++) {
    const aSignal = aSignals[i];
    const bSignal = bSignals[i];
    if (aSignal.type !== bSignal.type) return false;
    if (aSignal.severity !== bSignal.severity) return false;
  }

  return true;
}