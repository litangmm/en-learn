import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBadges } from '../useBadges';

describe('useBadges', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initial load with empty state', () => {
    const { result } = renderHook(() => useBadges());

    expect(result.current.unlockedCount).toBe(0);
    expect(result.current.unlockedIds.size).toBe(0);
    expect(result.current.badgeProgress.totalAnswered).toBe(0);
    expect(result.current.badgeProgress.totalCorrect).toBe(0);
    expect(result.current.badgeProgress.totalSessions).toBe(0);
    expect(result.current.badgeProgress.maxStreakEver).toBe(0);
    expect(result.current.badgeProgress.perfectSessions).toBe(0);
    expect(result.current.badgeProgress.totalReviews).toBe(0);
    expect(result.current.badgeProgress.totalChallengesCompleted).toBe(0);
  });

  it('trackProgress("correct") increments totalCorrect and totalAnswered', () => {
    const { result } = renderHook(() => useBadges());

    act(() => {
      result.current.trackProgress('correct');
    });

    expect(result.current.badgeProgress.totalCorrect).toBe(1);
    expect(result.current.badgeProgress.totalAnswered).toBe(1);
  });

  it('trackProgress("wrong") increments totalAnswered only', () => {
    const { result } = renderHook(() => useBadges());

    act(() => {
      result.current.trackProgress('wrong');
    });

    expect(result.current.badgeProgress.totalAnswered).toBe(1);
    expect(result.current.badgeProgress.totalCorrect).toBe(0);
  });

  it('trackProgress("streak", 5) updates maxStreakEver', () => {
    const { result } = renderHook(() => useBadges());

    act(() => {
      result.current.trackProgress('streak', 5);
    });

    expect(result.current.badgeProgress.maxStreakEver).toBe(5);
  });

  it('trackProgress("streak", 3) then 5 updates maxStreakEver to 5', () => {
    const { result } = renderHook(() => useBadges());

    act(() => {
      result.current.trackProgress('streak', 3);
    });

    expect(result.current.badgeProgress.maxStreakEver).toBe(3);

    act(() => {
      result.current.trackProgress('streak', 5);
    });

    expect(result.current.badgeProgress.maxStreakEver).toBe(5);
  });

  it('trackProgress("session_complete") increments totalSessions', () => {
    const { result } = renderHook(() => useBadges());

    act(() => {
      result.current.trackProgress('session_complete');
    });

    expect(result.current.badgeProgress.totalSessions).toBe(1);
  });

  it('trackProgress("perfect_session") increments perfectSessions', () => {
    const { result } = renderHook(() => useBadges());

    act(() => {
      result.current.trackProgress('perfect_session');
    });

    expect(result.current.badgeProgress.perfectSessions).toBe(1);
  });

  it('trackProgress("review") increments totalReviews', () => {
    const { result } = renderHook(() => useBadges());

    act(() => {
      result.current.trackProgress('review');
    });

    expect(result.current.badgeProgress.totalReviews).toBe(1);
  });

  it('trackProgress("challenge") increments totalChallengesCompleted', () => {
    const { result } = renderHook(() => useBadges());

    act(() => {
      result.current.trackProgress('challenge');
    });

    expect(result.current.badgeProgress.totalChallengesCompleted).toBe(1);
  });

  it('checkBadges unlocks first-steps on totalAnswered >= 1', () => {
    const { result } = renderHook(() => useBadges());

    act(() => {
      result.current.trackProgress('correct');
    });

    let newlyUnlocked: ReturnType<typeof result.current.checkBadges>;
    act(() => {
      newlyUnlocked = result.current.checkBadges();
    });

    expect(newlyUnlocked!.some((b) => b.id === 'first-steps')).toBe(true);
    expect(result.current.unlockedIds.has('first-steps')).toBe(true);
    expect(result.current.unlockedCount).toBeGreaterThanOrEqual(1);
  });

  it('checkBadges unlocks correct-10 on totalCorrect >= 10', () => {
    const { result } = renderHook(() => useBadges());

    for (let i = 0; i < 10; i++) {
      act(() => {
        result.current.trackProgress('correct');
      });
    }

    let newlyUnlocked: ReturnType<typeof result.current.checkBadges>;
    act(() => {
      newlyUnlocked = result.current.checkBadges();
    });

    expect(newlyUnlocked!.some((b) => b.id === 'correct-10')).toBe(true);
    expect(result.current.unlockedIds.has('correct-10')).toBe(true);
  });

  it('checkBadges unlocks level-3 when level >= 3 passed', () => {
    const { result } = renderHook(() => useBadges());

    let newlyUnlocked: ReturnType<typeof result.current.checkBadges>;
    act(() => {
      newlyUnlocked = result.current.checkBadges(3);
    });

    expect(newlyUnlocked!.some((b) => b.id === 'level-3')).toBe(true);
    expect(result.current.unlockedIds.has('level-3')).toBe(true);
  });

  it('checkBadges does not re-unlock already unlocked', () => {
    const { result } = renderHook(() => useBadges());

    act(() => {
      result.current.trackProgress('correct');
    });

    act(() => {
      result.current.checkBadges();
    });

    const countAfterFirst = result.current.unlockedCount;

    let newlyUnlocked: ReturnType<typeof result.current.checkBadges>;
    act(() => {
      newlyUnlocked = result.current.checkBadges();
    });

    expect(newlyUnlocked!.length).toBe(0);
    expect(result.current.unlockedCount).toBe(countAfterFirst);
  });

  it('getBadgeProgressPercent returns correct ratio', () => {
    const { result } = renderHook(() => useBadges());

    // correct-10 requires totalCorrect >= 10
    expect(result.current.getBadgeProgressPercent('correct-10')).toBe(0);

    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.trackProgress('correct');
      });
    }

    expect(result.current.getBadgeProgressPercent('correct-10')).toBe(0.5);

    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.trackProgress('correct');
      });
    }

    expect(result.current.getBadgeProgressPercent('correct-10')).toBe(1);
  });

  it('resetBadges clears all data', () => {
    const { result } = renderHook(() => useBadges());

    act(() => {
      result.current.trackProgress('correct');
    });

    act(() => {
      result.current.checkBadges();
    });

    expect(result.current.unlockedCount).toBeGreaterThan(0);
    expect(result.current.badgeProgress.totalCorrect).toBeGreaterThan(0);

    act(() => {
      result.current.resetBadges();
    });

    expect(result.current.unlockedCount).toBe(0);
    expect(result.current.badgeProgress.totalCorrect).toBe(0);
    expect(result.current.badgeProgress.totalAnswered).toBe(0);
    expect(result.current.badgeProgress.totalSessions).toBe(0);
    expect(result.current.badgeProgress.maxStreakEver).toBe(0);
    expect(result.current.badgeProgress.perfectSessions).toBe(0);
    expect(result.current.badgeProgress.totalReviews).toBe(0);
    expect(result.current.badgeProgress.totalChallengesCompleted).toBe(0);
  });
});
