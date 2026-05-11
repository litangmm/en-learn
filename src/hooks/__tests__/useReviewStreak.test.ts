import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    _getStore: () => store,
    _clearStore: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

import { useReviewStreak } from '../useReviewStreak';
import { renderHook, act } from '@testing-library/react';

describe('useReviewStreak', () => {
  beforeEach(() => {
    localStorageMock._clearStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorageMock._clearStore();
  });

  describe('Initial state', () => {
    it('returns default values when no streak data exists', () => {
      const { result } = renderHook(() => useReviewStreak());

      expect(result.current.data.currentStreak).toBe(0);
      expect(result.current.data.longestStreak).toBe(0);
      expect(result.current.data.isStreakActive).toBe(false);
      expect(result.current.data.totalReviewDays).toBe(0);
    });

    it('loads existing streak data from localStorage', () => {
      const today = new Date().toISOString().split('T')[0];
      const storedData = {
        currentStreak: 5,
        longestStreak: 10,
        lastReviewDate: today,
        totalReviewDays: 25,
        isStreakActive: true,
      };

      localStorageMock._getStore()['en-learn-review-streak'] = JSON.stringify(storedData);

      const { result } = renderHook(() => useReviewStreak());

      expect(result.current.data.currentStreak).toBe(5);
      expect(result.current.data.longestStreak).toBe(10);
      expect(result.current.data.isStreakActive).toBe(true);
      expect(result.current.data.totalReviewDays).toBe(25);
    });
  });

  describe('recordReview', () => {
    it('starts a new streak when no previous data exists', () => {
      const { result } = renderHook(() => useReviewStreak());

      act(() => {
        result.current.recordReview();
      });

      expect(result.current.data.currentStreak).toBe(1);
      expect(result.current.data.isStreakActive).toBe(true);
    });

    it('increments streak when reviewing on consecutive day', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const storedData = {
        currentStreak: 3,
        longestStreak: 5,
        lastReviewDate: yesterdayStr,
        totalReviewDays: 3,
      };

      localStorageMock._getStore()['en-learn-review-streak'] = JSON.stringify(storedData);

      const { result } = renderHook(() => useReviewStreak());

      expect(result.current.data.currentStreak).toBe(3);

      act(() => {
        result.current.recordReview();
      });

      expect(result.current.data.currentStreak).toBe(4);
      expect(result.current.data.totalReviewDays).toBe(4);
    });

    it('resets streak when missing a day', () => {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

      const storedData = {
        currentStreak: 5,
        longestStreak: 10,
        lastReviewDate: twoDaysAgoStr,
        totalReviewDays: 10,
      };

      localStorageMock._getStore()['en-learn-review-streak'] = JSON.stringify(storedData);

      const { result } = renderHook(() => useReviewStreak());

      expect(result.current.data.currentStreak).toBe(5);

      act(() => {
        result.current.recordReview();
      });

      expect(result.current.data.currentStreak).toBe(1);
      expect(result.current.data.totalReviewDays).toBe(11);
    });

    it('does not increment when already reviewed today', () => {
      const today = new Date().toISOString().split('T')[0];

      const storedData = {
        currentStreak: 3,
        longestStreak: 5,
        lastReviewDate: today,
        totalReviewDays: 3,
      };

      localStorageMock._getStore()['en-learn-review-streak'] = JSON.stringify(storedData);

      const { result } = renderHook(() => useReviewStreak());

      const initialStreak = result.current.data.currentStreak;

      act(() => {
        result.current.recordReview();
      });

      expect(result.current.data.currentStreak).toBe(initialStreak);
    });
  });

  describe('Longest streak tracking', () => {
    it('updates longest streak when current exceeds it', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const storedData = {
        currentStreak: 3,
        longestStreak: 3,
        lastReviewDate: yesterdayStr,
        totalReviewDays: 3,
      };

      localStorageMock._getStore()['en-learn-review-streak'] = JSON.stringify(storedData);

      const { result } = renderHook(() => useReviewStreak());

      act(() => {
        result.current.recordReview();
      });

      expect(result.current.data.currentStreak).toBe(4);
      expect(result.current.data.longestStreak).toBe(4);
    });

    it('does not update longest streak if current is lower', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const storedData = {
        currentStreak: 3,
        longestStreak: 10,
        lastReviewDate: yesterdayStr,
        totalReviewDays: 3,
      };

      localStorageMock._getStore()['en-learn-review-streak'] = JSON.stringify(storedData);

      const { result } = renderHook(() => useReviewStreak());

      act(() => {
        result.current.recordReview();
      });

      expect(result.current.data.currentStreak).toBe(4);
      expect(result.current.data.longestStreak).toBe(10);
    });
  });

  describe('getTodayReviewedCount', () => {
    it('returns 0 when not reviewed today', () => {
      const storedData = {
        currentStreak: 0,
        longestStreak: 0,
        lastReviewDate: null,
        totalReviewDays: 0,
      };

      localStorageMock._getStore()['en-learn-review-streak'] = JSON.stringify(storedData);

      const { result } = renderHook(() => useReviewStreak());

      expect(result.current.getTodayReviewedCount()).toBe(0);
    });

    it('returns currentStreak when reviewed today', () => {
      const today = new Date().toISOString().split('T')[0];

      const storedData = {
        currentStreak: 5,
        longestStreak: 10,
        lastReviewDate: today,
        totalReviewDays: 15,
      };

      localStorageMock._getStore()['en-learn-review-streak'] = JSON.stringify(storedData);

      const { result } = renderHook(() => useReviewStreak());

      expect(result.current.getTodayReviewedCount()).toBe(5);
    });
  });

  describe('Data persistence', () => {
    it('persists data to localStorage on recordReview', () => {
      const { result } = renderHook(() => useReviewStreak());

      act(() => {
        result.current.recordReview();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'en-learn-review-streak',
        expect.any(String)
      );
    });

    it('handles corrupted localStorage data gracefully', () => {
      localStorageMock._getStore()['en-learn-review-streak'] = 'invalid-json';

      const { result } = renderHook(() => useReviewStreak());

      // Should return default values
      expect(result.current.data.currentStreak).toBe(0);
      expect(result.current.data.longestStreak).toBe(0);
    });
  });
});