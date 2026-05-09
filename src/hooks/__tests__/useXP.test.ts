import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useXP } from '../useXP';
import { storage } from '@/services/storage';

describe('useXP', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads default profile from storage on init', () => {
    const { result } = renderHook(() => useXP());

    expect(result.current.profile).toEqual({
      totalXP: 0,
      currentLevel: 1,
      levelProgress: 0,
    });
  });

  it('loads existing profile from storage on init', () => {
    storage.updateXPProfile({ totalXP: 150, currentLevel: 2, levelProgress: 50 });

    const { result } = renderHook(() => useXP());

    expect(result.current.profile).toEqual({
      totalXP: 150,
      currentLevel: 2,
      levelProgress: 50,
    });
  });

  it('addXP updates state with base XP', () => {
    const { result } = renderHook(() => useXP());

    act(() => {
      result.current.addXP(50);
    });

    expect(result.current.profile.totalXP).toBe(50);
    expect(result.current.profile.currentLevel).toBe(1);
  });

  it('addXP applies firstTry bonus', () => {
    const { result } = renderHook(() => useXP());

    act(() => {
      result.current.addXP(10, true);
    });

    expect(result.current.profile.totalXP).toBe(15);
  });

  it('addXP without firstTry does not add bonus', () => {
    const { result } = renderHook(() => useXP());

    act(() => {
      result.current.addXP(10, false);
    });

    expect(result.current.profile.totalXP).toBe(10);
  });

  it('level-up is reflected in state after addXP', () => {
    storage.updateXPProfile({ totalXP: 90, currentLevel: 1, levelProgress: 90 });

    const { result } = renderHook(() => useXP());

    act(() => {
      result.current.addXP(20);
    });

    expect(result.current.profile.totalXP).toBe(110);
    expect(result.current.profile.currentLevel).toBe(2);
  });

  it('resetXPProfile clears state to default', () => {
    storage.updateXPProfile({ totalXP: 200, currentLevel: 3, levelProgress: 25 });

    const { result } = renderHook(() => useXP());

    expect(result.current.profile.totalXP).toBe(200);

    act(() => {
      result.current.resetXPProfile();
    });

    expect(result.current.profile).toEqual({
      totalXP: 0,
      currentLevel: 1,
      levelProgress: 0,
    });
  });

  it('resetXPProfile clears storage', () => {
    storage.updateXPProfile({ totalXP: 200, currentLevel: 3, levelProgress: 25 });

    const { result } = renderHook(() => useXP());

    act(() => {
      result.current.resetXPProfile();
    });

    const stored = storage.getXPProfile();
    expect(stored).toEqual({
      totalXP: 0,
      currentLevel: 1,
      levelProgress: 0,
    });
  });
});
