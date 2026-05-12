/**
 * useFlowState Hook
 *
 * Tracks learning flow state based on answer history within the current session.
 * Detects when user is in "focused" flow state, "fatigued" state, or "normal" state.
 *
 * Key signals:
 * - Accuracy trend (last N answers)
 * - Consecutive errors (flow disruption)
 * - Answer speed trend (slowing down = potential fatigue)
 *
 * This hook is session-scoped (not persisted) — resets when user starts a new session.
 */

import { useState, useCallback, useMemo } from 'react';

// Constants for flow detection thresholds
const ACCURACY_WINDOW = 5; // Number of recent answers to consider for accuracy
const SPEED_WINDOW = 5; // Number of recent answers to consider for speed
const FATIGUE_ACCURACY_THRESHOLD = 0.4; // Below 40% accuracy → fatigued
const FOCUS_ACCURACY_THRESHOLD = 0.7; // Above 70% accuracy → focused
const CONSECUTIVE_ERRORS_FATIGUE = 3; // 3+ consecutive errors → fatigued
const TIME_SINCE_LAST_CORRECT_FATIGUE_MS = 60000; // 60 seconds → potential fatigue

export type FlowState = 'focused' | 'normal' | 'fatigued';
export type SignalTrend = 'improving' | 'stable' | 'declining';

/**
 * Fatigue signal detected in the current session
 */
export interface FatigueSignal {
  type: 'accuracy' | 'consecutive_errors' | 'speed';
  trend: SignalTrend;
  /** Human-readable description of this signal */
  description: string;
  /** Severity 0-1, higher = more severe fatigue */
  severity: number;
}

/**
 * Single answer record for flow tracking
 */
interface AnswerRecord {
  isCorrect: boolean;
  timestamp: number;
  /** Time taken to answer in ms (from question start to answer) */
  answerTimeMs?: number;
}

/**
 * Hook return type for useFlowState
 */
export interface UseFlowStateReturn {
  /** Current flow state: 'focused' | 'normal' | 'fatigued' */
  flowState: FlowState;
  /** List of active fatigue signals with descriptions */
  fatigueSignals: FatigueSignal[];
  /** Record a correct answer (optionally with answer time) */
  recordCorrect: (_answerTimeMs?: number) => void;
  /** Record a wrong answer (optionally with answer time) */
  recordWrong: (_answerTimeMs?: number) => void;
  /** Reset all flow state (call at session start) */
  reset: () => void;
  /** Current consecutive error count */
  consecutiveErrors: number;
  /** Recent accuracy (0-1) over the tracking window */
  recentAccuracy: number;
}

function computeAccuracyTrend(answers: AnswerRecord[]): SignalTrend {
  if (answers.length < 3) return 'stable';
  const window = answers.slice(-ACCURACY_WINDOW);
  if (window.length < 3) return 'stable';
  const half = Math.ceil(window.length / 2);
  const recentHalf = window.slice(-half);
  const earlierHalf = window.slice(0, half);
  if (recentHalf.length === 0 || earlierHalf.length === 0) return 'stable';
  const recentAccuracy = recentHalf.filter(a => a.isCorrect).length / recentHalf.length;
  const earlierAccuracy = earlierHalf.filter(a => a.isCorrect).length / earlierHalf.length;
  const diff = recentAccuracy - earlierAccuracy;
  if (diff > 0.15) return 'improving';
  if (diff < -0.15) return 'declining';
  return 'stable';
}

function computeSpeedTrend(answers: AnswerRecord[]): SignalTrend {
  if (answers.length < 3) return 'stable';
  const recent = answers.slice(-SPEED_WINDOW);
  if (recent.length < 3) return 'stable';
  const half = Math.ceil(recent.length / 2);
  const recentHalf = recent.slice(-half).filter(a => a.answerTimeMs !== undefined);
  const earlierHalf = recent.slice(0, half).filter(a => a.answerTimeMs !== undefined);
  if (recentHalf.length === 0 || earlierHalf.length === 0) return 'stable';
  const recentAvg = recentHalf.reduce((sum, a) => sum + (a.answerTimeMs ?? 0), 0) / recentHalf.length;
  const earlierAvg = earlierHalf.reduce((sum, a) => sum + (a.answerTimeMs ?? 0), 0) / earlierHalf.length;
  const ratio = recentAvg / Math.max(earlierAvg, 1);
  if (ratio > 1.5) return 'declining'; // Getting slower → potential fatigue
  if (ratio < 0.8) return 'improving'; // Getting faster
  return 'stable';
}

function computeFlowState(
  answers: AnswerRecord[],
  consecutiveErrors: number,
  lastCorrectTimestamp: number | null
): { state: FlowState; signals: FatigueSignal[] } {
  const signals: FatigueSignal[] = [];
  const recentWindow = answers.slice(-ACCURACY_WINDOW);
  const recentAccuracy = recentWindow.length === 0 ? 0 : recentWindow.filter(a => a.isCorrect).length / recentWindow.length;

  // Signal 1: Accuracy trend
  const accuracyTrend = computeAccuracyTrend(answers);
  const accuracySignal: FatigueSignal = {
    type: 'accuracy',
    trend: accuracyTrend,
    description: answers.length < 3
      ? '数据积累中，请继续练习'
      : accuracyTrend === 'improving'
        ? '正确率正在提升，继续保持'
        : accuracyTrend === 'declining'
          ? '正确率有所下降，注意调整节奏'
          : '正确率保持稳定',
    severity: accuracyTrend === 'declining' ? 0.6 : 0.2,
  };
  signals.push(accuracySignal);

  // Signal 2: Consecutive errors
  const errorSignal: FatigueSignal = {
    type: 'consecutive_errors',
    trend: consecutiveErrors >= CONSECUTIVE_ERRORS_FATIGUE ? 'declining' : consecutiveErrors > 0 ? 'stable' : 'stable',
    description: consecutiveErrors >= CONSECUTIVE_ERRORS_FATIGUE
      ? `连续错误 ${consecutiveErrors} 次，可能需要休息一下`
      : consecutiveErrors > 0
        ? `已连续错误 ${consecutiveErrors} 次`
        : '答题状态良好，无连续错误',
    severity: Math.min(consecutiveErrors / CONSECUTIVE_ERRORS_FATIGUE, 1),
  };
  signals.push(errorSignal);

  // Signal 3: Speed trend
  const speedTrend = computeSpeedTrend(answers);
  const speedSignal: FatigueSignal = {
    type: 'speed',
    trend: speedTrend,
    description: speedTrend === 'declining'
      ? '答题速度明显变慢，可能有些疲劳'
      : speedTrend === 'improving'
        ? '答题速度在提升，保持专注'
        : '答题节奏稳定',
    severity: speedTrend === 'declining' ? 0.4 : 0.1,
  };
  signals.push(speedSignal);

  // Require minimum answers before transitioning state (avoid noise with tiny samples)
  if (answers.length < 3) {
    return { state: 'normal', signals };
  }

  // Determine flow state
  const now = Date.now();
  const timeSinceLastCorrect = lastCorrectTimestamp !== null
    ? now - lastCorrectTimestamp
    : Infinity;

  // Fatigue conditions (strong signals)
  const isFatigued =
    recentAccuracy < FATIGUE_ACCURACY_THRESHOLD ||
    consecutiveErrors >= CONSECUTIVE_ERRORS_FATIGUE ||
    timeSinceLastCorrect > TIME_SINCE_LAST_CORRECT_FATIGUE_MS;

  if (isFatigued) {
    return { state: 'fatigued', signals };
  }

  // Focus conditions (strong positive signals)
  const isFocused =
    recentAccuracy >= FOCUS_ACCURACY_THRESHOLD &&
    consecutiveErrors < 2 &&
    accuracyTrend !== 'declining';

  if (isFocused) {
    return { state: 'focused', signals };
  }

  return { state: 'normal', signals };
}

export function useFlowState(): UseFlowStateReturn {
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [lastCorrectTimestamp, setLastCorrectTimestamp] = useState<number | null>(null);

  const { flowState, fatigueSignals } = useMemo(() => {
    const result = computeFlowState(answers, consecutiveErrors, lastCorrectTimestamp);
    return { flowState: result.state, fatigueSignals: result.signals };
  }, [answers, consecutiveErrors, lastCorrectTimestamp]);

  const recordCorrect = useCallback((answerTimeMs?: number) => {
    setLastCorrectTimestamp(Date.now());
    setConsecutiveErrors(0);
    setAnswers(prev => [
      ...prev.slice(-(ACCURACY_WINDOW + SPEED_WINDOW - 1)), // Keep rolling window
      { isCorrect: true, timestamp: Date.now(), answerTimeMs },
    ]);
  }, []);

  const recordWrong = useCallback((answerTimeMs?: number) => {
    setConsecutiveErrors(prev => prev + 1);
    setAnswers(prev => [
      ...prev.slice(-(ACCURACY_WINDOW + SPEED_WINDOW - 1)),
      { isCorrect: false, timestamp: Date.now(), answerTimeMs },
    ]);
  }, []);

  const reset = useCallback(() => {
    setAnswers([]);
    setConsecutiveErrors(0);
    setLastCorrectTimestamp(null);
  }, []);

  const recentAccuracy = useMemo(() => {
    const window = answers.slice(-ACCURACY_WINDOW);
    if (window.length === 0) return 0;
    return window.filter(a => a.isCorrect).length / window.length;
  }, [answers]);

  return {
    flowState,
    fatigueSignals,
    recordCorrect,
    recordWrong,
    reset,
    consecutiveErrors,
    recentAccuracy,
  };
}
