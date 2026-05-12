import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateNextReviewInterval,
  calculateNextReviewDate,
  createReviewResult,
  getDueReviewItems,
  getCurrentInterval,
  isDue,
  MAX_INTERVAL_DAYS,
} from '../spaced-repetition';
import { REVIEW_INTERVALS } from '@/data/types';

describe('spaced-repetition algorithm', () => {
  describe('calculateNextReviewInterval', () => {
    it('first review (interval=0), correct → returns first interval (1 day)', () => {
      expect(calculateNextReviewInterval(0, true)).toBe(1);
    });

    it('first review (interval=0), wrong → returns 1 day', () => {
      expect(calculateNextReviewInterval(0, false)).toBe(1);
    });

    it('correct: interval doubles (1→2→4→8→16→30), capped at 30', () => {
      expect(calculateNextReviewInterval(1, true)).toBe(2);
      expect(calculateNextReviewInterval(2, true)).toBe(4);
      expect(calculateNextReviewInterval(4, true)).toBe(8);
      expect(calculateNextReviewInterval(8, true)).toBe(16);
      expect(calculateNextReviewInterval(16, true)).toBe(30); // 16*2=32, capped at 30
      expect(calculateNextReviewInterval(30, true)).toBe(30); // already at cap
    });

    it('correct: caps at 30', () => {
      expect(calculateNextReviewInterval(14, true)).toBe(28); // 14*2=28
      expect(calculateNextReviewInterval(16, true)).toBe(30); // 16*2=32, capped
      expect(calculateNextReviewInterval(30, true)).toBe(30); // already at cap
    });

    it('wrong: always resets to 1 day regardless of current interval', () => {
      expect(calculateNextReviewInterval(1, false)).toBe(1);
      expect(calculateNextReviewInterval(3, false)).toBe(1);
      expect(calculateNextReviewInterval(7, false)).toBe(1);
      expect(calculateNextReviewInterval(14, false)).toBe(1);
      expect(calculateNextReviewInterval(30, false)).toBe(1);
    });

    it('boundary: 14→28 (doubled, not capped)', () => {
      expect(calculateNextReviewInterval(14, true)).toBe(28); // 14*2=28 < 30
    });

    it('boundary: 16→30 (doubled and capped)', () => {
      expect(calculateNextReviewInterval(16, true)).toBe(30); // 16*2=32 > 30, capped
    });

    it('max interval never exceeds 30', () => {
      for (let interval = 1; interval <= 60; interval++) {
        const next = calculateNextReviewInterval(interval, true);
        expect(next).toBeLessThanOrEqual(MAX_INTERVAL_DAYS);
      }
    });
  });

  describe('calculateNextReviewDate', () => {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    it('returns now + intervalDays', () => {
      const before = Date.now();
      const result = calculateNextReviewDate(1);
      const after = Date.now();
      expect(result).toBeGreaterThanOrEqual(before + ONE_DAY_MS);
      expect(result).toBeLessThanOrEqual(after + ONE_DAY_MS);
    });

    it('works for 30-day interval', () => {
      const before = Date.now();
      const result = calculateNextReviewDate(30);
      const after = Date.now();
      expect(result).toBeGreaterThanOrEqual(before + 30 * ONE_DAY_MS);
      expect(result).toBeLessThanOrEqual(after + 30 * ONE_DAY_MS);
    });
  });

  describe('createReviewResult', () => {
    it('creates a ReviewResult with correct fields', () => {
      const before = Date.now();
      const result = createReviewResult(true, 3);
      const after = Date.now();

      expect(result.timestamp).toBeGreaterThanOrEqual(before);
      expect(result.timestamp).toBeLessThanOrEqual(after);
      expect(result.isCorrect).toBe(true);
      expect(result.interval).toBe(3);
      expect(result.nextReviewDate).toBeGreaterThan(result.timestamp);
    });

    it('computes nextReviewDate using the algorithm', () => {
      // interval=1, correct → next=2 (doubling)
      const result = createReviewResult(true, 1);
      const expectedNext = calculateNextReviewDate(2);
      expect(result.nextReviewDate).toBe(expectedNext);
    });

    it('handles wrong answers correctly', () => {
      const result = createReviewResult(false, 7);
      expect(result.isCorrect).toBe(false);
      expect(result.interval).toBe(7);
      // wrong → reset to 1 → nextReviewDate = now + 1 day
      const expectedNext = calculateNextReviewDate(1);
      expect(result.nextReviewDate).toBe(expectedNext);
    });
  });

  describe('getDueReviewItems', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns empty array when given empty array', () => {
      expect(getDueReviewItems([])).toEqual([]);
    });

    it('returns all items when none have nextReviewAt set (always due)', () => {
      const items: Array<{ sentenceId: string; nextReviewAt?: number }> = [
        { sentenceId: 's1' },
        { sentenceId: 's2' },
        { sentenceId: 's3' },
      ];
      const result = getDueReviewItems(items);
      expect(result).toHaveLength(3);
    });

    it('returns items with nextReviewAt in the past', () => {
      const past = Date.now() - 1000;
      const future = Date.now() + 86400000;
      const items = [
        { sentenceId: 's1', nextReviewAt: past },
        { sentenceId: 's2', nextReviewAt: future },
        { sentenceId: 's3' },
      ];
      const result = getDueReviewItems(items);
      expect(result).toHaveLength(2);
      expect(result.map((r: { sentenceId: string }) => r.sentenceId)).toContain('s1');
      expect(result.map((r: { sentenceId: string }) => r.sentenceId)).toContain('s3');
      expect(result.map((r: { sentenceId: string }) => r.sentenceId)).not.toContain('s2');
    });

    it('returns items with nextReviewAt exactly now', () => {
      const now = Date.now();
      const items = [
        { sentenceId: 's1', nextReviewAt: now },
      ];
      const result = getDueReviewItems(items);
      expect(result).toHaveLength(1);
    });

    it('works with generic type parameter', () => {
      const items = [
        { id: 'a', nextReviewAt: undefined },
        { id: 'b', nextReviewAt: Date.now() - 1000 },
        { id: 'c', nextReviewAt: Date.now() + 1000 },
      ];
      const result = getDueReviewItems(items);
      expect(result).toHaveLength(2);
    });
  });

  describe('getCurrentInterval', () => {
    it('maps reviewedCount to REVIEW_INTERVALS', () => {
      expect(getCurrentInterval(0)).toBe(REVIEW_INTERVALS[0]);
      expect(getCurrentInterval(1)).toBe(REVIEW_INTERVALS[1]);
      expect(getCurrentInterval(2)).toBe(REVIEW_INTERVALS[2]);
      expect(getCurrentInterval(3)).toBe(REVIEW_INTERVALS[3]);
    });

    it('caps at last interval when reviewedCount exceeds array length', () => {
      const last = REVIEW_INTERVALS[REVIEW_INTERVALS.length - 1];
      expect(getCurrentInterval(100)).toBe(last);
      expect(getCurrentInterval(999)).toBe(last);
    });
  });

  describe('isDue', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns true when nextReviewAt is undefined (never reviewed)', () => {
      expect(isDue(undefined)).toBe(true);
    });

    it('returns true when nextReviewAt is in the past', () => {
      expect(isDue(Date.now() - 1000)).toBe(true);
    });

    it('returns false when nextReviewAt is in the future', () => {
      expect(isDue(Date.now() + 86400000)).toBe(false);
    });

    it('returns true when nextReviewAt equals now', () => {
      const now = Date.now();
      expect(isDue(now)).toBe(true);
    });
  });

  describe('MAX_INTERVAL_DAYS', () => {
    it('is 30 days', () => {
      expect(MAX_INTERVAL_DAYS).toBe(30);
    });
  });

  describe('algorithm consistency: full review cycle simulation', () => {
    it('correct path: 0 → 1 → 2 → 4 → 8 → 16 → 30 (then caps)', () => {
      let interval = 0;
      const path = [0];
      for (let i = 0; i < 10; i++) {
        interval = calculateNextReviewInterval(interval, true);
        path.push(interval);
        // Stop after reaching the cap
        if (interval >= MAX_INTERVAL_DAYS) break;
      }
      // Path: 0, 1, 2, 4, 8, 16, 30 (then breaks because 30 >= 30)
      expect(path).toEqual([0, 1, 2, 4, 8, 16, 30]);
    });

    it('wrong answer resets to 1, then correct path resumes', () => {
      let interval = calculateNextReviewInterval(0, true); // 0 → 1
      interval = calculateNextReviewInterval(interval, true);  // 1 → 2
      interval = calculateNextReviewInterval(interval, false); // 2 → 1 (reset)
      interval = calculateNextReviewInterval(interval, true);  // 1 → 2 (restart)
      expect(interval).toBe(2);
    });

    it('multiple wrong answers all reset to 1', () => {
      let interval = calculateNextReviewInterval(0, true);  // 0 → 1
      interval = calculateNextReviewInterval(interval, true); // 1 → 2
      for (let i = 0; i < 5; i++) {
        interval = calculateNextReviewInterval(interval, false);
        expect(interval).toBe(1);
      }
    });
  });
});
