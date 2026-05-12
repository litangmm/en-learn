import { useState, useRef, useEffect } from 'react';
import { useGoals } from './useGoals';
import type { Goal } from '@/data/types';

/**
 * Hook that wraps useGoals and detects when any goal transitions
 * from !completed to completed. Returns the newly completed goal and a dismiss function.
 */
export function useGoalCompletionNotifier() {
  const { state } = useGoals();
  const [completedGoal, setCompletedGoal] = useState<Goal | null>(null);
  const [triggerKey, setTriggerKey] = useState<string | number>(0);

  // Track previous completion states and last notified goal ID
  const previousCompletedRef = useRef<Record<string, boolean>>({});
  const lastNotifiedRef = useRef<string | null>(null);

  useEffect(() => {
    // Check each goal for a transition from !completed to completed
    let newCompletion: Goal | null = null;
    for (const goal of state.goals) {
      const wasCompleted = previousCompletedRef.current[goal.id] ?? false;
      if (!wasCompleted && goal.completed && goal.id !== lastNotifiedRef.current) {
        newCompletion = goal;
        lastNotifiedRef.current = goal.id;
      }
      previousCompletedRef.current[goal.id] = goal.completed;
    }
    if (newCompletion) {
      setCompletedGoal(newCompletion);
      setTriggerKey(Date.now());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.goals]);

  const dismiss = () => {
    setCompletedGoal(null);
  };

  return {
    completedGoal,
    triggerKey,
    dismiss,
  };
}
