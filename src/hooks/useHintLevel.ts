/**
 * useHintLevel Hook
 *
 * Manages dynamic hint level based on user answer history.
 * - 5 consecutive correct answers → hint level increases to 'high'
 * - 3 consecutive wrong answers → hint level decreases to 'none'
 * - Default hint level is 'medium'
 * - Manual override is supported
 * - Persists config to localStorage
 */

import { useState, useCallback } from 'react';
import { storage } from '@/services/storage';
import type { HintLevel, HintConfig } from '@/data/types';
import { HINT_ADJUSTMENT_THRESHOLDS, HINT_PROBABILITIES } from '@/data/types';

/**
 * Hook return type for useHintLevel
 */
export interface UseHintLevelReturn {
  /** Current hint level */
  hintLevel: HintLevel;
  /** Current hint config (includes consecutive counts) */
  config: HintConfig;
  /** Record a correct answer - may trigger level adjustment */
  recordCorrectAnswer: () => void;
  /** Record a wrong answer - may trigger level adjustment */
  recordWrongAnswer: () => void;
  /** Manually override hint level (e.g., user explicitly toggles hints) */
  setHintLevel: (_level: HintLevel) => void;
  /** Check if hints should be shown based on current level and probability */
  shouldShowHint: () => boolean;
  /** Reset consecutive counts and config (e.g., at session start) */
  reset: () => void;
}

export function useHintLevel(): UseHintLevelReturn {
  // Initialize from storage or use defaults
  const [config, setConfig] = useState<HintConfig>(() => storage.getHintConfig());

  // Current hint level
  const hintLevel = config.level;

  /**
   * Record a correct answer.
   * Increments consecutive correct count and may trigger level adjustment:
   * - 5 consecutive correct → 'high' level
   * - Otherwise stays at current level (or auto-adjusts based on wrong count)
   */
  const recordCorrectAnswer = useCallback(() => {
    setConfig((prev) => {
      const newConsecutiveCorrect = prev.consecutiveCorrect + 1;
      const newConsecutiveWrong = 0; // Reset wrong streak

      let newLevel = prev.level;

      // Auto-adjust if thresholds are met
      if (newConsecutiveCorrect >= HINT_ADJUSTMENT_THRESHOLDS.correctToHigh) {
        newLevel = 'high';
      }

      const newConfig: HintConfig = {
        level: newLevel,
        consecutiveCorrect: newConsecutiveCorrect,
        consecutiveWrong: newConsecutiveWrong,
      };

      // Persist to storage
      storage.setHintConfig(newConfig);
      return newConfig;
    });
  }, []);

  /**
   * Record a wrong answer.
   * Increments consecutive wrong count and may trigger level adjustment:
   * - 3 consecutive wrong → 'none' level
   * - Otherwise stays at current level
   */
  const recordWrongAnswer = useCallback(() => {
    setConfig((prev) => {
      const newConsecutiveWrong = prev.consecutiveWrong + 1;
      const newConsecutiveCorrect = 0; // Reset correct streak

      let newLevel = prev.level;

      // Auto-adjust if thresholds are met
      if (newConsecutiveWrong >= HINT_ADJUSTMENT_THRESHOLDS.wrongToNone) {
        newLevel = 'none';
      }

      const newConfig: HintConfig = {
        level: newLevel,
        consecutiveCorrect: newConsecutiveCorrect,
        consecutiveWrong: newConsecutiveWrong,
      };

      // Persist to storage
      storage.setHintConfig(newConfig);
      return newConfig;
    });
  }, []);

  /**
   * Manually set hint level (e.g., user toggles hints on/off).
   * Resets consecutive counts since manual override is explicit.
   */
  const setHintLevel = useCallback((level: HintLevel) => {
    const newConfig: HintConfig = {
      level,
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
    };
    storage.setHintConfig(newConfig);
    setConfig(newConfig);
  }, []);

  /**
   * Check if hints should be shown based on current level and probability.
   * Uses Math.random() to determine if hint is shown at 'low' or 'medium' level.
   */
  const shouldShowHint = useCallback((): boolean => {
    const probability = HINT_PROBABILITIES[hintLevel];
    if (probability === 0) return false;
    if (probability === 1) return true;
    return Math.random() < probability;
  }, [hintLevel]);

  /**
   * Reset the config to defaults (e.g., at session start).
   */
  const reset = useCallback(() => {
    const newConfig: HintConfig = {
      level: 'medium',
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
    };
    storage.setHintConfig(newConfig);
    setConfig(newConfig);
  }, []);

  return {
    hintLevel,
    config,
    recordCorrectAnswer,
    recordWrongAnswer,
    setHintLevel,
    shouldShowHint,
    reset,
  };
}
