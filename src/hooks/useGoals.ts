import { useState, useCallback, useMemo } from 'react';
import type { Goal, GoalType, GoalPeriod, GoalState } from '@/data/types';
import { storage } from '@/services/storage';

/** Get today's date string in YYYY-MM-DD format */
function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Get the Monday of the current week in YYYY-MM-DD format */
function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  // Monday = 1, ..., Sunday = 0
  // If Sunday, go back 6 days; otherwise go back (day - 1) days
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

function getCurrentWeekStart(): string {
  return getWeekStart(new Date());
}

export function useGoals() {
  // Lazy initialization: load from storage or generate defaults
  const [state, setState] = useState<GoalState>(() => {
    const stored = storage.getGoals();
    if (stored) {
      return stored;
    }
    return storage.generateDefaultGoals();
  });

  // Track last reset dates to detect day/week rollover
  const [lastDailyReset, setLastDailyReset] = useState<string>(getToday);
  const [lastWeeklyReset, setLastWeeklyReset] = useState<string>(getCurrentWeekStart);

  /**
   * Check if a date rollover has occurred and reset goal progress accordingly.
   * Called on mount and periodically to handle midnight/week transitions.
   */
  const checkDateRollover = useCallback(() => {
    const today = getToday();
    const weekStart = getCurrentWeekStart();

    let needsSave = false;

    // Check daily rollover
    if (today !== lastDailyReset) {
      setState((prev) => {
        const updated = {
          ...prev,
          goals: prev.goals.map((g) =>
            g.period === 'daily' && !g.completed
              ? { ...g, current: 0, updatedAt: Date.now() }
              : g.period === 'daily' && g.completed
              ? { ...g, current: 0, completed: false, updatedAt: Date.now() }
              : g
          ),
          updatedAt: Date.now(),
        };
        needsSave = true;
        return updated;
      });
      setLastDailyReset(today);
    }

    // Check weekly rollover
    if (weekStart !== lastWeeklyReset) {
      setState((prev) => {
        const updated = {
          ...prev,
          goals: prev.goals.map((g) =>
            g.period === 'weekly' && !g.completed
              ? { ...g, current: 0, updatedAt: Date.now() }
              : g.period === 'weekly' && g.completed
              ? { ...g, current: 0, completed: false, updatedAt: Date.now() }
              : g
          ),
          updatedAt: Date.now(),
        };
        needsSave = true;
        return updated;
      });
      setLastWeeklyReset(weekStart);
    }

    if (needsSave) {
      setState((prev) => {
        storage.saveGoals(prev);
        return prev;
      });
    }
  }, [lastDailyReset, lastWeeklyReset]);

  // Run date rollover check on mount
  checkDateRollover();

  /**
   * Update all goals at once.
   * Used when user saves the goal setting panel.
   */
  const updateGoals = useCallback((goals: Goal[]) => {
    const now = Date.now();
    const updated: GoalState = {
      goals,
      updatedAt: now,
    };
    storage.saveGoals(updated);
    setState(updated);
  }, []);

  /**
   * Track progress for a specific goal type.
   * Automatically marks goals as completed when target is reached.
   *
   * @param type - The type of goal to update
   * @param amount - The amount to add (default 1 for questions/streak, or actual XP)
   * @param period - Filter to a specific period (default: both daily and weekly)
   */
  const trackProgress = useCallback(
    (type: GoalType, amount: number = 1, period?: GoalPeriod) => {
      setState((prev) => {
        const now = Date.now();
        let changed = false;

        const updatedGoals = prev.goals.map((g) => {
          // Skip if period doesn't match (when specified)
          if (period !== undefined && g.period !== period) {
            return g;
          }
          // Skip if type doesn't match
          if (g.type !== type) {
            return g;
          }
          // Skip if already completed
          if (g.completed) {
            return g;
          }

          const newCurrent = g.current + amount;
          const isNowCompleted = newCurrent >= g.target;
          changed = true;

          return {
            ...g,
            current: isNowCompleted ? g.target : newCurrent,
            completed: isNowCompleted,
            updatedAt: now,
          };
        });

        if (!changed) {
          return prev;
        }

        const updated: GoalState = {
          goals: updatedGoals,
          updatedAt: now,
        };
        storage.saveGoals(updated);
        return updated;
      });
    },
    []
  );

  /**
   * Update a single goal's target (and optionally reset its progress).
   */
  const updateGoal = useCallback((goalId: string, newTarget: number, resetProgress: boolean = false) => {
    setState((prev) => {
      const now = Date.now();
      const updatedGoals = prev.goals.map((g) => {
        if (g.id !== goalId) return g;
        return {
          ...g,
          target: newTarget,
          current: resetProgress ? 0 : g.current,
          completed: resetProgress ? false : g.current >= newTarget,
          updatedAt: now,
        };
      });
      const updated: GoalState = {
        goals: updatedGoals,
        updatedAt: now,
      };
      storage.saveGoals(updated);
      return updated;
    });
  }, []);

  // Derived: daily goals
  const dailyGoals = useMemo(
    () => state.goals.filter((g) => g.period === 'daily'),
    [state.goals]
  );

  // Derived: weekly goals
  const weeklyGoals = useMemo(
    () => state.goals.filter((g) => g.period === 'weekly'),
    [state.goals]
  );

  // Derived: completed daily goals count
  const completedDailyGoals = useMemo(
    () => dailyGoals.filter((g) => g.completed).length,
    [dailyGoals]
  );

  // Derived: completed weekly goals count
  const completedWeeklyGoals = useMemo(
    () => weeklyGoals.filter((g) => g.completed).length,
    [weeklyGoals]
  );

  // Derived: preset targets organized by period and type
  const dailyQuestionTargets = useMemo(
    () => dailyGoals.filter((g) => g.type === 'questions').map((g) => g.target),
    [dailyGoals]
  );

  const dailyXPTargets = useMemo(
    () => dailyGoals.filter((g) => g.type === 'xp').map((g) => g.target),
    [dailyGoals]
  );

  const dailyStreakTargets = useMemo(
    () => dailyGoals.filter((g) => g.type === 'streak').map((g) => g.target),
    [dailyGoals]
  );

  const weeklyQuestionTargets = useMemo(
    () => weeklyGoals.filter((g) => g.type === 'questions').map((g) => g.target),
    [weeklyGoals]
  );

  const weeklyXPTargets = useMemo(
    () => weeklyGoals.filter((g) => g.type === 'xp').map((g) => g.target),
    [weeklyGoals]
  );

  return {
    // State
    state,
    dailyGoals,
    weeklyGoals,

    // Progress tracking
    trackProgress,

    // Goal CRUD
    updateGoals,
    updateGoal,

    // Date rollover check
    checkDateRollover,

    // Derived counts
    completedDailyGoals,
    completedWeeklyGoals,

    // Preset targets
    dailyQuestionTargets,
    dailyXPTargets,
    dailyStreakTargets,
    weeklyQuestionTargets,
    weeklyXPTargets,
  };
}
