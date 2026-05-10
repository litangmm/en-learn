import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useXP } from '../useXP';
import { storage } from '@/services/storage';

describe('useXP leveledUp detection', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns leveledUp false when addXP does not cause level up', () => {
    const { result } = renderHook(() => useXP());

    act(() => {
      const { leveledUp } = result.current.addXP(10);
      expect(leveledUp).toBe(false);
    });

    expect(result.current.profile.currentLevel).toBe(1);
  });

  it('returns leveledUp true when addXP causes level up', () => {
    // Set XP to near level 2 threshold (level 2 requires 100 XP)
    storage.updateXPProfile({ totalXP: 90, currentLevel: 1, levelProgress: 90 });

    const { result } = renderHook(() => useXP());

    act(() => {
      const { leveledUp, oldLevel, newLevel } = result.current.addXP(20);
      expect(leveledUp).toBe(true);
      expect(oldLevel).toBe(1);
      expect(newLevel).toBe(2);
    });

    expect(result.current.profile.currentLevel).toBe(2);
  });

  it('oldLevel and newLevel are correct when level up occurs', () => {
    // Set XP to near level 2 threshold
    storage.updateXPProfile({ totalXP: 90, currentLevel: 1, levelProgress: 90 });

    const { result } = renderHook(() => useXP());

    let oldLevel: number | undefined;
    let newLevel: number | undefined;

    act(() => {
      const result2 = result.current.addXP(20);
      oldLevel = result2.oldLevel;
      newLevel = result2.newLevel;
    });

    expect(oldLevel).toBe(1);
    expect(newLevel).toBe(2);
  });

  it('can level up multiple times with large XP gain', () => {
    // Start at level 1 with 240 XP
    // Thresholds: [0, 100, 250, 450, 700, ...]
    // 240 + 500 = 740 XP = level 5 (requires 450+)
    storage.updateXPProfile({ totalXP: 240, currentLevel: 1, levelProgress: 90 });

    const { result } = renderHook(() => useXP());

    act(() => {
      const { leveledUp, oldLevel, newLevel } = result.current.addXP(500);
      expect(leveledUp).toBe(true);
      expect(oldLevel).toBe(1);
      expect(newLevel).toBe(5);
    });

    expect(result.current.profile.currentLevel).toBe(5);
  });

  it('addXP return value includes all expected properties', () => {
    const { result } = renderHook(() => useXP());

    let addXPResult: ReturnType<typeof result.current.addXP>;

    act(() => {
      addXPResult = result.current.addXP(10);
    });

    expect(addXPResult).toHaveProperty('profile');
    expect(addXPResult).toHaveProperty('finalXP');
    expect(addXPResult).toHaveProperty('multiplier');
    expect(addXPResult).toHaveProperty('streak');
    expect(addXPResult).toHaveProperty('oldLevel');
    expect(addXPResult).toHaveProperty('newLevel');
    expect(addXPResult).toHaveProperty('leveledUp');
  });

  it('leveledUp is false when firstTry bonus does not cause level up', () => {
    const { result } = renderHook(() => useXP());

    act(() => {
      const { leveledUp } = result.current.addXP(5, true);
      expect(leveledUp).toBe(false);
    });
  });
});