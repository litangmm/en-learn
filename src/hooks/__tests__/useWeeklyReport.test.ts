import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useWeeklyReport } from '../useWeeklyReport';
import { __mockLocalStorage__ } from '../../../vitest.setup';

// Mock requestAnimationFrame
Object.defineProperty(globalThis, 'requestAnimationFrame', {
  writable: true,
  configurable: true,
  value: vi.fn((cb: FrameRequestCallback) => setTimeout(cb, 0)),
});
Object.defineProperty(globalThis, 'cancelAnimationFrame', {
  writable: true,
  configurable: true,
  value: vi.fn((id: number) => clearTimeout(id)),
});

// Mock document.visibilityState
Object.defineProperty(document, 'visibilityState', {
  writable: true,
  configurable: true,
  value: 'visible',
});

describe('useWeeklyReport', () => {
  beforeEach(() => {
    __mockLocalStorage__.reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    __mockLocalStorage__.reset();
  });

  describe('Initial state', () => {
    it('returns null report and shouldShow false when no history exists', async () => {
      const { result } = renderHook(() => useWeeklyReport());

      await waitFor(() => {
        expect(result.current.report).toBeNull();
        expect(result.current.shouldShow).toBe(false);
      });
    });

    it('returns report with activity when history exists', async () => {
      // Create a history entry for today
      const today = new Date();
      const historyEntry = {
        id: 'session-1',
        timestamp: today.getTime(),
        duration: 60000,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 100,
        totalQuestions: 10,
        correctCount: 8,
        accuracy: 80,
      };
      const store = __mockLocalStorage__.mock;
      store.getItem = vi.fn(() => JSON.stringify([historyEntry]));

      const { result } = renderHook(() => useWeeklyReport());

      await waitFor(() => {
        expect(result.current.report).not.toBeNull();
        expect(result.current.report?.questionsAnswered).toBe(10);
        expect(result.current.shouldShow).toBe(true);
      });
    });
  });

  describe('First-time user', () => {
    it('does not show report for first-time user (no history)', async () => {
      const { result } = renderHook(() => useWeeklyReport());

      await waitFor(() => {
        expect(result.current.shouldShow).toBe(false);
      });
    });
  });

  describe('Cross-week boundary', () => {
    it('shows new week report when week has changed', async () => {
      // Create history entry for this week
      const today = new Date();
      const historyEntry = {
        id: 'session-1',
        timestamp: today.getTime(),
        duration: 60000,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 50,
        totalQuestions: 5,
        correctCount: 4,
        accuracy: 80,
      };
      const store = __mockLocalStorage__.mock;
      store.getItem = vi.fn((key: string) => {
        if (key === 'en-learn-history') {
          return JSON.stringify([historyEntry]);
        }
        if (key === 'en-learn-weekly-report-config') {
          const lastWeekStart = new Date(today);
          lastWeekStart.setDate(lastWeekStart.getDate() - 7);
          return JSON.stringify({
            enabled: true,
            lastShownWeekStart: lastWeekStart.toISOString().split('T')[0],
            dismissed: false,
            dismissedAt: null,
          });
        }
        return null;
      });

      const { result } = renderHook(() => useWeeklyReport());

      await waitFor(() => {
        expect(result.current.shouldShow).toBe(true);
      });
    });
  });

  describe('No activity this week', () => {
    it('does not show report when no activity this week', async () => {
      // Create history entry from last week only
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 10);
      const historyEntry = {
        id: 'session-1',
        timestamp: lastWeek.getTime(),
        duration: 60000,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 100,
        totalQuestions: 10,
        correctCount: 8,
        accuracy: 80,
      };
      const store = __mockLocalStorage__.mock;
      store.getItem = vi.fn(() => JSON.stringify([historyEntry]));

      const { result } = renderHook(() => useWeeklyReport());

      await waitFor(() => {
        expect(result.current.shouldShow).toBe(false);
      });
    });
  });

  describe('Config persistence', () => {
    it('saves config to localStorage when markShown is called', async () => {
      // Create history entry for today
      const today = new Date();
      const historyEntry = {
        id: 'session-1',
        timestamp: today.getTime(),
        duration: 60000,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 100,
        totalQuestions: 10,
        correctCount: 8,
        accuracy: 80,
      };
      const store = __mockLocalStorage__.mock;
      store.getItem = vi.fn(() => JSON.stringify([historyEntry]));

      const { result } = renderHook(() => useWeeklyReport());

      await waitFor(() => {
        expect(result.current.report).not.toBeNull();
      });

      const { markShown } = result.current;
      act(() => {
        markShown();
      });

      expect(store.setItem).toHaveBeenCalledWith(
        'en-learn-weekly-report-config',
        expect.any(String)
      );
    });

    it('dismisses report when dismiss is called', async () => {
      // Create history entry for today
      const today = new Date();
      const historyEntry = {
        id: 'session-1',
        timestamp: today.getTime(),
        duration: 60000,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 100,
        totalQuestions: 10,
        correctCount: 8,
        accuracy: 80,
      };
      const store = __mockLocalStorage__.mock;
      store.getItem = vi.fn(() => JSON.stringify([historyEntry]));

      const { result } = renderHook(() => useWeeklyReport());

      await waitFor(() => {
        expect(result.current.shouldShow).toBe(true);
      });

      const { dismiss } = result.current;
      act(() => {
        dismiss();
      });

      expect(result.current.shouldShow).toBe(false);
    });
  });

  describe('Report data structure', () => {
    it('returns correct weekly stats structure', async () => {
      // Create multiple history entries
      const today = new Date();
      const entries = [
        {
          id: 'session-1',
          timestamp: today.getTime(),
          duration: 60000,
          dictionaryId: 'cet4',
          dictionaryName: 'CET-4',
          score: 100,
          totalQuestions: 10,
          correctCount: 8,
          accuracy: 80,
        },
        {
          id: 'session-2',
          timestamp: today.getTime() - 86400000, // Yesterday
          duration: 45000,
          dictionaryId: 'cet4',
          dictionaryName: 'CET-4',
          score: 80,
          totalQuestions: 8,
          correctCount: 6,
          accuracy: 75,
        },
      ];
      const store = __mockLocalStorage__.mock;
      store.getItem = vi.fn(() => JSON.stringify(entries));

      const { result } = renderHook(() => useWeeklyReport());

      await waitFor(() => {
        expect(result.current.report).not.toBeNull();
      });

      const report = result.current.report!;
      expect(report).toHaveProperty('weekStart');
      expect(report).toHaveProperty('weekEnd');
      expect(report).toHaveProperty('xpEarned');
      expect(report).toHaveProperty('questionsAnswered');
      expect(report).toHaveProperty('correctAnswers');
      expect(report).toHaveProperty('accuracy');
      expect(report).toHaveProperty('learningDays');
      expect(report).toHaveProperty('sessionsCompleted');
      expect(report).toHaveProperty('comparison');

      // Check aggregated values
      expect(report.questionsAnswered).toBe(18);
      expect(report.correctAnswers).toBe(14);
      expect(report.sessionsCompleted).toBe(2);
    });
  });
});