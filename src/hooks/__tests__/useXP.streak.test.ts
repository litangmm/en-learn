import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useXP } from '../useXP';

describe('useXP streak', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initial streak is 0 and maxStreakReached is 0', () => {
    const { result } = renderHook(() => useXP());

    expect(result.current.streak).toBe(0);
    expect(result.current.maxStreakReached).toBe(0);
  });

  it('recordCorrectAnswer increments streak', () => {
    const { result } = renderHook(() => useXP());

    act(() => result.current.recordCorrectAnswer());
    expect(result.current.streak).toBe(1);

    act(() => result.current.recordCorrectAnswer());
    expect(result.current.streak).toBe(2);

    act(() => result.current.recordCorrectAnswer());
    expect(result.current.streak).toBe(3);
  });

  it('recordWrongAnswer resets streak to 0', () => {
    const { result } = renderHook(() => useXP());

    act(() => {
      result.current.recordCorrectAnswer();
      result.current.recordCorrectAnswer();
    });
    expect(result.current.streak).toBe(2);

    act(() => result.current.recordWrongAnswer());
    expect(result.current.streak).toBe(0);
  });

  it('maxStreakReached tracks historical maximum', () => {
    const { result } = renderHook(() => useXP());

    act(() => {
      result.current.recordCorrectAnswer();
      result.current.recordCorrectAnswer();
      result.current.recordCorrectAnswer();
    });
    expect(result.current.streak).toBe(3);
    expect(result.current.maxStreakReached).toBe(3);

    act(() => result.current.recordWrongAnswer());
    expect(result.current.streak).toBe(0);
    expect(result.current.maxStreakReached).toBe(3);

    act(() => {
      result.current.recordCorrectAnswer();
      result.current.recordCorrectAnswer();
    });
    expect(result.current.streak).toBe(2);
    expect(result.current.maxStreakReached).toBe(3);
  });

  it('getStreakMultiplier returns correct values', () => {
    const { result } = renderHook(() => useXP());

    // Streak 0-2 → 1.0
    expect(result.current.addXP(10).multiplier).toBe(1.0);

    act(() => {
      result.current.recordCorrectAnswer();
      result.current.recordCorrectAnswer();
    });
    expect(result.current.addXP(10).multiplier).toBe(1.0);

    // Streak 3-4 → 1.5
    act(() => result.current.recordCorrectAnswer());
    expect(result.current.streak).toBe(3);
    expect(result.current.addXP(10).multiplier).toBe(1.5);

    // Streak 5-9 → 2.0
    act(() => {
      result.current.recordCorrectAnswer();
      result.current.recordCorrectAnswer();
    });
    expect(result.current.streak).toBe(5);
    expect(result.current.addXP(10).multiplier).toBe(2.0);

    // Streak 10+ → 3.0
    for (let i = 0; i < 5; i++) {
      act(() => result.current.recordCorrectAnswer());
    }
    expect(result.current.streak).toBe(10);
    expect(result.current.addXP(10).multiplier).toBe(3.0);
  });

  it('addXP applies multiplier correctly', () => {
    const { result } = renderHook(() => useXP());

    // streak 3 → 1.5x: base 10 → 15 XP
    act(() => {
      result.current.recordCorrectAnswer();
      result.current.recordCorrectAnswer();
      result.current.recordCorrectAnswer();
    });

    const r1 = result.current.addXP(10);
    expect(r1.finalXP).toBe(15);
    expect(r1.multiplier).toBe(1.5);

    // streak 5 → 2.0x: base 10 → 20 XP
    act(() => {
      result.current.recordCorrectAnswer();
      result.current.recordCorrectAnswer();
    });

    const r2 = result.current.addXP(10);
    expect(r2.finalXP).toBe(20);
    expect(r2.multiplier).toBe(2.0);
  });

  it('addXP returns finalXP, multiplier, and streak', () => {
    const { result } = renderHook(() => useXP());

    act(() => result.current.recordCorrectAnswer());

    const r = result.current.addXP(20);
    expect(r.finalXP).toBe(20);
    expect(r.multiplier).toBe(1.0);
    expect(r.streak).toBe(1);
    expect(r.profile).toBeDefined();
  });

  it('resetStreak sets streak to 0 but preserves maxStreakReached', () => {
    const { result } = renderHook(() => useXP());

    act(() => {
      result.current.recordCorrectAnswer();
      result.current.recordCorrectAnswer();
      result.current.recordCorrectAnswer();
    });
    expect(result.current.maxStreakReached).toBe(3);

    act(() => result.current.resetStreak());
    expect(result.current.streak).toBe(0);
    expect(result.current.maxStreakReached).toBe(3);
  });

  it('firstTry bonus works with multiplier', () => {
    const { result } = renderHook(() => useXP());

    // streak 5 → 2.0x + firstTry bonus 5: base 10 → 20 + 5 = 25 XP
    act(() => {
      for (let i = 0; i < 5; i++) {
        result.current.recordCorrectAnswer();
      }
    });

    const r = result.current.addXP(10, true);
    expect(r.finalXP).toBe(25);
    expect(r.multiplier).toBe(2.0);
  });
});
