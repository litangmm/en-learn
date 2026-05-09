import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService } from '../storage';
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

describe('StorageService Review Queue', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getReviewQueue', () => {
    it('returns empty array when no mistakes', () => {
      expect(StorageService.getReviewQueue()).toEqual([]);
    });

    it('returns all mistakes when none have nextReviewAt set', () => {
      const m1 = createMockMistake({ sentenceId: 's1' });
      const m2 = createMockMistake({ sentenceId: 's2' });
      StorageService.addMistake(m1);
      StorageService.addMistake(m2);

      const queue = StorageService.getReviewQueue();
      expect(queue).toHaveLength(2);
    });

    it('filters out mistakes with future nextReviewAt', () => {
      const now = Date.now();
      const m1 = createMockMistake({ sentenceId: 's1', nextReviewAt: now - 1000 });
      const m2 = createMockMistake({ sentenceId: 's2', nextReviewAt: now + 86400000 });
      const m3 = createMockMistake({ sentenceId: 's3' });
      StorageService.addMistake(m1);
      StorageService.addMistake(m2);
      StorageService.addMistake(m3);

      const queue = StorageService.getReviewQueue();
      expect(queue).toHaveLength(2);
      expect(queue.map((m) => m.sentenceId)).toContain('s1');
      expect(queue.map((m) => m.sentenceId)).toContain('s3');
      expect(queue.map((m) => m.sentenceId)).not.toContain('s2');
    });

    it('sorts by nextReviewAt ascending, with undefined first', () => {
      const now = Date.now();
      const m1 = createMockMistake({ sentenceId: 's1', nextReviewAt: now - 1000 });
      const m2 = createMockMistake({ sentenceId: 's2', nextReviewAt: now - 5000 });
      const m3 = createMockMistake({ sentenceId: 's3' });
      StorageService.addMistake(m1);
      StorageService.addMistake(m2);
      StorageService.addMistake(m3);

      const queue = StorageService.getReviewQueue();
      expect(queue[0].sentenceId).toBe('s3'); // undefined nextReviewAt first
      expect(queue[1].sentenceId).toBe('s2'); // -5000
      expect(queue[2].sentenceId).toBe('s1'); // -1000
    });
  });

  describe('getReviewQueueCount', () => {
    it('returns 0 when no due mistakes', () => {
      expect(StorageService.getReviewQueueCount()).toBe(0);
    });

    it('returns count of due mistakes', () => {
      const now = Date.now();
      StorageService.addMistake(createMockMistake({ sentenceId: 's1', nextReviewAt: now - 1000 }));
      StorageService.addMistake(createMockMistake({ sentenceId: 's2', nextReviewAt: now + 86400000 }));
      StorageService.addMistake(createMockMistake({ sentenceId: 's3' }));

      expect(StorageService.getReviewQueueCount()).toBe(2);
    });
  });

  describe('scheduleNextReview', () => {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    it('does nothing for non-existent sentenceId', () => {
      StorageService.addMistake(createMockMistake({ sentenceId: 's1', reviewedCount: 0 }));

      StorageService.scheduleNextReview('nonexistent', true);

      const mistakes = StorageService.getMistakes();
      expect(mistakes[0].reviewedCount).toBe(0);
      expect(mistakes[0].nextReviewAt).toBeUndefined();
    });

    it('sets 1 day interval for correct answer when reviewedCount is 0', () => {
      StorageService.addMistake(createMockMistake({ sentenceId: 's1', reviewedCount: 0 }));
      const before = Date.now();

      StorageService.scheduleNextReview('s1', true);

      const mistakes = StorageService.getMistakes();
      expect(mistakes[0].reviewedCount).toBe(1);
      expect(mistakes[0].nextReviewAt).toBeDefined();
      expect(mistakes[0].nextReviewAt! - before).toBeGreaterThanOrEqual(ONE_DAY_MS - 1000);
      expect(mistakes[0].lastReviewedAt).toBeDefined();
    });

    it('sets 3 day interval for correct answer when reviewedCount is 1', () => {
      StorageService.addMistake(createMockMistake({ sentenceId: 's1', reviewedCount: 1 }));
      const before = Date.now();

      StorageService.scheduleNextReview('s1', true);

      const mistakes = StorageService.getMistakes();
      expect(mistakes[0].reviewedCount).toBe(2);
      expect(mistakes[0].nextReviewAt! - before).toBeGreaterThanOrEqual(3 * ONE_DAY_MS - 1000);
    });

    it('sets 7 day interval for correct answer when reviewedCount is 2', () => {
      StorageService.addMistake(createMockMistake({ sentenceId: 's1', reviewedCount: 2 }));
      const before = Date.now();

      StorageService.scheduleNextReview('s1', true);

      const mistakes = StorageService.getMistakes();
      expect(mistakes[0].reviewedCount).toBe(3);
      expect(mistakes[0].nextReviewAt! - before).toBeGreaterThanOrEqual(7 * ONE_DAY_MS - 1000);
    });

    it('sets 14 day interval for correct answer when reviewedCount is 3+', () => {
      StorageService.addMistake(createMockMistake({ sentenceId: 's1', reviewedCount: 3 }));
      const before = Date.now();

      StorageService.scheduleNextReview('s1', true);

      const mistakes = StorageService.getMistakes();
      expect(mistakes[0].reviewedCount).toBe(4);
      expect(mistakes[0].nextReviewAt! - before).toBeGreaterThanOrEqual(14 * ONE_DAY_MS - 1000);
    });

    it('resets to 1 day interval for wrong answer and keeps reviewedCount', () => {
      StorageService.addMistake(createMockMistake({ sentenceId: 's1', reviewedCount: 2 }));
      const before = Date.now();

      StorageService.scheduleNextReview('s1', false);

      const mistakes = StorageService.getMistakes();
      expect(mistakes[0].reviewedCount).toBe(2); // unchanged
      expect(mistakes[0].nextReviewAt! - before).toBeGreaterThanOrEqual(ONE_DAY_MS - 1000);
      expect(mistakes[0].lastReviewedAt).toBeDefined();
    });

    it('updates lastReviewedAt on each call', () => {
      StorageService.addMistake(createMockMistake({ sentenceId: 's1', reviewedCount: 0 }));

      const before = Date.now();
      StorageService.scheduleNextReview('s1', true);
      const after = Date.now();

      const mistakes = StorageService.getMistakes();
      expect(mistakes[0].lastReviewedAt).toBeGreaterThanOrEqual(before);
      expect(mistakes[0].lastReviewedAt).toBeLessThanOrEqual(after);
    });
  });

  describe('isValidMistake with optional review fields', () => {
    it('accepts old data without nextReviewAt and lastReviewedAt', () => {
      const oldMistake = {
        sentenceId: 's1',
        wrongAnswers: ['w'],
        correctAnswers: ['c'],
        attempts: 1,
        timestamp: 1,
        dictionaryId: 'd',
        reviewedCount: 0,
      };
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([oldMistake]));

      const mistakes = StorageService.getMistakes();
      expect(mistakes).toHaveLength(1);
      expect(mistakes[0].nextReviewAt).toBeUndefined();
      expect(mistakes[0].lastReviewedAt).toBeUndefined();
    });

    it('accepts new data with valid nextReviewAt and lastReviewedAt', () => {
      const newMistake = {
        sentenceId: 's1',
        wrongAnswers: ['w'],
        correctAnswers: ['c'],
        attempts: 1,
        timestamp: 1,
        dictionaryId: 'd',
        reviewedCount: 0,
        nextReviewAt: Date.now(),
        lastReviewedAt: Date.now(),
      };
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([newMistake]));

      const mistakes = StorageService.getMistakes();
      expect(mistakes).toHaveLength(1);
      expect(mistakes[0].nextReviewAt).toBe(newMistake.nextReviewAt);
      expect(mistakes[0].lastReviewedAt).toBe(newMistake.lastReviewedAt);
    });

    it('rejects data with invalid nextReviewAt type', () => {
      const invalidMistake = {
        sentenceId: 's1',
        wrongAnswers: ['w'],
        correctAnswers: ['c'],
        attempts: 1,
        timestamp: 1,
        dictionaryId: 'd',
        reviewedCount: 0,
        nextReviewAt: 'tomorrow',
      };
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([invalidMistake]));

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mistakes = StorageService.getMistakes();
      expect(mistakes).toHaveLength(0);
      consoleWarnSpy.mockRestore();
    });

    it('rejects data with invalid lastReviewedAt type', () => {
      const invalidMistake = {
        sentenceId: 's1',
        wrongAnswers: ['w'],
        correctAnswers: ['c'],
        attempts: 1,
        timestamp: 1,
        dictionaryId: 'd',
        reviewedCount: 0,
        lastReviewedAt: 'yesterday',
      };
      localStorage.setItem(MISTAKES_KEY, JSON.stringify([invalidMistake]));

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mistakes = StorageService.getMistakes();
      expect(mistakes).toHaveLength(0);
      consoleWarnSpy.mockRestore();
    });
  });
});
