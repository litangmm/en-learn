import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGoals } from '../useGoals';
import { storage } from '@/services/storage';

describe('useGoals', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Set system time to a known date (Monday 2026-05-11)
    vi.setSystemTime(new Date('2026-05-11T08:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // Initialization Tests
  // -------------------------------------------------------------------------

  it('generates default goals when storage is empty', () => {
    const { result } = renderHook(() => useGoals());

    expect(result.current.state.goals).toHaveLength(5);
    // Daily goals: questions, xp, streak
    const dailyGoals = result.current.dailyGoals;
    expect(dailyGoals.length).toBe(3);
    expect(dailyGoals.some((g) => g.type === 'questions' && g.period === 'daily')).toBe(true);
    expect(dailyGoals.some((g) => g.type === 'xp' && g.period === 'daily')).toBe(true);
    expect(dailyGoals.some((g) => g.type === 'streak' && g.period === 'daily')).toBe(true);

    // Weekly goals: questions, xp
    const weeklyGoals = result.current.weeklyGoals;
    expect(weeklyGoals.length).toBe(2);
    expect(weeklyGoals.some((g) => g.type === 'questions' && g.period === 'weekly')).toBe(true);
    expect(weeklyGoals.some((g) => g.type === 'xp' && g.period === 'weekly')).toBe(true);
  });

  it('loads existing goals from storage', () => {
    // Pre-populate storage with custom goals
    const existingGoals = storage.generateDefaultGoals();
    existingGoals.goals[0].target = 99;
    storage.saveGoals(existingGoals);

    const { result } = renderHook(() => useGoals());

    expect(result.current.state.goals[0].target).toBe(99);
  });

  it('all initial goals have current=0 and completed=false', () => {
    const { result } = renderHook(() => useGoals());

    expect(result.current.state.goals.every(
      (g) => g.current === 0 && !g.completed
    )).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Track Progress Tests
  // -------------------------------------------------------------------------

  it('trackProgress increments questions goal', () => {
    const { result } = renderHook(() => useGoals());

    const questionsGoal = result.current.state.goals.find(
      (g) => g.type === 'questions' && g.period === 'daily'
    );
    expect(questionsGoal).toBeDefined();
    const initialCurrent = questionsGoal!.current;

    act(() => {
      result.current.trackProgress('questions', 1);
    });

    const updated = result.current.state.goals.find(
      (g) => g.type === 'questions' && g.period === 'daily'
    );
    expect(updated!.current).toBe(initialCurrent + 1);
  });

  it('trackProgress with custom amount increments XP goal', () => {
    const { result } = renderHook(() => useGoals());

    const xpGoal = result.current.state.goals.find(
      (g) => g.type === 'xp' && g.period === 'daily'
    );
    expect(xpGoal).toBeDefined();

    act(() => {
      result.current.trackProgress('xp', 50);
    });

    const updated = result.current.state.goals.find(
      (g) => g.type === 'xp' && g.period === 'daily'
    );
    expect(updated!.current).toBe(50);
  });

  it('trackProgress marks goal as completed when target is reached', () => {
    const { result } = renderHook(() => useGoals());

    const questionsGoal = result.current.state.goals.find(
      (g) => g.type === 'questions' && g.period === 'daily'
    );
    expect(questionsGoal).toBeDefined();
    const target = questionsGoal!.target;

    // Track until completed
    act(() => {
      result.current.trackProgress('questions', target);
    });

    const updated = result.current.state.goals.find(
      (g) => g.type === 'questions' && g.period === 'daily'
    );
    expect(updated!.completed).toBe(true);
    expect(updated!.current).toBe(target);
  });

  it('trackProgress with period filter only updates matching period', () => {
    const { result } = renderHook(() => useGoals());

    const dailyBefore = result.current.state.goals.find(
      (g) => g.type === 'questions' && g.period === 'daily'
    )!.current;
    const weeklyBefore = result.current.state.goals.find(
      (g) => g.type === 'questions' && g.period === 'weekly'
    )!.current;

    act(() => {
      result.current.trackProgress('questions', 5, 'daily');
    });

    const dailyAfter = result.current.state.goals.find(
      (g) => g.type === 'questions' && g.period === 'daily'
    )!.current;
    const weeklyAfter = result.current.state.goals.find(
      (g) => g.type === 'questions' && g.period === 'weekly'
    )!.current;

    expect(dailyAfter).toBe(dailyBefore + 5);
    expect(weeklyAfter).toBe(weeklyBefore); // Weekly should be unchanged
  });

  it('completed goals stop accepting progress', () => {
    const { result } = renderHook(() => useGoals());

    // Complete the streak goal
    const streakGoal = result.current.state.goals.find(
      (g) => g.type === 'streak' && g.period === 'daily'
    );
    const target = streakGoal!.target;

    act(() => {
      result.current.trackProgress('streak', target);
    });

    const afterComplete = result.current.state.goals.find(
      (g) => g.type === 'streak' && g.period === 'daily'
    )!.current;

    // Try to add more
    act(() => {
      result.current.trackProgress('streak', 10);
    });

    const afterExtra = result.current.state.goals.find(
      (g) => g.type === 'streak' && g.period === 'daily'
    )!.current;

    expect(afterExtra).toBe(afterComplete); // Should not increase
  });

  // -------------------------------------------------------------------------
  // Update Goals Tests
  // -------------------------------------------------------------------------

  it('updateGoals replaces all goals', () => {
    const { result } = renderHook(() => useGoals());

    const newGoals = result.current.state.goals.map((g) => ({
      ...g,
      target: g.target * 2,
    }));

    act(() => {
      result.current.updateGoals(newGoals);
    });

    expect(result.current.state.goals.every((g) => g.target % 2 === 0)).toBe(true);
  });

  it('updateGoal changes a single goal target', () => {
    const { result } = renderHook(() => useGoals());

    const goalId = result.current.state.goals[0].id;

    act(() => {
      result.current.updateGoal(goalId, 999, false);
    });

    expect(result.current.state.goals[0].target).toBe(999);
    // Other goals unchanged
    const othersUnchanged = result.current.state.goals
      .slice(1)
      .every((g) => g.target !== 999);
    expect(othersUnchanged).toBe(true);
    // current should remain 0 (generated goals start with current=0)
    expect(result.current.state.goals[0].current).toBe(0);
  });

  it('updateGoal with resetProgress clears current progress', () => {
    const { result } = renderHook(() => useGoals());

    // First make some progress
    act(() => {
      result.current.trackProgress('questions', 5);
    });

    const goalId = result.current.state.goals.find(
      (g) => g.type === 'questions' && g.period === 'daily'
    )!.id;

    expect(result.current.state.goals.find((g) => g.id === goalId)!.current).toBe(5);

    act(() => {
      result.current.updateGoal(goalId, 20, true);
    });

    const updated = result.current.state.goals.find((g) => g.id === goalId)!;
    expect(updated.current).toBe(0);
    expect(updated.target).toBe(20);
    expect(updated.completed).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Preset Targets Tests
  // -------------------------------------------------------------------------

  it('dailyQuestionTargets returns daily questions goal targets', () => {
    const { result } = renderHook(() => useGoals());

    const dailyQ = result.current.dailyGoals.find((g) => g.type === 'questions');
    expect(result.current.dailyQuestionTargets).toContain(dailyQ!.target);
  });

  it('dailyXPTargets returns daily XP goal targets', () => {
    const { result } = renderHook(() => useGoals());

    const dailyXP = result.current.dailyGoals.find((g) => g.type === 'xp');
    expect(result.current.dailyXPTargets).toContain(dailyXP!.target);
  });

  it('weeklyQuestionTargets returns weekly questions goal targets', () => {
    const { result } = renderHook(() => useGoals());

    const weeklyQ = result.current.weeklyGoals.find((g) => g.type === 'questions');
    expect(result.current.weeklyQuestionTargets).toContain(weeklyQ!.target);
  });

  // -------------------------------------------------------------------------
  // Derived Counts Tests
  // -------------------------------------------------------------------------

  it('completedDailyGoals counts correctly', () => {
    const { result } = renderHook(() => useGoals());

    expect(result.current.completedDailyGoals).toBe(0);

    // Complete all daily goals
    for (const goal of result.current.dailyGoals) {
      act(() => {
        result.current.trackProgress(goal.type, goal.target, goal.period);
      });
    }

    expect(result.current.completedDailyGoals).toBe(3);
  });

  it('completedWeeklyGoals counts correctly', () => {
    const { result } = renderHook(() => useGoals());

    expect(result.current.completedWeeklyGoals).toBe(0);

    // Complete all weekly goals
    for (const goal of result.current.weeklyGoals) {
      act(() => {
        result.current.trackProgress(goal.type, goal.target, goal.period);
      });
    }

    expect(result.current.completedWeeklyGoals).toBe(2);
  });

  // -------------------------------------------------------------------------
  // trackProgressRef Tests (epic-037 iter-002)
  // -------------------------------------------------------------------------

  it('trackProgressRef exists and is a ref object', () => {
    const { result } = renderHook(() => useGoals());

    expect(result.current.trackProgressRef).toBeDefined();
    expect(typeof result.current.trackProgressRef).toBe('object');
    expect('current' in result.current.trackProgressRef!).toBe(true);
  });

  it('trackProgressRef.current is the same as trackProgress', () => {
    const { result } = renderHook(() => useGoals());

    expect(result.current.trackProgressRef.current).toBe(result.current.trackProgress);
  });

  it('trackProgressRef can be used to update goals from outside the hook', () => {
    const { result } = renderHook(() => useGoals());

    const questionsGoal = result.current.state.goals.find(
      (g) => g.type === 'questions' && g.period === 'daily'
    )!;
    const initialCurrent = questionsGoal.current;

    // Use the ref to track progress (simulating useEffect usage)
    act(() => {
      result.current.trackProgressRef.current('questions', 3);
    });

    const updated = result.current.state.goals.find(
      (g) => g.type === 'questions' && g.period === 'daily'
    );
    expect(updated!.current).toBe(initialCurrent + 3);
  });

  it('trackProgressRef.current is stable across re-renders', () => {
    const { result } = renderHook(() => useGoals());

    // Initial ref should be a function
    expect(typeof result.current.trackProgressRef.current).toBe('function');

    // Update goals (triggers re-render)
    act(() => {
      result.current.updateGoals(result.current.state.goals.map(g => ({ ...g, target: g.target + 10 })));
    });

    // After re-render, trackProgressRef.current should still be a valid function
    expect(typeof result.current.trackProgressRef.current).toBe('function');
  });
});
