/**
 * useFatigueRecovery Hook
 *
 * Manages the fatigue recovery flow based on flow state.
 * Detects when user needs a break and provides recovery options.
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useFlowState, type FlowState } from './useFlowState';

export type RecoveryOption = 'deep_breathing' | 'stretch' | 'continue';

export type RecoveryStage = 'none' | 'suggestion' | 'in_progress' | 'completed';

export interface RecoverySession {
  startedAt: number;
  option: RecoveryOption;
  duration: number;
}

/**
 * Hook return type for useFatigueRecovery
 */
export interface UseFatigueRecoveryReturn {
  /** Whether recovery UI should be shown */
  showRecovery: boolean;
  /** Current recovery stage */
  stage: RecoveryStage;
  /** Current flow state from useFlowState */
  flowState: FlowState;
  /** Recommended recovery option based on fatigue severity */
  recommendedOption: RecoveryOption;
  /** Fatigue signals for display */
  fatigueSignalsText: string;
  /** Current recovery session if in progress */
  currentSession: RecoverySession | null;
  /** Time remaining in current exercise (seconds) */
  exerciseTimeRemaining: number;
  /** Start a recovery session */
  startRecovery: (option: RecoveryOption) => void;
  /** Skip recovery and continue */
  skipRecovery: () => void;
  /** Complete the recovery session */
  completeRecovery: () => void;
  /** Dismiss the recovery suggestion */
  dismissSuggestion: () => void;
}

// Constants
const RECOVERY_SUGGESTION_DELAY_MS = 5000; // Show suggestion 5s after fatigue detected
const BREATHING_DURATION_SECONDS = 60; // 1 minute breathing exercise
const STRETCH_DURATION_SECONDS = 30; // 30 seconds stretch reminder

function getRecommendedOption(consecutiveErrors: number): RecoveryOption {
  // If very fatigued (many consecutive errors), recommend deep breathing
  if (consecutiveErrors >= 3) {
    return 'deep_breathing';
  }
  // Otherwise, recommend stretch
  return 'stretch';
}

function getFatigueSignalsText(signals: { type: string; description: string }[]): string {
  const fatigueSignal = signals.find(s => s.type !== 'accuracy');
  return fatigueSignal?.description || '检测到疲劳信号，建议休息一下';
}

export function useFatigueRecovery(): UseFatigueRecoveryReturn {
  const flowStateHook = useFlowState();
  const { flowState, fatigueSignals, consecutiveErrors } = flowStateHook;

  const [stage, setStage] = useState<RecoveryStage>('none');
  const [currentSession, setCurrentSession] = useState<RecoverySession | null>(null);
  const [exerciseTimeRemaining, setExerciseTimeRemaining] = useState(0);
  const [showSuggestionTimestamp, setShowSuggestionTimestamp] = useState<number | null>(null);

  // Calculate recommended option
  const recommendedOption = useMemo(
    () => getRecommendedOption(consecutiveErrors),
    [consecutiveErrors]
  );

  // Get fatigue signals text
  const fatigueSignalsText = useMemo(
    () => getFatigueSignalsText(fatigueSignals),
    [fatigueSignals]
  );

  // Timer for recovery exercise
  useEffect(() => {
    if (stage !== 'in_progress' || exerciseTimeRemaining <= 0) return;

    const timer = setInterval(() => {
      setExerciseTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-complete the exercise
          setStage('completed');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, exerciseTimeRemaining]);

  // Detect fatigue and show suggestion after delay
  useEffect(() => {
    if (flowState === 'fatigued' && stage === 'none' && showSuggestionTimestamp === null) {
      // Setting timestamp to trigger delayed suggestion
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSuggestionTimestamp(Date.now());
    } else if (flowState !== 'fatigued' && stage === 'suggestion') {
      // User recovered naturally, dismiss suggestion
      setStage('none');
      setShowSuggestionTimestamp(null);
    }
  }, [flowState, stage, showSuggestionTimestamp]);

  // Show suggestion after delay when fatigued
  useEffect(() => {
    if (showSuggestionTimestamp === null) return;

    const timer = setTimeout(() => {
      if (flowState === 'fatigued') {
        setStage('suggestion');
      }
      setShowSuggestionTimestamp(null);
    }, RECOVERY_SUGGESTION_DELAY_MS);

    return () => clearTimeout(timer);
  }, [showSuggestionTimestamp, flowState]);

  const startRecovery = useCallback((option: RecoveryOption) => {
    const duration = option === 'deep_breathing' ? BREATHING_DURATION_SECONDS : STRETCH_DURATION_SECONDS;
    setCurrentSession({
      startedAt: Date.now(),
      option,
      duration,
    });
    setExerciseTimeRemaining(duration);
    setStage('in_progress');
  }, []);

  const skipRecovery = useCallback(() => {
    setStage('none');
    setCurrentSession(null);
    setExerciseTimeRemaining(0);
    setShowSuggestionTimestamp(null);
  }, []);

  const dismissSuggestion = useCallback(() => {
    setStage('none');
    setShowSuggestionTimestamp(null);
  }, []);

  const completeRecovery = useCallback(() => {
    setStage('completed');
  }, []);

  const showRecovery = stage !== 'none';

  return {
    showRecovery,
    stage,
    flowState,
    recommendedOption,
    fatigueSignalsText,
    currentSession,
    exerciseTimeRemaining,
    startRecovery,
    skipRecovery,
    completeRecovery,
    dismissSuggestion,
  };
}

export default useFatigueRecovery;
