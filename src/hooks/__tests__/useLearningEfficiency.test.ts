import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { Mistake, ReviewResult } from '@/data/types';
import { useLearningEfficiency } from '../useLearningEfficiency';
import { storage } from '@/services/storage';

// Mock storage
vi.mock('@/services/storage', () => ({
  storage: {
    getMistakes: vi.fn(),
  },
}));

function createReviewResult(overrides: Partial<ReviewResult> = {}): ReviewResult {
  return {
    timestamp: Date.now(),
    isCorrect: true,
    interval: 1,
    nextReviewDate: Date.now() + 24 * 60 * 60 * 1000,
    ...overrides,
  };
}

function createMistake(overrides: Partial<Mistake> = {}): Mistake {
  return {
    sentenceId: 's1',
    wrongAnswers: [],
    correctAnswers: [],
    attempts: 1,
    timestamp: Date.now(),
    dictionaryId: 'cet4',
    reviewedCount: 0,
    ...overrides,
  };
}

describe('useLearningEfficiency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(storage.getMistakes).mockReturnValue([]);
  });

  describe('memoryRetentionRate', () => {
    it('returns 0 when no mistakes', () => {
      vi.mocked(storage.getMistakes).mockReturnValue([]);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.memoryRetentionRate).toBe(0);
    });

    it('returns 0 when no review history', () => {
      vi.mocked(storage.getMistakes).mockReturnValue([createMistake()]);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.memoryRetentionRate).toBe(0);
    });

    it('calculates 100% when all reviews correct', () => {
      const history = [
        createReviewResult({ isCorrect: true }),
        createReviewResult({ isCorrect: true }),
        createReviewResult({ isCorrect: true }),
      ];
      vi.mocked(storage.getMistakes).mockReturnValue([createMistake({ reviewHistory: history })]);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.memoryRetentionRate).toBe(100);
    });

    it('calculates 0% when no reviews correct', () => {
      const history = [
        createReviewResult({ isCorrect: false }),
        createReviewResult({ isCorrect: false }),
      ];
      vi.mocked(storage.getMistakes).mockReturnValue([createMistake({ reviewHistory: history })]);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.memoryRetentionRate).toBe(0);
    });

    it('calculates 50% correctly', () => {
      const history = [
        createReviewResult({ isCorrect: true }),
        createReviewResult({ isCorrect: false }),
      ];
      vi.mocked(storage.getMistakes).mockReturnValue([createMistake({ reviewHistory: history })]);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.memoryRetentionRate).toBe(50);
    });

    it('calculates 33% correctly (1/3)', () => {
      const history = [
        createReviewResult({ isCorrect: true }),
        createReviewResult({ isCorrect: false }),
        createReviewResult({ isCorrect: false }),
      ];
      vi.mocked(storage.getMistakes).mockReturnValue([createMistake({ reviewHistory: history })]);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.memoryRetentionRate).toBe(33);
    });

    it('aggregates across multiple mistakes', () => {
      const history1 = [
        createReviewResult({ isCorrect: true }),
        createReviewResult({ isCorrect: true }),
      ];
      const history2 = [
        createReviewResult({ isCorrect: true }),
        createReviewResult({ isCorrect: false }),
        createReviewResult({ isCorrect: false }),
      ];
      vi.mocked(storage.getMistakes).mockReturnValue([
        createMistake({ sentenceId: 's1', reviewHistory: history1 }),
        createMistake({ sentenceId: 's2', reviewHistory: history2 }),
      ]);
      const { result } = renderHook(() => useLearningEfficiency());
      // 3 correct out of 5 total = 60%
      expect(result.current.memoryRetentionRate).toBe(60);
      expect(result.current.totalReviewed).toBe(5);
      expect(result.current.totalCorrectOnReview).toBe(3);
    });
  });

  describe('forgettingCurveFit', () => {
    it('returns 0 when no review history', () => {
      vi.mocked(storage.getMistakes).mockReturnValue([createMistake()]);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.forgettingCurveFit).toBe(0);
    });

    it('returns 0 when intervals never grow', () => {
      // All intervals same = no growth
      const history = [
        createReviewResult({ interval: 1 }),
        createReviewResult({ interval: 1 }),
        createReviewResult({ interval: 1 }),
      ];
      vi.mocked(storage.getMistakes).mockReturnValue([createMistake({ reviewHistory: history })]);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.forgettingCurveFit).toBe(0);
    });

    it('returns 0 when intervals shrink (bad)', () => {
      const history = [
        createReviewResult({ interval: 3 }),
        createReviewResult({ interval: 1 }), // decreased
        createReviewResult({ interval: 1 }), // same
      ];
      vi.mocked(storage.getMistakes).mockReturnValue([createMistake({ reviewHistory: history })]);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.forgettingCurveFit).toBe(0);
    });

    it('returns 100 when all intervals grow', () => {
      const history = [
        createReviewResult({ interval: 1 }),
        createReviewResult({ interval: 3 }),
        createReviewResult({ interval: 7 }),
        createReviewResult({ interval: 14 }),
      ];
      vi.mocked(storage.getMistakes).mockReturnValue([createMistake({ reviewHistory: history })]);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.forgettingCurveFit).toBe(100);
    });

    it('calculates 67% when 2/3 intervals grow', () => {
      const history = [
        createReviewResult({ interval: 1 }),
        createReviewResult({ interval: 3 }), // grew
        createReviewResult({ interval: 3 }), // same
        createReviewResult({ interval: 7 }), // grew
      ];
      vi.mocked(storage.getMistakes).mockReturnValue([createMistake({ reviewHistory: history })]);
      const { result } = renderHook(() => useLearningEfficiency());
      // 3 intervals: 2 grew (1→3, 3→7), 1 same (3→3) → 2/3 = 67%
      expect(result.current.forgettingCurveFit).toBe(67);
    });

    it('handles single review (no interval comparison possible)', () => {
      const history = [createReviewResult({ interval: 1 })];
      vi.mocked(storage.getMistakes).mockReturnValue([createMistake({ reviewHistory: history })]);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.forgettingCurveFit).toBe(0);
    });

    it('aggregates across multiple mistakes', () => {
      // Mistake 1: 2 intervals, 2 grew = 100%
      const history1 = [
        createReviewResult({ interval: 1 }),
        createReviewResult({ interval: 3 }),
        createReviewResult({ interval: 7 }),
      ];
      // Mistake 2: 2 intervals, 0 grew = 0%
      const history2 = [
        createReviewResult({ interval: 3 }),
        createReviewResult({ interval: 1 }), // shrank
        createReviewResult({ interval: 1 }), // same
      ];
      vi.mocked(storage.getMistakes).mockReturnValue([
        createMistake({ sentenceId: 's1', reviewHistory: history1 }),
        createMistake({ sentenceId: 's2', reviewHistory: history2 }),
      ]);
      const { result } = renderHook(() => useLearningEfficiency());
      // 2/4 intervals grew = 50%
      expect(result.current.forgettingCurveFit).toBe(50);
    });
  });

  describe('weaknessProgress', () => {
    it('returns 100 when no mistakes (no weaknesses)', () => {
      vi.mocked(storage.getMistakes).mockReturnValue([]);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.weaknessProgress).toBe(100);
    });

    it('returns 100 when no review history (not enough data)', () => {
      vi.mocked(storage.getMistakes).mockReturnValue([createMistake()]);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.weaknessProgress).toBe(100);
    });

    it('returns 100 when single review (not enough data for comparison)', () => {
      const history = [createReviewResult({ isCorrect: false })];
      vi.mocked(storage.getMistakes).mockReturnValue([createMistake({ reviewHistory: history })]);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.weaknessProgress).toBe(100);
    });

    it('returns 100 when second half is better (improved)', () => {
      const history = [
        createReviewResult({ isCorrect: false }), // first half
        createReviewResult({ isCorrect: false }), // first half
        createReviewResult({ isCorrect: true }),  // second half
        createReviewResult({ isCorrect: true }),  // second half
      ];
      vi.mocked(storage.getMistakes).mockReturnValue([createMistake({ reviewHistory: history })]);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.weaknessProgress).toBe(100);
      expect(result.current.improvedMistakes).toBe(1);
    });

    it('returns 0 when second half is worse (not improved)', () => {
      const history = [
        createReviewResult({ isCorrect: true }),  // first half
        createReviewResult({ isCorrect: true }),  // first half
        createReviewResult({ isCorrect: false }), // second half
        createReviewResult({ isCorrect: false }), // second half
      ];
      vi.mocked(storage.getMistakes).mockReturnValue([createMistake({ reviewHistory: history })]);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.weaknessProgress).toBe(0);
      expect(result.current.improvedMistakes).toBe(0);
    });

    it('returns 100 when second half is equal (not regressing)', () => {
      const history = [
        createReviewResult({ isCorrect: true }),
        createReviewResult({ isCorrect: false }),
        createReviewResult({ isCorrect: true }),
        createReviewResult({ isCorrect: false }),
      ];
      vi.mocked(storage.getMistakes).mockReturnValue([createMistake({ reviewHistory: history })]);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.weaknessProgress).toBe(100);
    });

    it('returns 50 when half improved', () => {
      // First mistake: improved
      const history1 = [
        createReviewResult({ isCorrect: false }),
        createReviewResult({ isCorrect: false }),
        createReviewResult({ isCorrect: true }),
        createReviewResult({ isCorrect: true }),
      ];
      // Second mistake: not improved
      const history2 = [
        createReviewResult({ isCorrect: true }),
        createReviewResult({ isCorrect: true }),
        createReviewResult({ isCorrect: false }),
        createReviewResult({ isCorrect: false }),
      ];
      vi.mocked(storage.getMistakes).mockReturnValue([
        createMistake({ sentenceId: 's1', reviewHistory: history1 }),
        createMistake({ sentenceId: 's2', reviewHistory: history2 }),
      ]);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.weaknessProgress).toBe(50);
      expect(result.current.improvedMistakes).toBe(1);
    });

    it('handles odd-length history (midpoint calculation)', () => {
      const history = [
        createReviewResult({ isCorrect: false }),
        createReviewResult({ isCorrect: false }),
        createReviewResult({ isCorrect: false }), // midpoint
        createReviewResult({ isCorrect: true }),
      ];
      vi.mocked(storage.getMistakes).mockReturnValue([createMistake({ reviewHistory: history })]);
      const { result } = renderHook(() => useLearningEfficiency());
      // First half: [false, false] = 0%
      // Second half: [false, true] = 50%
      // Second >= First = improved
      expect(result.current.weaknessProgress).toBe(100);
    });
  });

  describe('totalMistakes', () => {
    it('returns 0 when no mistakes', () => {
      vi.mocked(storage.getMistakes).mockReturnValue([]);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.totalMistakes).toBe(0);
    });

    it('returns correct count', () => {
      vi.mocked(storage.getMistakes).mockReturnValue([
        createMistake({ sentenceId: 's1' }),
        createMistake({ sentenceId: 's2' }),
        createMistake({ sentenceId: 's3' }),
      ]);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.totalMistakes).toBe(3);
    });
  });

  describe('improvedMistakes', () => {
    it('returns 0 when no mistakes', () => {
      vi.mocked(storage.getMistakes).mockReturnValue([]);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.improvedMistakes).toBe(0);
    });

    it('scales with weaknessProgress', () => {
      const history = [
        createReviewResult({ isCorrect: false }),
        createReviewResult({ isCorrect: false }),
        createReviewResult({ isCorrect: true }),
        createReviewResult({ isCorrect: true }),
      ];
      vi.mocked(storage.getMistakes).mockReturnValue([
        createMistake({ sentenceId: 's1', reviewHistory: history }),
      ]);
      const { result } = renderHook(() => useLearningEfficiency());
      // weaknessProgress = 100%, so improvedMistakes = 1 * 100% = 1
      expect(result.current.improvedMistakes).toBe(1);
    });

    it('rounds correctly', () => {
      // Create 3 mistakes, only 1 improved (33% = 33 rounded)
      const historyImproved = [
        createReviewResult({ isCorrect: false }),
        createReviewResult({ isCorrect: false }),
        createReviewResult({ isCorrect: true }),
        createReviewResult({ isCorrect: true }),
      ];
      const historyNotImproved = [
        createReviewResult({ isCorrect: true }),
        createReviewResult({ isCorrect: true }),
        createReviewResult({ isCorrect: false }),
        createReviewResult({ isCorrect: false }),
      ];
      vi.mocked(storage.getMistakes).mockReturnValue([
        createMistake({ sentenceId: 's1', reviewHistory: historyImproved }),
        createMistake({ sentenceId: 's2', reviewHistory: historyNotImproved }),
        createMistake({ sentenceId: 's3', reviewHistory: historyNotImproved }),
      ]);
      const { result } = renderHook(() => useLearningEfficiency());
      // 1/3 = 33%, so improvedMistakes = 3 * 33% = 1 (rounded)
      expect(result.current.weaknessProgress).toBe(33);
      expect(result.current.improvedMistakes).toBe(1);
    });
  });

  describe('useMemo dependency', () => {
    it('returns correct totalMistakes', () => {
      vi.mocked(storage.getMistakes).mockReturnValue([createMistake({ sentenceId: 's1' })]);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.totalMistakes).toBe(1);
    });
  });

  describe('edge cases', () => {
    it('handles empty reviewHistory array', () => {
      vi.mocked(storage.getMistakes).mockReturnValue([
        createMistake({ reviewHistory: [] }),
      ]);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.memoryRetentionRate).toBe(0);
      expect(result.current.forgettingCurveFit).toBe(0);
      expect(result.current.weaknessProgress).toBe(100);
    });

    it('handles undefined reviewHistory', () => {
      const mistake = createMistake();
      // @ts-expect-error - testing edge case where reviewHistory is undefined
      delete mistake.reviewHistory;
      vi.mocked(storage.getMistakes).mockReturnValue([mistake]);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.memoryRetentionRate).toBe(0);
      expect(result.current.forgettingCurveFit).toBe(0);
    });

    it('handles large number of mistakes', () => {
      const manyMistakes = Array.from({ length: 100 }, (_, i) =>
        createMistake({
          sentenceId: `s${i}`,
          reviewHistory: [
            createReviewResult({ isCorrect: true }),
            createReviewResult({ isCorrect: true }),
            createReviewResult({ isCorrect: true }),
          ],
        })
      );
      vi.mocked(storage.getMistakes).mockReturnValue(manyMistakes);
      const { result } = renderHook(() => useLearningEfficiency());
      expect(result.current.totalMistakes).toBe(100);
      expect(result.current.totalReviewed).toBe(300);
      expect(result.current.totalCorrectOnReview).toBe(300);
      expect(result.current.memoryRetentionRate).toBe(100);
    });
  });
});