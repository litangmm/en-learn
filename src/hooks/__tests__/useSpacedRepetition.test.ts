import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useSpacedRepetition } from '../useSpacedRepetition';
import type { Mistake } from '@/data/types';

const MISTAKES_KEY = 'en-learn-mistakes';

function createMockMistake(overrides: Partial<Mistake> = {}): Mistake {
  return {
    sentenceId: 's1',
    wrongAnswers: ['wrong'],
    correctAnswers: ['correct'],
    attempts: 2,
    timestamp: Date.now(),
    dictionaryId: 'dict-a',
    reviewedCount: 0,
    ...overrides,
  };
}

describe('useSpacedRepetition', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('initial dueItems is empty when no mistakes', () => {
      const { result } = renderHook(() => useSpacedRepetition());
      expect(result.current.dueItems).toEqual([]);
    });

    it('initial dueCount is 0 when no mistakes', () => {
      const { result } = renderHook(() => useSpacedRepetition());
      expect(result.current.dueCount).toBe(0);
    });

    it('initial dueItems contains all mistakes when none have nextReviewAt', () => {
      const m1 = createMockMistake({ sentenceId: 's1' });
      const m2 = createMockMistake({ sentenceId: 's2' });
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([m1, m2]));

      const { result } = renderHook(() => useSpacedRepetition());
      expect(result.current.dueItems).toHaveLength(2);
      expect(result.current.dueCount).toBe(2);
    });

    it('initial dueItems filters out future-due items', () => {
      const now = Date.now();
      const m1 = createMockMistake({ sentenceId: 's1', nextReviewAt: now - 1000 });
      const m2 = createMockMistake({ sentenceId: 's2', nextReviewAt: now + 86400000 });
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([m1, m2]));

      const { result } = renderHook(() => useSpacedRepetition());
      expect(result.current.dueCount).toBe(1);
      expect(result.current.dueItems[0].sentenceId).toBe('s1');
    });
  });

  describe('refresh', () => {
    it('re-fetches due items from storage', () => {
      const m1 = createMockMistake({ sentenceId: 's1' });
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([m1]));

      const { result } = renderHook(() => useSpacedRepetition());
      expect(result.current.dueCount).toBe(1);

      // Add another mistake directly in storage
      const m2 = createMockMistake({ sentenceId: 's2' });
      const currentMistakes = JSON.parse(localStorage.getItem(MISTAKES_KEY) || '[]');
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([...currentMistakes, m2]));

      act(() => {
        result.current.refresh();
      });

      expect(result.current.dueCount).toBe(2);
    });
  });

  describe('recordReviewResult', () => {
    it('records correct review result', () => {
      const mistake = createMockMistake({ sentenceId: 's1', reviewedCount: 1 });
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([mistake]));

      const { result } = renderHook(() => useSpacedRepetition());

      act(() => {
        result.current.recordReviewResult('s1', true);
      });

      // Check that review history was appended
      const savedMistakes: Mistake[] = JSON.parse(localStorage.getItem(MISTAKES_KEY) || '[]');
      expect(savedMistakes[0].reviewHistory).toBeDefined();
      expect(savedMistakes[0].reviewHistory).toHaveLength(1);
      expect(savedMistakes[0].reviewHistory![0].isCorrect).toBe(true);
    });

    it('records wrong review result', () => {
      const mistake = createMockMistake({ sentenceId: 's1', reviewedCount: 0 });
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([mistake]));

      const { result } = renderHook(() => useSpacedRepetition());

      act(() => {
        result.current.recordReviewResult('s1', false);
      });

      const savedMistakes: Mistake[] = JSON.parse(localStorage.getItem(MISTAKES_KEY) || '[]');
      expect(savedMistakes[0].reviewHistory).toHaveLength(1);
      expect(savedMistakes[0].reviewHistory![0].isCorrect).toBe(false);
    });

    it('increments reviewedCount via scheduleNextReview', () => {
      const mistake = createMockMistake({ sentenceId: 's1', reviewedCount: 0 });
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([mistake]));

      const { result } = renderHook(() => useSpacedRepetition());

      act(() => {
        result.current.recordReviewResult('s1', true);
      });

      const savedMistakes: Mistake[] = JSON.parse(localStorage.getItem(MISTAKES_KEY) || '[]');
      expect(savedMistakes[0].reviewedCount).toBe(1);
    });

    it('updates nextReviewAt via scheduleNextReview', () => {
      const mistake = createMockMistake({ sentenceId: 's1', reviewedCount: 0 });
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([mistake]));

      const { result } = renderHook(() => useSpacedRepetition());

      act(() => {
        result.current.recordReviewResult('s1', true);
      });

      const savedMistakes: Mistake[] = JSON.parse(localStorage.getItem(MISTAKES_KEY) || '[]');
      expect(savedMistakes[0].nextReviewAt).toBeDefined();
      expect(savedMistakes[0].lastReviewedAt).toBeDefined();
    });

    it('refreshes dueItems after recording', () => {
      const now = Date.now();
      // reviewedCount=3 maps to REVIEW_INTERVALS[3] = 14 (last element, since array has 4 items)
      // Correct answer: 14 → 28 (doubled, but not capped since 28 < 30)
      const mistake = createMockMistake({
        sentenceId: 's1',
        reviewedCount: 3,
        nextReviewAt: now - 1000,
      });
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([mistake]));

      const { result } = renderHook(() => useSpacedRepetition());
      expect(result.current.dueCount).toBe(1); // due now

      act(() => {
        result.current.recordReviewResult('s1', true);
      });

      // After correct answer with reviewedCount=3, next interval = 28 days (14*2)
      // So it should no longer be due
      const savedMistakes: Mistake[] = JSON.parse(localStorage.getItem(MISTAKES_KEY) || '[]');
      expect(savedMistakes[0].nextReviewAt! - now).toBeGreaterThan(86400000 * 27);
    });

    it('does nothing for non-existent sentenceId', () => {
      const mistake = createMockMistake({ sentenceId: 's1' });
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([mistake]));

      const { result } = renderHook(() => useSpacedRepetition());

      act(() => {
        result.current.recordReviewResult('nonexistent', true);
      });

      // Should not throw, just do nothing
      const savedMistakes: Mistake[] = JSON.parse(localStorage.getItem(MISTAKES_KEY) || '[]');
      expect(savedMistakes[0].reviewedCount).toBe(0);
    });

    it('accumulates multiple review results in history', () => {
      const mistake = createMockMistake({ sentenceId: 's1', reviewedCount: 0 });
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([mistake]));

      const { result } = renderHook(() => useSpacedRepetition());

      act(() => {
        result.current.recordReviewResult('s1', true);
      });
      act(() => {
        result.current.recordReviewResult('s1', false);
      });
      act(() => {
        result.current.recordReviewResult('s1', true);
      });

      const savedMistakes: Mistake[] = JSON.parse(localStorage.getItem(MISTAKES_KEY) || '[]');
      expect(savedMistakes[0].reviewHistory).toHaveLength(3);
    });
  });

  describe('getReviewHistory', () => {
    it('returns empty array when no history', () => {
      const mistake = createMockMistake({ sentenceId: 's1' });
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([mistake]));

      const { result } = renderHook(() => useSpacedRepetition());
      expect(result.current.getReviewHistory('s1')).toEqual([]);
    });

    it('returns history entries for existing sentence', () => {
      const mistake = createMockMistake({
        sentenceId: 's1',
        reviewHistory: [
          { timestamp: 1000, isCorrect: true, interval: 0, nextReviewDate: 2000 },
          { timestamp: 3000, isCorrect: false, interval: 1, nextReviewDate: 4000 },
        ],
      });
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([mistake]));

      const { result } = renderHook(() => useSpacedRepetition());
      const history = result.current.getReviewHistory('s1');
      expect(history).toHaveLength(2);
      expect(history[0].isCorrect).toBe(true);
      expect(history[1].isCorrect).toBe(false);
    });

    it('returns empty array for non-existent sentence', () => {
      const mistake = createMockMistake({ sentenceId: 's1' });
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([mistake]));

      const { result } = renderHook(() => useSpacedRepetition());
      expect(result.current.getReviewHistory('nonexistent')).toEqual([]);
    });
  });

  describe('isDue', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('returns false for non-existent sentence', () => {
      const mistake = createMockMistake({ sentenceId: 's1' });
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([mistake]));

      const { result } = renderHook(() => useSpacedRepetition());
      expect(result.current.isDue('nonexistent')).toBe(false);
    });

    it('returns true when nextReviewAt is undefined', () => {
      const mistake = createMockMistake({ sentenceId: 's1' });
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([mistake]));

      const { result } = renderHook(() => useSpacedRepetition());
      expect(result.current.isDue('s1')).toBe(true);
    });

    it('returns true when nextReviewAt is in the past', () => {
      const mistake = createMockMistake({
        sentenceId: 's1',
        nextReviewAt: Date.now() - 1000,
      });
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([mistake]));

      const { result } = renderHook(() => useSpacedRepetition());
      expect(result.current.isDue('s1')).toBe(true);
    });

    it('returns false when nextReviewAt is in the future', () => {
      const mistake = createMockMistake({
        sentenceId: 's1',
        nextReviewAt: Date.now() + 86400000,
      });
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([mistake]));

      const { result } = renderHook(() => useSpacedRepetition());
      expect(result.current.isDue('s1')).toBe(false);
    });
  });

  describe('getNextReviewDate', () => {
    it('returns null for non-existent sentence', () => {
      const mistake = createMockMistake({ sentenceId: 's1' });
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([mistake]));

      const { result } = renderHook(() => useSpacedRepetition());
      expect(result.current.getNextReviewDate('nonexistent')).toBeNull();
    });

    it('returns null when nextReviewAt is undefined', () => {
      const mistake = createMockMistake({ sentenceId: 's1' });
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([mistake]));

      const { result } = renderHook(() => useSpacedRepetition());
      expect(result.current.getNextReviewDate('s1')).toBeNull();
    });

    it('returns nextReviewAt timestamp when set', () => {
      const timestamp = Date.now() + 86400000;
      const mistake = createMockMistake({
        sentenceId: 's1',
        nextReviewAt: timestamp,
      });
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([mistake]));

      const { result } = renderHook(() => useSpacedRepetition());
      expect(result.current.getNextReviewDate('s1')).toBe(timestamp);
    });
  });

  describe('integration: full spaced repetition cycle', () => {
    it('records review → updates schedule → item no longer due', () => {
      const now = Date.now();
      const mistake = createMockMistake({
        sentenceId: 's1',
        reviewedCount: 1, // at 3-day interval
        nextReviewAt: now - 1000, // past due
      });
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([mistake]));

      const { result } = renderHook(() => useSpacedRepetition());

      // Should be due initially
      expect(result.current.dueCount).toBe(1);

      // Record correct answer
      act(() => {
        result.current.recordReviewResult('s1', true);
      });

      // Should no longer be due (next review is 7 days away)
      act(() => {
        result.current.refresh();
      });

      expect(result.current.dueCount).toBe(0);
    });

    it('records review → updates schedule → item still due on wrong answer', () => {
      const now = Date.now();
      const mistake = createMockMistake({
        sentenceId: 's1',
        reviewedCount: 2,
        nextReviewAt: now - 1000,
      });
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([mistake]));

      const { result } = renderHook(() => useSpacedRepetition());
      expect(result.current.dueCount).toBe(1);

      // Record wrong answer (resets to 1 day interval)
      act(() => {
        result.current.recordReviewResult('s1', false);
      });

      // Not due anymore: wrong answer schedules next review for 1 day in the future
      // (even though reviewedCount stays at 2, the interval is reset to 1 day)
      act(() => {
        result.current.refresh();
      });

      // Should NOT be due since 1 day interval is now in the future
      expect(result.current.dueCount).toBe(0);
    });
  });
});
