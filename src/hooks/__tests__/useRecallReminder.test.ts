import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Use vi.hoisted to avoid hoisting issues with vi.mock
const { mockSetRecallReminderDismissed, mockGetRecallReminderDismissed, mockDueCount, mockStreakData } = vi.hoisted(() => ({
  mockSetRecallReminderDismissed: vi.fn(),
  mockGetRecallReminderDismissed: vi.fn((): number | null => null),
  mockDueCount: { current: 0 },
  mockStreakData: {
    current: 0,
    lastReviewDate: null as string | null,
    isActive: false,
  },
}));

// Mock the storage service
vi.mock('@/services/storage', () => ({
  storage: {
    getRecallReminderDismissed: mockGetRecallReminderDismissed,
    setRecallReminderDismissed: mockSetRecallReminderDismissed,
  },
}));

// Mock useReviewStreak - returns reactive state
vi.mock('../useReviewStreak', () => ({
  useReviewStreak: vi.fn(() => ({
    data: {
      currentStreak: mockStreakData.current,
      longestStreak: mockStreakData.current,
      lastReviewDate: mockStreakData.lastReviewDate,
      totalReviewDays: 0,
      isStreakActive: mockStreakData.isActive,
    },
    recordReview: vi.fn(),
    getTodayReviewedCount: vi.fn(() => 0),
  })),
}));

// Mock useSpacedRepetition - returns reactive state
vi.mock('../useSpacedRepetition', () => ({
  useSpacedRepetition: vi.fn(() => ({
    dueCount: mockDueCount.current,
    dueItems: [],
    refresh: vi.fn(),
    recordReviewResult: vi.fn(),
    getReviewHistory: vi.fn(() => []),
    isDue: vi.fn(() => false),
    getNextReviewDate: vi.fn(() => null),
    getMistakesByDictionary: vi.fn(() => []),
  })),
}));

import { useRecallReminder } from '../useRecallReminder';

describe('useRecallReminder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset shared mock state via mutable refs
    mockDueCount.current = 0;
    mockStreakData.current = 0;
    mockStreakData.lastReviewDate = null;
    mockStreakData.isActive = false;
    mockGetRecallReminderDismissed.mockReturnValue(null);
  });

  describe('status: idle', () => {
    it('returns idle when no due items and no streak', () => {
      const { result } = renderHook(() => useRecallReminder());
      expect(result.current.status).toBe('idle');
    });

    it('returns idle when dismissed within 4 hours', () => {
      mockGetRecallReminderDismissed.mockReturnValue(Date.now() - 60 * 60 * 1000); // 1 hour ago
      const { result } = renderHook(() => useRecallReminder());
      expect(result.current.status).toBe('idle');
      expect(result.current.canShow).toBe(false);
    });

    it('returns idle when last review was today (streak active)', () => {
      const today = new Date().toISOString().slice(0, 10);
      mockStreakData.current = 5;
      mockStreakData.lastReviewDate = today;
      mockStreakData.isActive = true;
      mockDueCount.current = 3;
      const { result } = renderHook(() => useRecallReminder());
      expect(result.current.status).toBe('idle');
    });
  });

  describe('status: due-now', () => {
    it('returns due-now when items are due for review', () => {
      mockDueCount.current = 5;
      const { result } = renderHook(() => useRecallReminder());
      expect(result.current.status).toBe('due-now');
    });

    it('returns due-now with correct dueCount', () => {
      mockDueCount.current = 3;
      const { result } = renderHook(() => useRecallReminder());
      expect(result.current.status).toBe('due-now');
      expect(result.current.dueCount).toBe(3);
    });
  });

  describe('status: streak-at-risk', () => {
    it('returns streak-at-risk when last review was yesterday and dueCount > 0', () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      mockStreakData.current = 5;
      mockStreakData.lastReviewDate = yesterday;
      mockStreakData.isActive = false;
      mockDueCount.current = 2;
      const { result } = renderHook(() => useRecallReminder());
      expect(result.current.status).toBe('streak-at-risk');
    });

    it('returns idle when dueCount is 0 even if streak at risk (no items to review)', () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      mockStreakData.current = 5;
      mockStreakData.lastReviewDate = yesterday;
      mockStreakData.isActive = false;
      mockDueCount.current = 0;
      const { result } = renderHook(() => useRecallReminder());
      // dueCount === 0 takes precedence, so idle is shown (no items to review anyway)
      expect(result.current.status).toBe('idle');
    });
  });

  describe('canShow', () => {
    it('is true when never dismissed', () => {
      mockGetRecallReminderDismissed.mockReturnValue(null);
      const { result } = renderHook(() => useRecallReminder());
      expect(result.current.canShow).toBe(true);
    });

    it('is false when dismissed within 4 hours', () => {
      mockGetRecallReminderDismissed.mockReturnValue(Date.now() - 60 * 60 * 1000); // 1 hour ago
      const { result } = renderHook(() => useRecallReminder());
      expect(result.current.canShow).toBe(false);
    });

    it('is true when dismissed more than 4 hours ago', () => {
      mockGetRecallReminderDismissed.mockReturnValue(Date.now() - 5 * 60 * 60 * 1000); // 5 hours ago
      const { result } = renderHook(() => useRecallReminder());
      expect(result.current.canShow).toBe(true);
    });
  });

  describe('dismiss', () => {
    it('sets canShow to false when dismissed', () => {
      const { result } = renderHook(() => useRecallReminder());
      expect(result.current.canShow).toBe(true);

      act(() => {
        result.current.dismiss();
      });

      expect(result.current.canShow).toBe(false);
      expect(result.current.lastDismissed).not.toBeNull();
    });

    it('persists dismissal via storage', () => {
      const { result } = renderHook(() => useRecallReminder());

      act(() => {
        result.current.dismiss();
      });

      expect(mockSetRecallReminderDismissed).toHaveBeenCalled();
    });

    it('handles storage read error gracefully', () => {
      mockGetRecallReminderDismissed.mockImplementation(() => {
        throw new Error('Storage unavailable');
      });
      // Should not throw, returns safe defaults
      const { result } = renderHook(() => useRecallReminder());
      expect(result.current.lastDismissed).toBeNull();
      expect(result.current.status).toBeDefined();
    });

    it('handles storage write error gracefully', () => {
      mockSetRecallReminderDismissed.mockImplementation(() => {
        throw new Error('Storage write failed');
      });
      const { result } = renderHook(() => useRecallReminder());
      // Should not throw
      expect(() => act(() => { result.current.dismiss(); })).not.toThrow();
    });
  });
});
