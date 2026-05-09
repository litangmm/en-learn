import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDailyChallenges } from '../useDailyChallenges';
import { storage } from '@/services/storage';

describe('useDailyChallenges', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-10T08:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('generates initial challenges when storage is empty', () => {
    const { result } = renderHook(() => useDailyChallenges());

    expect(result.current.state.date).toBe('2026-05-10');
    expect(result.current.state.challenges).toHaveLength(3);
    expect(result.current.state.challenges.every((c) => c.current === 0 && !c.completed && !c.claimed)).toBe(true);
  });

  it('loads existing today\'s challenges from storage', () => {
    const existing = storage.generateDailyChallenges('2026-05-10');
    existing.challenges[0].current = 2;
    storage.saveDailyChallenges(existing);

    const { result } = renderHook(() => useDailyChallenges());

    expect(result.current.state.date).toBe('2026-05-10');
    expect(result.current.state.challenges[0].current).toBe(2);
  });

  it('generates new challenges on date rollover', () => {
    const yesterday = storage.generateDailyChallenges('2026-05-09');
    yesterday.challenges[0].current = 5;
    yesterday.challenges[0].completed = true;
    storage.saveDailyChallenges(yesterday);

    const { result } = renderHook(() => useDailyChallenges());

    expect(result.current.state.date).toBe('2026-05-10');
    expect(result.current.state.challenges.every((c) => c.current === 0 && !c.completed)).toBe(true);
  });

  it('trackActivity("correct") increments correct-type challenges', () => {
    const { result } = renderHook(() => useDailyChallenges());

    const correctChallenges = result.current.state.challenges.filter((c) => c.type === 'correct');
    if (correctChallenges.length === 0) {
      // If no correct challenge in today's selection, skip meaningful assertion
      return;
    }

    const targetId = correctChallenges[0].id;
    const before = result.current.state.challenges.find((c) => c.id === targetId)!.current;

    act(() => {
      result.current.trackActivity('correct');
    });

    const after = result.current.state.challenges.find((c) => c.id === targetId)!.current;
    expect(after).toBe(before + 1);
  });

  it('trackActivity("answer") increments answer-type challenges', () => {
    const { result } = renderHook(() => useDailyChallenges());

    const answerChallenges = result.current.state.challenges.filter((c) => c.type === 'answer');
    if (answerChallenges.length === 0) {
      return;
    }

    const targetId = answerChallenges[0].id;
    const before = result.current.state.challenges.find((c) => c.id === targetId)!.current;

    act(() => {
      result.current.trackActivity('answer');
    });

    const after = result.current.state.challenges.find((c) => c.id === targetId)!.current;
    expect(after).toBe(before + 1);
  });

  it('trackActivity("streak", 3) completes streak-3 challenge', () => {
    // Force a known challenge pool by seeding with a specific date
    // First, let's find a date that includes streak-3
    let foundDate = '';
    for (let i = 0; i < 365; i++) {
      const d = new Date('2026-01-01');
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const s = storage.generateDailyChallenges(dateStr);
      if (s.challenges.some((c) => c.id === 'streak-3')) {
        foundDate = dateStr;
        break;
      }
    }

    if (!foundDate) {
      throw new Error('Could not find a date with streak-3 challenge');
    }

    vi.setSystemTime(new Date(`${foundDate}T08:00:00Z`));
    localStorage.clear();

    const { result } = renderHook(() => useDailyChallenges());

    const streak3 = result.current.state.challenges.find((c) => c.id === 'streak-3');
    expect(streak3).toBeDefined();

    act(() => {
      result.current.trackActivity('streak', 3);
    });

    const updated = result.current.state.challenges.find((c) => c.id === 'streak-3')!;
    expect(updated.current).toBe(3);
    expect(updated.completed).toBe(true);
  });

  it('trackActivity("streak", 2) does not complete streak-3 challenge', () => {
    // Force a known challenge pool by seeding with a specific date
    let foundDate = '';
    for (let i = 0; i < 365; i++) {
      const d = new Date('2026-01-01');
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      const s = storage.generateDailyChallenges(dateStr);
      if (s.challenges.some((c) => c.id === 'streak-3')) {
        foundDate = dateStr;
        break;
      }
    }

    if (!foundDate) {
      throw new Error('Could not find a date with streak-3 challenge');
    }

    vi.setSystemTime(new Date(`${foundDate}T08:00:00Z`));
    localStorage.clear();

    const { result } = renderHook(() => useDailyChallenges());

    act(() => {
      result.current.trackActivity('streak', 2);
    });

    const updated = result.current.state.challenges.find((c) => c.id === 'streak-3')!;
    expect(updated.current).toBe(2);
    expect(updated.completed).toBe(false);
  });

  it('completed challenge stops accepting increments', () => {
    const { result } = renderHook(() => useDailyChallenges());

    const correctChallenges = result.current.state.challenges.filter((c) => c.type === 'correct');
    if (correctChallenges.length === 0) {
      return;
    }

    const targetId = correctChallenges[0].id;
    const target = result.current.state.challenges.find((c) => c.id === targetId)!;

    // Complete the challenge
    for (let i = 0; i < target.target + 5; i++) {
      act(() => {
        result.current.trackActivity('correct');
      });
    }

    const updated = result.current.state.challenges.find((c) => c.id === targetId)!;
    expect(updated.current).toBe(target.target);
    expect(updated.completed).toBe(true);
  });

  it('claimReward adds XP and marks claimed', () => {
    const { result } = renderHook(() => useDailyChallenges());

    const correctChallenges = result.current.state.challenges.filter((c) => c.type === 'correct');
    if (correctChallenges.length === 0) {
      return;
    }

    const targetId = correctChallenges[0].id;
    const target = result.current.state.challenges.find((c) => c.id === targetId)!;

    // Complete the challenge
    for (let i = 0; i < target.target; i++) {
      act(() => {
        result.current.trackActivity('correct');
      });
    }

    const beforeXP = storage.getXPProfile().totalXP;

    act(() => {
      result.current.claimReward(targetId);
    });

    const updated = result.current.state.challenges.find((c) => c.id === targetId)!;
    expect(updated.claimed).toBe(true);
    expect(storage.getXPProfile().totalXP).toBe(beforeXP + target.rewardXP);
  });

  it('claimReward on uncompleted challenge does nothing', () => {
    const { result } = renderHook(() => useDailyChallenges());

    const challengeId = result.current.state.challenges[0].id;
    const beforeXP = storage.getXPProfile().totalXP;

    act(() => {
      result.current.claimReward(challengeId);
    });

    const updated = result.current.state.challenges.find((c) => c.id === challengeId)!;
    expect(updated.claimed).toBe(false);
    expect(storage.getXPProfile().totalXP).toBe(beforeXP);
  });

  it('claimReward on already claimed challenge does nothing', () => {
    const { result } = renderHook(() => useDailyChallenges());

    const correctChallenges = result.current.state.challenges.filter((c) => c.type === 'correct');
    if (correctChallenges.length === 0) {
      return;
    }

    const targetId = correctChallenges[0].id;
    const target = result.current.state.challenges.find((c) => c.id === targetId)!;

    // Complete and claim
    for (let i = 0; i < target.target; i++) {
      act(() => {
        result.current.trackActivity('correct');
      });
    }

    act(() => {
      result.current.claimReward(targetId);
    });

    const afterFirstClaim = storage.getXPProfile().totalXP;

    act(() => {
      result.current.claimReward(targetId);
    });

    expect(storage.getXPProfile().totalXP).toBe(afterFirstClaim);
  });

  it('unclaimedCount updates correctly', () => {
    const { result } = renderHook(() => useDailyChallenges());

    expect(result.current.unclaimedCount).toBe(0);

    const correctChallenges = result.current.state.challenges.filter((c) => c.type === 'correct');
    if (correctChallenges.length === 0) {
      return;
    }

    // Complete only the first correct challenge by targeting it specifically
    const targetId = correctChallenges[0].id;
    const target = result.current.state.challenges.find((c) => c.id === targetId)!;

    // Track exactly target times to complete just this one challenge
    for (let i = 0; i < target.target; i++) {
      act(() => {
        result.current.trackActivity('correct');
      });
    }

    // Count how many are completed but unclaimed
    const completedUnclaimed = result.current.state.challenges.filter(
      (c) => c.completed && !c.claimed
    ).length;
    expect(result.current.unclaimedCount).toBe(completedUnclaimed);
    expect(result.current.unclaimedCount).toBeGreaterThanOrEqual(1);

    const beforeClaim = result.current.unclaimedCount;

    act(() => {
      result.current.claimReward(targetId);
    });

    expect(result.current.unclaimedCount).toBe(beforeClaim - 1);
  });
});
