import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMilestones } from '../useMilestones';
import { storage } from '@/services/storage';
import { MILESTONE_DEFINITIONS } from '@/data/types';

const STREAK_STORAGE_KEY = 'en-learn-review-streak';

describe('useMilestones', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Set system time to a known date
    vi.setSystemTime(new Date('2026-05-11T08:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // Helper to set streak data in localStorage
  const setStreakData = (totalReviewDays: number) => {
    const today = '2026-05-11';
    localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify({
      currentStreak: totalReviewDays > 0 ? 1 : 0,
      longestStreak: totalReviewDays,
      lastReviewDate: totalReviewDays > 0 ? today : null,
      totalReviewDays,
    }));
  };

  // -------------------------------------------------------------------------
  // Initialization Tests
  // -------------------------------------------------------------------------

  it('returns all milestone definitions', () => {
    const { result } = renderHook(() => useMilestones());

    expect(result.current.milestoneDefinitions).toEqual(MILESTONE_DEFINITIONS);
    expect(result.current.milestoneDefinitions.length).toBe(7);
  });

  it('starts with empty unlocked milestones when storage is empty', () => {
    const { result } = renderHook(() => useMilestones());

    expect(result.current.unlockedMilestones).toHaveLength(0);
    expect(result.current.unlockedCount).toBe(0);
  });

  it('loads existing unlocked milestones from storage', () => {
    // Pre-populate storage with some unlocked milestones
    const existingMilestones = [
      { id: '7-days', unlockedAt: Date.now() - 86400000 },
    ];
    localStorage.setItem('en-learn-milestones', JSON.stringify({
      unlockedMilestones: existingMilestones,
      updatedAt: Date.now(),
    }));

    const { result } = renderHook(() => useMilestones());

    expect(result.current.unlockedMilestones).toHaveLength(1);
    expect(result.current.unlockedMilestones[0].id).toBe('7-days');
    expect(result.current.unlockedCount).toBe(1);
  });

  // -------------------------------------------------------------------------
  // totalLearningDays Tests
  // -------------------------------------------------------------------------

  it('returns totalLearningDays from streak data', () => {
    setStreakData(25);

    const { result } = renderHook(() => useMilestones());

    expect(result.current.totalLearningDays).toBe(25);
  });

  it('returns 0 totalLearningDays when streak data is empty', () => {
    setStreakData(0);

    const { result } = renderHook(() => useMilestones());

    expect(result.current.totalLearningDays).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Next Milestone Tests
  // -------------------------------------------------------------------------

  it('returns first milestone as next when none unlocked', () => {
    setStreakData(0);

    const { result } = renderHook(() => useMilestones());

    expect(result.current.nextMilestone).not.toBeNull();
    expect(result.current.nextMilestone!.definition.id).toBe('7-days');
    expect(result.current.nextMilestone!.requiredDays).toBe(7);
    expect(result.current.nextMilestone!.currentDays).toBe(0);
    expect(result.current.nextMilestone!.daysRemaining).toBe(7);
  });

  it('calculates progress correctly for next milestone', () => {
    setStreakData(3);

    const { result } = renderHook(() => useMilestones());

    expect(result.current.nextMilestone!.progress).toBe(Math.round((3 / 7) * 100));
    expect(result.current.nextMilestone!.daysRemaining).toBe(4);
  });

  it('caps progress at 100% when exceeding required days', () => {
    setStreakData(10);

    const { result } = renderHook(() => useMilestones());

    expect(result.current.nextMilestone!.progress).toBe(100);
    expect(result.current.nextMilestone!.daysRemaining).toBe(0);
  });

  it('returns null nextMilestone when all milestones unlocked', () => {
    setStreakData(400);

    // Unlock all milestones in storage
    const allUnlocked = MILESTONE_DEFINITIONS.map((m) => ({
      id: m.id,
      unlockedAt: Date.now(),
    }));
    localStorage.setItem('en-learn-milestones', JSON.stringify({
      unlockedMilestones: allUnlocked,
      updatedAt: Date.now(),
    }));

    const { result } = renderHook(() => useMilestones());

    expect(result.current.nextMilestone).toBeNull();
    expect(result.current.milestoneProgress).toBe(-1);
  });

  it('skips already unlocked milestones for next milestone', () => {
    setStreakData(20);

    // Unlock the 7-day milestone
    localStorage.setItem('en-learn-milestones', JSON.stringify({
      unlockedMilestones: [{ id: '7-days', unlockedAt: Date.now() }],
      updatedAt: Date.now(),
    }));

    const { result } = renderHook(() => useMilestones());

    expect(result.current.nextMilestone!.definition.id).toBe('14-days');
    expect(result.current.nextMilestone!.requiredDays).toBe(14);
  });

  // -------------------------------------------------------------------------
  // milestoneProgress Tests
  // -------------------------------------------------------------------------

  it('returns 0 milestoneProgress when no days recorded', () => {
    setStreakData(0);

    const { result } = renderHook(() => useMilestones());

    expect(result.current.milestoneProgress).toBe(0);
  });

  it('calculates milestoneProgress correctly', () => {
    setStreakData(5);

    const { result } = renderHook(() => useMilestones());

    expect(result.current.milestoneProgress).toBe(Math.round((5 / 7) * 100));
  });

  it('returns -1 milestoneProgress when all milestones unlocked', () => {
    setStreakData(400);

    const allUnlocked = MILESTONE_DEFINITIONS.map((m) => ({
      id: m.id,
      unlockedAt: Date.now(),
    }));
    localStorage.setItem('en-learn-milestones', JSON.stringify({
      unlockedMilestones: allUnlocked,
      updatedAt: Date.now(),
    }));

    const { result } = renderHook(() => useMilestones());

    expect(result.current.milestoneProgress).toBe(-1);
  });

  // -------------------------------------------------------------------------
  // unlockedCount Tests
  // -------------------------------------------------------------------------

  it('counts unlocked milestones correctly', () => {
    setStreakData(50);

    const unlockedMilestones = [
      { id: '7-days', unlockedAt: Date.now() },
      { id: '14-days', unlockedAt: Date.now() },
      { id: '30-days', unlockedAt: Date.now() },
    ];
    localStorage.setItem('en-learn-milestones', JSON.stringify({
      unlockedMilestones,
      updatedAt: Date.now(),
    }));

    const { result } = renderHook(() => useMilestones());

    expect(result.current.unlockedCount).toBe(3);
  });

  // -------------------------------------------------------------------------
  // checkAndUnlockMilestones Tests
  // -------------------------------------------------------------------------

  it('does not unlock any milestones when requirements not met', () => {
    setStreakData(3);

    const { result } = renderHook(() => useMilestones());

    const newlyUnlocked = result.current.checkAndUnlockMilestones();

    expect(newlyUnlocked).toHaveLength(0);
  });

  it('unlocks milestone when totalLearningDays meets requirement', () => {
    setStreakData(7);

    const { result } = renderHook(() => useMilestones());

    const newlyUnlocked = result.current.checkAndUnlockMilestones();

    expect(newlyUnlocked).toHaveLength(1);
    expect(newlyUnlocked[0].id).toBe('7-days');
  });

  it('unlocks multiple milestones when multiple requirements met', () => {
    setStreakData(35);

    const { result } = renderHook(() => useMilestones());

    const newlyUnlocked = result.current.checkAndUnlockMilestones();

    expect(newlyUnlocked.length).toBeGreaterThanOrEqual(3);
    expect(newlyUnlocked.map((m) => m.id)).toContain('7-days');
    expect(newlyUnlocked.map((m) => m.id)).toContain('14-days');
    expect(newlyUnlocked.map((m) => m.id)).toContain('30-days');
  });

  it('does not re-unlock already unlocked milestones', () => {
    setStreakData(50);

    // Pre-unlock 7-day milestone
    localStorage.setItem('en-learn-milestones', JSON.stringify({
      unlockedMilestones: [{ id: '7-days', unlockedAt: Date.now() }],
      updatedAt: Date.now(),
    }));

    const { result } = renderHook(() => useMilestones());

    const newlyUnlocked = result.current.checkAndUnlockMilestones();

    // Should unlock 14-days and 30-days, but not 7-days
    expect(newlyUnlocked.map((m) => m.id)).not.toContain('7-days');
    expect(newlyUnlocked.map((m) => m.id)).toContain('14-days');
    expect(newlyUnlocked.map((m) => m.id)).toContain('30-days');
  });

  it('updates local state after unlocking milestones', () => {
    setStreakData(15);

    const { result } = renderHook(() => useMilestones());

    expect(result.current.unlockedCount).toBe(0);

    act(() => {
      result.current.checkAndUnlockMilestones();
    });

    expect(result.current.unlockedCount).toBe(2);
  });

  // -------------------------------------------------------------------------
  // awardMilestone Tests
  // -------------------------------------------------------------------------

  it('awards a specific milestone manually', () => {
    setStreakData(0);

    const { result } = renderHook(() => useMilestones());

    const awarded = result.current.awardMilestone('7-days');

    expect(awarded).not.toBeNull();
    expect(awarded!.id).toBe('7-days');
  });

  it('returns null when awarding non-existent milestone', () => {
    setStreakData(0);

    const { result } = renderHook(() => useMilestones());

    const awarded = result.current.awardMilestone('non-existent');

    expect(awarded).toBeNull();
  });

  it('does not duplicate milestone on second award', () => {
    setStreakData(0);

    const { result } = renderHook(() => useMilestones());

    act(() => {
      result.current.awardMilestone('7-days');
    });

    expect(result.current.unlockedCount).toBe(1);

    // Try to award again
    act(() => {
      result.current.awardMilestone('7-days');
    });

    expect(result.current.unlockedCount).toBe(1);
  });

  it('updates local state after manual award', () => {
    setStreakData(0);

    const { result } = renderHook(() => useMilestones());

    act(() => {
      result.current.awardMilestone('14-days');
    });

    expect(result.current.unlockedCount).toBe(1);
    expect(result.current.unlockedMilestones.some((m) => m.id === '14-days')).toBe(true);
  });

  // -------------------------------------------------------------------------
  // XP Reward Tests
  // -------------------------------------------------------------------------

  it('awards XP when milestone is unlocked via checkAndUnlockMilestones', () => {
    setStreakData(7);

    const initialXP = storage.getXPProfile().totalXP;

    const { result } = renderHook(() => useMilestones());

    act(() => {
      result.current.checkAndUnlockMilestones();
    });

    const afterXP = storage.getXPProfile().totalXP;
    const sevenDayMilestone = MILESTONE_DEFINITIONS.find((m) => m.id === '7-days');

    expect(afterXP).toBe(initialXP + sevenDayMilestone!.xpReward);
  });

  it('awards XP when milestone is manually awarded', () => {
    setStreakData(0);

    const initialXP = storage.getXPProfile().totalXP;

    const { result } = renderHook(() => useMilestones());

    act(() => {
      result.current.awardMilestone('14-days');
    });

    const afterXP = storage.getXPProfile().totalXP;
    const fourteenDayMilestone = MILESTONE_DEFINITIONS.find((m) => m.id === '14-days');

    expect(afterXP).toBe(initialXP + fourteenDayMilestone!.xpReward);
  });

  // -------------------------------------------------------------------------
  // Edge Cases
  // -------------------------------------------------------------------------

  it('handles negative days gracefully (should not happen)', () => {
    setStreakData(-5);

    const { result } = renderHook(() => useMilestones());

    expect(result.current.totalLearningDays).toBe(-5);
    expect(result.current.nextMilestone!.progress).toBe(0);
    // daysRemaining = requiredDays - currentDays = 7 - (-5) = 12
    expect(result.current.nextMilestone!.daysRemaining).toBe(12);
  });

  it('handles very large days count', () => {
    setStreakData(9999);

    const { result } = renderHook(() => useMilestones());

    // Need to call checkAndUnlockMilestones to actually unlock them based on streak data
    act(() => {
      result.current.checkAndUnlockMilestones();
    });

    expect(result.current.nextMilestone).toBeNull();
    expect(result.current.milestoneProgress).toBe(-1);
    expect(result.current.unlockedCount).toBe(7);
  });

  it('nextMilestone updates when unlocked milestone changes', () => {
    // Start with 7 days and unlock 7-day milestone
    setStreakData(7);

    const { result } = renderHook(() => useMilestones());

    act(() => {
      result.current.checkAndUnlockMilestones();
    });

    expect(result.current.nextMilestone!.definition.id).toBe('14-days');
    expect(result.current.unlockedCount).toBe(1);

    // Manually award the next milestone
    act(() => {
      result.current.awardMilestone('14-days');
    });

    // Next milestone should now be 30-days
    expect(result.current.nextMilestone!.definition.id).toBe('30-days');
    expect(result.current.unlockedCount).toBe(2);
  });
});
