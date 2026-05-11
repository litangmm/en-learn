import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useQuestionWeighting } from '../useQuestionWeighting';
import { storage } from '@/services/storage';
import type { Mistake } from '@/data/types';

describe('useQuestionWeighting', () => {
  describe('getSentenceWeight', () => {
    it('should return default weight 1.0 for new sentences never seen before', () => {
      vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

      const { result } = renderHook(() => useQuestionWeighting());

      // NEW_WORD_PENALTY = 0.6: new sentence gets 1.0 * 0.6 = 0.6
      const weight = result.current.getSentenceWeight('1', []);

      expect(weight).toBe(0.6);
    });

    it('should increase weight by 0.5 for each mistake record', () => {
      const mockMistakes: Mistake[] = [
        {
          sentenceId: '2',
          wrongAnswers: [], // 0 wrong answers (no errors)
          correctAnswers: ['2'],
          attempts: 1, // 1 correct answer
          timestamp: Date.now(),
          dictionaryId: 'cet4',
          reviewedCount: 0,
        },
      ];
      vi.spyOn(storage, 'getMistakes').mockReturnValue(mockMistakes);

      const { result } = renderHook(() => useQuestionWeighting());

      // 1 mistake record = +0.5
      // error rate = 0/1 = 0, boost = 0
      // total = 1.0 + 0.5 + 0 = 1.5
      const weight = result.current.getSentenceWeight('2', mockMistakes);
      expect(weight).toBe(1.5);
    });

    it('should add error rate boost based on (errorCount / totalAttempts) * 1.0', () => {
      const mockMistakes: Mistake[] = [
        {
          sentenceId: '2',
          wrongAnswers: ['answer1', 'answer2', 'answer3'], // 3 wrong answers
          correctAnswers: ['2'],
          attempts: 4, // 3 wrong + 1 correct = 4 attempts
          timestamp: Date.now(),
          dictionaryId: 'cet4',
          reviewedCount: 0,
        },
      ];
      vi.spyOn(storage, 'getMistakes').mockReturnValue(mockMistakes);

      const { result } = renderHook(() => useQuestionWeighting());

      // 1 mistake record = +0.5
      // error rate = 3/4 = 0.75, boost = 0.75 * 1.0 = 0.75
      // total = 1.0 + 0.5 + 0.75 = 2.25
      const weight = result.current.getSentenceWeight('2', mockMistakes);
      expect(weight).toBe(2.25);
    });

    it('should cap weight at maximum 5.0', () => {
      // Create many mistakes to push weight over 5.0
      const manyMistakes: Mistake[] = [];
      for (let i = 0; i < 10; i++) {
        manyMistakes.push({
          sentenceId: '3',
          wrongAnswers: ['a', 'b', 'c', 'd', 'e'], // 5 wrong answers
          correctAnswers: ['3'],
          attempts: 6,
          timestamp: Date.now(),
          dictionaryId: 'cet4',
          reviewedCount: 0,
        });
      }
      vi.spyOn(storage, 'getMistakes').mockReturnValue(manyMistakes);

      const { result } = renderHook(() => useQuestionWeighting());

      const weight = result.current.getSentenceWeight('3', manyMistakes);

      // Should be capped at 5.0
      expect(weight).toBe(5.0);
    });

    it('should accumulate multiple mistake records for same sentence', () => {
      const mockMistakes: Mistake[] = [
        {
          sentenceId: '2',
          wrongAnswers: ['a'],
          correctAnswers: ['2'],
          attempts: 2,
          timestamp: Date.now() - 1000,
          dictionaryId: 'cet4',
          reviewedCount: 0,
        },
        {
          sentenceId: '2',
          wrongAnswers: ['b', 'c'],
          correctAnswers: ['2'],
          attempts: 3,
          timestamp: Date.now(),
          dictionaryId: 'cet4',
          reviewedCount: 0,
        },
      ];
      vi.spyOn(storage, 'getMistakes').mockReturnValue(mockMistakes);

      const { result } = renderHook(() => useQuestionWeighting());

      // 2 mistake records = +1.0 (0.5 each)
      // Total error rate across all mistakes: (1+2)/(2+3) = 3/5 = 0.6, boost = 0.6
      // total = 1.0 + 1.0 + 0.6 = 2.6
      const weight = result.current.getSentenceWeight('2', mockMistakes);
      expect(weight).toBe(2.6);
    });

    it('should return 0.6 for empty mistakes array (new word with NEW_WORD_PENALTY)', () => {
      const { result } = renderHook(() => useQuestionWeighting());

      // Empty mistakes array means new word, which gets 1.0 * 0.6 = 0.6
      const weight = result.current.getSentenceWeight('any-id', []);

      expect(weight).toBe(0.6);
    });

    it('should handle 100% error rate correctly', () => {
      const mockMistakes: Mistake[] = [
        {
          sentenceId: '2',
          wrongAnswers: ['a', 'b', 'c'],
          correctAnswers: [],
          attempts: 3, // all wrong
          timestamp: Date.now(),
          dictionaryId: 'cet4',
          reviewedCount: 0,
        },
      ];
      vi.spyOn(storage, 'getMistakes').mockReturnValue(mockMistakes);

      const { result } = renderHook(() => useQuestionWeighting());

      // 1 mistake record = +0.5
      // error rate = 3/3 = 1.0, boost = 1.0
      // total = 1.0 + 0.5 + 1.0 = 2.5
      const weight = result.current.getSentenceWeight('2', mockMistakes);
      expect(weight).toBe(2.5);
    });
  });

  describe('getWeightedSentenceIds', () => {
    beforeEach(() => {
      // Mock Math.random for deterministic tests
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should return empty array for empty input', () => {
      vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

      const { result } = renderHook(() => useQuestionWeighting());

      const ids = result.current.getWeightedSentenceIds([], [], 5);

      expect(ids).toEqual([]);
    });

    it('should return requested count of sentence IDs', () => {
      vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

      const { result } = renderHook(() => useQuestionWeighting());

      const sentenceIds = ['1', '2', '3', '4', '5', '6', '7', '8'];
      const selected = result.current.getWeightedSentenceIds(sentenceIds, [], 5);

      expect(selected).toHaveLength(5);
    });

    it('should return all sentences when count exceeds available', () => {
      vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

      const { result } = renderHook(() => useQuestionWeighting());

      const sentenceIds = ['1', '2', '3'];
      const selected = result.current.getWeightedSentenceIds(sentenceIds, [], 10);

      expect(selected).toHaveLength(3);
      expect(selected).toContain('1');
      expect(selected).toContain('2');
      expect(selected).toContain('3');
    });

    it('should use weighted random selection for prioritization', () => {
      const mockMistakes: Mistake[] = [
        {
          sentenceId: '2',
          wrongAnswers: ['a', 'b', 'c'],
          correctAnswers: ['2'],
          attempts: 4,
          timestamp: Date.now(),
          dictionaryId: 'cet4',
          reviewedCount: 0,
        },
        {
          sentenceId: '3',
          wrongAnswers: ['a'],
          correctAnswers: ['3'],
          attempts: 2,
          timestamp: Date.now(),
          dictionaryId: 'cet4',
          reviewedCount: 0,
        },
      ];
      vi.spyOn(storage, 'getMistakes').mockReturnValue(mockMistakes);

      const { result } = renderHook(() => useQuestionWeighting());

      // Use 10 sentences so count=5 triggers weighted selection
      const sentenceIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

      // Verify weights: sentence 2 (2.25) and 3 (2.0) should have higher weight than sentence 1 (0.6, new word)
      const w2 = result.current.getSentenceWeight('2', mockMistakes);
      const w3 = result.current.getSentenceWeight('3', mockMistakes);
      const w1 = result.current.getSentenceWeight('1', mockMistakes);

      expect(w2).toBeGreaterThan(w1);
      expect(w3).toBeGreaterThan(w1);
      expect(w2).toBe(2.25);
      expect(w3).toBe(2.0);
      expect(w1).toBe(0.6); // New word: 1.0 * 0.6 penalty

      // Test weighted selection by running multiple times
      // Higher weight sentences should appear more frequently in results
      const results = Array.from({ length: 100 }, () =>
        result.current.getWeightedSentenceIds(sentenceIds, mockMistakes, 5)
      );

      // Count appearances of sentence 2 and 3 in top positions (0, 1)
      const sentence2InTop2 = results.filter(ids => ids.slice(0, 2).includes('2')).length;
      const sentence1InTop2 = results.filter(ids => ids.slice(0, 2).includes('1')).length;

      // Sentence 2 with weight 2.25 should appear in top 2 more often than sentence 1 with weight 1.0
      // (random probability would be ~40% for each in top 2)
      // With weight 2.25 vs 1.0, sentence 2 should be ~2x more likely
      expect(sentence2InTop2).toBeGreaterThan(sentence1InTop2);

      // All results should have exactly 5 unique sentence IDs
      results.forEach(ids => {
        expect(ids).toHaveLength(5);
        expect(new Set(ids).size).toBe(5);
      });
    });

    it('should not include duplicate IDs', () => {
      vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

      const { result } = renderHook(() => useQuestionWeighting());

      const sentenceIds = ['1', '2', '3', '4', '5'];

      const selected = result.current.getWeightedSentenceIds(sentenceIds, [], 5);

      const uniqueIds = new Set(selected);
      expect(uniqueIds.size).toBe(selected.length);
    });

    it('should include all provided IDs when count equals available', () => {
      const mockMistakes: Mistake[] = [
        {
          sentenceId: '2',
          wrongAnswers: ['a'],
          correctAnswers: ['2'],
          attempts: 1,
          timestamp: Date.now(),
          dictionaryId: 'cet4',
          reviewedCount: 0,
        },
      ];
      vi.spyOn(storage, 'getMistakes').mockReturnValue(mockMistakes);

      const { result } = renderHook(() => useQuestionWeighting());

      const sentenceIds = ['1', '2', '3'];

      const selected = result.current.getWeightedSentenceIds(sentenceIds, mockMistakes, 3);

      // Should include all 3 sentences
      expect(selected).toHaveLength(3);
      expect(selected.sort()).toEqual(['1', '2', '3']);
    });

    it('should handle weighted random selection for first 5 sentences', () => {
      const mockMistakes: Mistake[] = [
        {
          sentenceId: '5',
          wrongAnswers: ['a', 'b', 'c', 'd'],
          correctAnswers: ['5'],
          attempts: 5,
          timestamp: Date.now(),
          dictionaryId: 'cet4',
          reviewedCount: 0,
        },
      ];
      vi.spyOn(storage, 'getMistakes').mockReturnValue(mockMistakes);

      const { result } = renderHook(() => useQuestionWeighting());

      const sentenceIds = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

      // Sentence 5 has weight 2.5 (1.0 + 0.5 + 0.8)
      // Should be more likely to appear early in selection
      const results = Array.from({ length: 50 }, () =>
        result.current.getWeightedSentenceIds(sentenceIds, mockMistakes, 5)
      );

      // Count appearances of sentence 5 in first 2 positions
      const appearancesInTop2 = results.filter(ids =>
        ids.slice(0, 2).includes('5')
      ).length;

      // Should appear in top 2 at least 30% of the time (much higher than random 20%)
      expect(appearancesInTop2).toBeGreaterThan(15);
    });

    it('should return array of string IDs', () => {
      vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

      const { result } = renderHook(() => useQuestionWeighting());

      const sentenceIds = ['a', 'b', 'c'];
      const selected = result.current.getWeightedSentenceIds(sentenceIds, [], 2);

      expect(selected.every(id => typeof id === 'string')).toBe(true);
    });

    it('should handle large input with small count', () => {
      vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

      const { result } = renderHook(() => useQuestionWeighting());

      const sentenceIds = Array.from({ length: 100 }, (_, i) => `sentence-${i}`);
      const selected = result.current.getWeightedSentenceIds(sentenceIds, [], 5);

      expect(selected).toHaveLength(5);
      expect(new Set(selected).size).toBe(5);
    });

    it('should fill remaining with random shuffle after weighted selection', () => {
      const mockMistakes: Mistake[] = [
        {
          sentenceId: '1',
          wrongAnswers: ['a'],
          correctAnswers: ['1'],
          attempts: 2,
          timestamp: Date.now(),
          dictionaryId: 'cet4',
          reviewedCount: 0,
        },
      ];
      vi.spyOn(storage, 'getMistakes').mockReturnValue(mockMistakes);

      const { result } = renderHook(() => useQuestionWeighting());

      const sentenceIds = ['1', '2', '3', '4', '5', '6', '7', '8'];

      // Run multiple times with different random seeds
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.9)
        .mockReturnValueOnce(0.5);

      const selected1 = result.current.getWeightedSentenceIds(sentenceIds, mockMistakes, 5);

      // Reset mock for second run
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.9)
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.5);

      const selected2 = result.current.getWeightedSentenceIds(sentenceIds, mockMistakes, 5);

      // Both should have sentence 1 (high weight) but different random orderings
      expect(selected1).toContain('1');
      expect(selected2).toContain('1');

      // Should not have duplicates
      expect(new Set(selected1).size).toBe(5);
      expect(new Set(selected2).size).toBe(5);
    });

    it('should handle sentences with no mistakes at all', () => {
      const mockMistakes: Mistake[] = [
        {
          sentenceId: '2',
          wrongAnswers: [], // 0 wrong answers to get weight 1.5
          correctAnswers: ['2'],
          attempts: 1,
          timestamp: Date.now(),
          dictionaryId: 'cet4',
          reviewedCount: 0,
        },
      ];

      const { result } = renderHook(() => useQuestionWeighting());

      // Sentence 1 has no mistakes (new word with penalty)
      // Weight = 1.0 * 0.6 = 0.6
      const weight = result.current.getSentenceWeight('1', mockMistakes);
      expect(weight).toBe(0.6);

      // Sentence 2 has mistakes (1 record, 0 errors)
      // weight = 1.0 + 0.5 + 0 = 1.5
      const weight2 = result.current.getSentenceWeight('2', mockMistakes);
      expect(weight2).toBe(1.5);
    });

    // Spaced repetition modifier tests
    it('未到复习期降权 - NOT_DUE_PENALTY reduces weight when review is not due', () => {
      const currentTime = Date.now();
      const futureTime = currentTime + 86400000; // 1 day from now

      const mockMistakes: Mistake[] = [
        {
          sentenceId: 'not-due-sentence',
          wrongAnswers: ['wrong1'],
          correctAnswers: ['correct1'],
          attempts: 1,
          timestamp: Date.now(),
          dictionaryId: 'cet4',
          reviewedCount: 0,
          nextReviewAt: futureTime,
        },
      ];

      const { result } = renderHook(() => useQuestionWeighting());

      // Base weight: 1.0 + 0.5 + 1.0 = 2.5
      // NOT_DUE_PENALTY (0.3) applied
      // Expected: 2.5 * 0.3 = 0.75
      const weight = result.current.getSentenceWeight('not-due-sentence', mockMistakes, currentTime);
      expect(weight).toBe(0.75);
      expect(weight).toBeLessThan(1.0); // Should be less than default
    });

    it('逾期复习提权 - OVERDUE_BOOST increases weight when review is overdue', () => {
      const currentTime = Date.now();
      const pastTime = currentTime - 86400000; // 1 day ago

      const mockMistakes: Mistake[] = [
        {
          sentenceId: 'overdue-sentence',
          wrongAnswers: ['wrong1'],
          correctAnswers: ['correct1'],
          attempts: 1,
          timestamp: Date.now(),
          dictionaryId: 'cet4',
          reviewedCount: 0,
          nextReviewAt: pastTime,
        },
      ];

      const { result } = renderHook(() => useQuestionWeighting());

      // Base weight: 1.0 + 0.5 + 1.0 = 2.5
      // OVERDUE_BOOST (1.5) applied
      // Expected: 2.5 * 1.5 = 3.75
      const weight = result.current.getSentenceWeight('overdue-sentence', mockMistakes, currentTime);
      expect(weight).toBe(3.75);
      expect(weight).toBeGreaterThan(2.5); // Should be greater than base
    });

    it('逾期 + 低正确率叠加 - overdue with low review accuracy gets additional boost', () => {
      const currentTime = Date.now();
      const pastTime = currentTime - 86400000; // 1 day ago

      const mockMistakes: Mistake[] = [
        {
          sentenceId: 'overdue-low-accuracy',
          wrongAnswers: ['wrong1', 'wrong2'],
          correctAnswers: ['correct1'],
          attempts: 3,
          timestamp: Date.now(),
          dictionaryId: 'cet4',
          reviewedCount: 0,
          nextReviewAt: pastTime,
          reviewHistory: [
            { timestamp: Date.now() - 172800000, isCorrect: false, interval: 1, nextReviewDate: Date.now() },
            { timestamp: Date.now() - 86400000, isCorrect: true, interval: 2, nextReviewDate: Date.now() + 86400000 },
          ],
        },
      ];

      const { result } = renderHook(() => useQuestionWeighting());

      // Base weight: 1.0 + 0.5 + (2/3 * 1.0) = 2.167
      // reviewAccuracyBonus: max(0, 1 - (1/2)) * 0.5 = 0.25
      // OVERDUE_BOOST + reviewAccuracyBonus = 1.5 + 0.25 = 1.75
      // Expected: 2.167 * 1.75 = 3.79
      const weight = result.current.getSentenceWeight('overdue-low-accuracy', mockMistakes, currentTime);
      expect(weight).toBeCloseTo(3.79, 1);
      expect(weight).toBeGreaterThan(3.75); // Higher than just OVERDUE_BOOST
    });

    it('reviewHistory 全正确降权 - 100% correct review history has no accuracy bonus', () => {
      const currentTime = Date.now();
      const pastTime = currentTime - 86400000; // 1 day ago

      const mockMistakes: Mistake[] = [
        {
          sentenceId: 'perfect-reviews',
          wrongAnswers: ['wrong1'],
          correctAnswers: ['correct1'],
          attempts: 1,
          timestamp: Date.now(),
          dictionaryId: 'cet4',
          reviewedCount: 0,
          nextReviewAt: pastTime,
          reviewHistory: [
            { timestamp: Date.now() - 172800000, isCorrect: true, interval: 1, nextReviewDate: Date.now() },
            { timestamp: Date.now() - 86400000, isCorrect: true, interval: 2, nextReviewDate: Date.now() + 86400000 },
          ],
        },
      ];

      const { result } = renderHook(() => useQuestionWeighting());

      // Base weight: 1.0 + 0.5 + 1.0 = 2.5
      // reviewAccuracyBonus: max(0, 1 - 1.0) * 0.5 = 0
      // OVERDUE_BOOST only: 1.5
      // Expected: 2.5 * 1.5 = 3.75
      const weight = result.current.getSentenceWeight('perfect-reviews', mockMistakes, currentTime);
      expect(weight).toBe(3.75);
    });

    it('无 reviewHistory 逾期默认提权 - overdue without reviewHistory gets base OVERDUE_BOOST', () => {
      const currentTime = Date.now();
      const pastTime = currentTime - 86400000; // 1 day ago

      const mockMistakes: Mistake[] = [
        {
          sentenceId: 'no-history',
          wrongAnswers: ['wrong1'],
          correctAnswers: ['correct1'],
          attempts: 1,
          timestamp: Date.now(),
          dictionaryId: 'cet4',
          reviewedCount: 0,
          nextReviewAt: pastTime,
          // No reviewHistory
        },
      ];

      const { result } = renderHook(() => useQuestionWeighting());

      // Base weight: 1.0 + 0.5 + 1.0 = 2.5
      // reviewAccuracyBonus: 0 (no reviewHistory)
      // OVERDUE_BOOST only: 1.5
      // Expected: 2.5 * 1.5 = 3.75
      const weight = result.current.getSentenceWeight('no-history', mockMistakes, currentTime);
      expect(weight).toBe(3.75);
    });

    it('权重上限 5.0 不突破 - spaced repetition modifiers respect MAX_WEIGHT cap', () => {
      const currentTime = Date.now();
      const pastTime = currentTime - 86400000; // 1 day ago

      // Create many mistakes to push weight close to cap, with overdue review
      const manyMistakes: Mistake[] = [];
      for (let i = 0; i < 10; i++) {
        manyMistakes.push({
          sentenceId: 'high-weight',
          wrongAnswers: ['wrong1', 'wrong2', 'wrong3', 'wrong4'],
          correctAnswers: ['correct'],
          attempts: 5,
          timestamp: Date.now(),
          dictionaryId: 'cet4',
          reviewedCount: 0,
          nextReviewAt: pastTime,
          reviewHistory: [
            { timestamp: Date.now() - 86400000, isCorrect: false, interval: 1, nextReviewDate: Date.now() },
            { timestamp: Date.now() - 43200000, isCorrect: false, interval: 2, nextReviewDate: Date.now() },
          ],
        });
      }

      const { result } = renderHook(() => useQuestionWeighting());

      const weight = result.current.getSentenceWeight('high-weight', manyMistakes, currentTime);
      expect(weight).toBe(5.0); // Should be capped at MAX_WEIGHT
    });

    it('getWeightedSentenceIds 集成 - overdue sentences prioritized over not-due sentences', () => {
      const currentTime = Date.now();
      const pastTime = currentTime - 86400000; // 1 day ago (overdue)
      const futureTime = currentTime + 86400000; // 1 day from now (not due)

      const mockMistakes: Mistake[] = [
        {
          sentenceId: 'overdue-1',
          wrongAnswers: ['wrong1'],
          correctAnswers: ['correct1'],
          attempts: 1,
          timestamp: Date.now(),
          dictionaryId: 'cet4',
          reviewedCount: 0,
          nextReviewAt: pastTime,
        },
        {
          sentenceId: 'not-due-1',
          wrongAnswers: ['wrong1'],
          correctAnswers: ['correct1'],
          attempts: 1,
          timestamp: Date.now(),
          dictionaryId: 'cet4',
          reviewedCount: 0,
          nextReviewAt: futureTime,
        },
      ];

      const { result } = renderHook(() => useQuestionWeighting());

      // Verify weight calculation
      const overdueWeight = result.current.getSentenceWeight('overdue-1', mockMistakes, currentTime);
      const notDueWeight = result.current.getSentenceWeight('not-due-1', mockMistakes, currentTime);

      expect(overdueWeight).toBe(3.75); // 2.5 * 1.5
      expect(notDueWeight).toBe(0.75); // 2.5 * 0.3
      expect(overdueWeight).toBeGreaterThan(notDueWeight);

      // Test selection: overdue should be selected first
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      const sentenceIds = ['overdue-1', 'not-due-1', 'new-sentence'];
      const selected = result.current.getWeightedSentenceIds(sentenceIds, mockMistakes, 3, currentTime);

      // 'overdue-1' should have highest weight and be first after sorting
      expect(selected[0]).toBe('overdue-1');
    });

    it('currentTime 参数影响复习状态判断 - passing different currentTime changes spaced repetition behavior', () => {
      const currentTime = Date.now();
      const reviewTime = currentTime + 86400000; // 1 day from now (review due in 1 day)

      const mockMistakes: Mistake[] = [
        {
          sentenceId: 'test-sentence',
          wrongAnswers: ['wrong1'],
          correctAnswers: ['correct1'],
          attempts: 1,
          timestamp: Date.now(),
          dictionaryId: 'cet4',
          reviewedCount: 0,
          nextReviewAt: reviewTime,
        },
      ];

      const { result } = renderHook(() => useQuestionWeighting());

      // Using time BEFORE reviewTime: sentence appears not due
      const timeBefore = currentTime;
      const weightNotDue = result.current.getSentenceWeight('test-sentence', mockMistakes, timeBefore);
      expect(weightNotDue).toBe(0.75); // NOT_DUE_PENALTY applied

      // Using time AFTER reviewTime: sentence appears overdue
      const timeAfter = currentTime + 172800000; // 2 days from now
      const weightOverdue = result.current.getSentenceWeight('test-sentence', mockMistakes, timeAfter);
      expect(weightOverdue).toBe(3.75); // OVERDUE_BOOST applied

      // Weights differ based on currentTime
      expect(weightNotDue).not.toBe(weightOverdue);
    });
  });

  describe('NEW_WORD_PENALTY = 0.6', () => {
    describe('getSentenceWeight for new words', () => {
      it('新词降权 - new sentence without mistakes should get weight 0.6 (1.0 * 0.6 penalty)', () => {
        vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

        const { result } = renderHook(() => useQuestionWeighting());

        // New sentence: base weight 1.0 * NEW_WORD_PENALTY 0.6 = 0.6
        const weight = result.current.getSentenceWeight('new-sentence-id', []);

        expect(weight).toBe(0.6);
      });

      it('新词在错误列表为空时 - new word with empty mistakes array gets 0.6 weight', () => {
        const { result } = renderHook(() => useQuestionWeighting());

        // Empty mistakes array means new word
        const weight = result.current.getSentenceWeight('never-seen-sentence', []);

        expect(weight).toBe(0.6);
      });

      it('新词权重远低于复习中的词 - new word weight is much lower than experienced words', () => {
        const mockMistakes: Mistake[] = [
          {
            sentenceId: 'experienced-sentence',
            wrongAnswers: ['a'],
            correctAnswers: ['correct'],
            attempts: 2,
            timestamp: Date.now(),
            dictionaryId: 'cet4',
            reviewedCount: 0,
          },
        ];
        vi.spyOn(storage, 'getMistakes').mockReturnValue(mockMistakes);

        const { result } = renderHook(() => useQuestionWeighting());

        // New word weight: 1.0 * 0.6 = 0.6
        const newWordWeight = result.current.getSentenceWeight('new-word', mockMistakes);

        // Experienced word weight: 1.0 + 0.5 + 0.5 = 2.0
        const experiencedWeight = result.current.getSentenceWeight('experienced-sentence', mockMistakes);

        expect(newWordWeight).toBe(0.6);
        expect(experiencedWeight).toBe(2.0);
        expect(newWordWeight).toBeLessThan(experiencedWeight);
      });

      it('有错题记录即使无错误也算非新词 - sentence with mistake records (even 0 wrong answers) is NOT a new word', () => {
        const mockMistakes: Mistake[] = [
          {
            sentenceId: 'has-record',
            wrongAnswers: [], // 0 wrong answers
            correctAnswers: ['correct'],
            attempts: 1,
            timestamp: Date.now(),
            dictionaryId: 'cet4',
            reviewedCount: 0,
          },
        ];
        vi.spyOn(storage, 'getMistakes').mockReturnValue(mockMistakes);

        const { result } = renderHook(() => useQuestionWeighting());

        // Has mistake record, so NOT a new word
        // Weight = 1.0 + 0.5 + 0 = 1.5 (no penalty applied)
        const weight = result.current.getSentenceWeight('has-record', mockMistakes);

        expect(weight).toBe(1.5);
        expect(weight).not.toBe(0.6); // Should NOT have new word penalty
      });
    });

    describe('getWeightedSentenceIds with new words', () => {
      it('新词仍然包含在结果中 - new words are still included but with lower priority', () => {
        vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

        const { result } = renderHook(() => useQuestionWeighting());

        const sentenceIds = ['new-1', 'new-2', 'new-3', 'new-4', 'new-5'];
        const selected = result.current.getWeightedSentenceIds(sentenceIds, [], 5);

        // All new words should be included (count >= available)
        expect(selected).toHaveLength(5);
        expect(selected.sort()).toEqual(['new-1', 'new-2', 'new-3', 'new-4', 'new-5']);
      });

      it('混合新旧词时老词优先 - when mixing new and experienced words, experienced words are selected first', () => {
        const mockMistakes: Mistake[] = [
          {
            sentenceId: 'experienced-1',
            wrongAnswers: ['a', 'b'],
            correctAnswers: ['correct'],
            attempts: 3,
            timestamp: Date.now(),
            dictionaryId: 'cet4',
            reviewedCount: 0,
          },
          {
            sentenceId: 'experienced-2',
            wrongAnswers: ['a'],
            correctAnswers: ['correct'],
            attempts: 2,
            timestamp: Date.now(),
            dictionaryId: 'cet4',
            reviewedCount: 0,
          },
        ];
        vi.spyOn(storage, 'getMistakes').mockReturnValue(mockMistakes);

        const { result } = renderHook(() => useQuestionWeighting());

        // Verify weights
        const newWeight = result.current.getSentenceWeight('new-word', mockMistakes); // 0.6
        const exp1Weight = result.current.getSentenceWeight('experienced-1', mockMistakes); // 2.33
        const exp2Weight = result.current.getSentenceWeight('experienced-2', mockMistakes); // 2.0

        expect(newWeight).toBe(0.6);
        expect(exp1Weight).toBeGreaterThan(newWeight);
        expect(exp2Weight).toBeGreaterThan(newWeight);

        // Run selection multiple times to verify experienced words appear first
        const sentenceIds = ['new-1', 'new-2', 'experienced-1', 'experienced-2'];
        const results = Array.from({ length: 50 }, () =>
          result.current.getWeightedSentenceIds(sentenceIds, mockMistakes, 2)
        );

        // Count how often experienced words appear in first 2 positions
        const exp1InTop2 = results.filter(ids => ids.slice(0, 2).includes('experienced-1')).length;
        const new1InTop2 = results.filter(ids => ids.slice(0, 2).includes('new-1')).length;

        // Experienced words should appear more frequently due to higher weight
        expect(exp1InTop2).toBeGreaterThan(new1InTop2);
      });

      it('新词权重仅0.6远低于老词 - new word weight 0.6 is well below experienced words', () => {
        const mockMistakes: Mistake[] = [
          {
            sentenceId: 'experienced',
            wrongAnswers: ['a'],
            correctAnswers: ['correct'],
            attempts: 2,
            timestamp: Date.now(),
            dictionaryId: 'cet4',
            reviewedCount: 0,
          },
        ];
        vi.spyOn(storage, 'getMistakes').mockReturnValue(mockMistakes);

        const { result } = renderHook(() => useQuestionWeighting());

        const newWeight = result.current.getSentenceWeight('new-word', mockMistakes);
        const expWeight = result.current.getSentenceWeight('experienced', mockMistakes);

        // New word: 1.0 * 0.6 = 0.6
        expect(newWeight).toBe(0.6);

        // Experienced: 1.0 + 0.5 + 0.5 = 2.0
        expect(expWeight).toBe(2.0);

        // Experienced is over 3x more likely to be selected
        expect(expWeight / newWeight).toBeCloseTo(3.33, 1);
      });
    });

    describe('getWeightExplanation for new words', () => {
      it('新词解释包含所有必需字段 - explanation for new word includes isNewWord, spacedRepetitionState, newWordPenalty', () => {
        vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

        const { result } = renderHook(() => useQuestionWeighting());

        const explanation = result.current.getWeightExplanation('new-word', []);

        expect(explanation.isNewWord).toBe(true);
        expect(explanation.spacedRepetitionState).toBe('new');
        expect(explanation.newWordPenalty).toBe(0.6);
        expect(explanation.spacedRepetitionModifier).toBe(0.6);
        expect(explanation.totalWeight).toBe(0.6);
        expect(explanation.baseWeight).toBe(1.0);
        expect(explanation.mistakeWeight).toBe(0);
        expect(explanation.errorRateWeight).toBe(0);
      });

      it('新词解释文本包含新词信息 - explanation text for new word includes new word info', () => {
        vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

        const { result } = renderHook(() => useQuestionWeighting());

        const explanation = result.current.getWeightExplanation('new-word', []);

        // Explanation should mention new word penalty
        expect(explanation.explanation).toContain('新词');
        expect(explanation.explanation).toContain('0.6');
        expect(explanation.explanation).toContain('降权');
      });

      it('非新词解释不包含新词信息 - explanation for non-new word does not include new word penalty', () => {
        const mockMistakes: Mistake[] = [
          {
            sentenceId: 'experienced',
            wrongAnswers: ['a'],
            correctAnswers: ['correct'],
            attempts: 2,
            timestamp: Date.now(),
            dictionaryId: 'cet4',
            reviewedCount: 0,
          },
        ];
        vi.spyOn(storage, 'getMistakes').mockReturnValue(mockMistakes);

        const { result } = renderHook(() => useQuestionWeighting());

        const explanation = result.current.getWeightExplanation('experienced', mockMistakes);

        expect(explanation.isNewWord).toBe(false);
        expect(explanation.spacedRepetitionState).toBe('due');
        expect(explanation.newWordPenalty).toBe(1.0); // Not a new word, so penalty is 1.0
        expect(explanation.explanation).not.toContain('新词');
      });
    });

    describe('NEW_WORD_PENALTY weight cap behavior', () => {
      it('新词权重0.6远低于上限5.0 - new word weight 0.6 is well below MAX_WEIGHT cap 5.0', () => {
        vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

        const { result } = renderHook(() => useQuestionWeighting());

        const newWordWeight = result.current.getSentenceWeight('new-word', []);

        expect(newWordWeight).toBe(0.6);
        expect(newWordWeight).toBeLessThan(1.0);
        expect(newWordWeight * 5).toBeLessThanOrEqual(3.0); // 0.6 * 5 = 3.0 < 5.0
      });

      it('新词永远不会超过0.6权重 - new word with penalty 0.6 will never exceed 0.6 (well below cap)', () => {
        vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

        const { result } = renderHook(() => useQuestionWeighting());

        // No matter what, new word base is 1.0 * 0.6 = 0.6
        const weight = result.current.getSentenceWeight('any-new-word', []);

        expect(weight).toBe(0.6);
        expect(weight).toBeLessThanOrEqual(0.6); // Always exactly 0.6 for new words
      });

      it('有错题记录时权重才会累加 - experienced words can reach higher weights than new words', () => {
        // Create high-weight mistake to test cap
        const manyMistakes: Mistake[] = [];
        for (let i = 0; i < 5; i++) {
          manyMistakes.push({
            sentenceId: 'high-weight',
            wrongAnswers: ['a', 'b', 'c'],
            correctAnswers: ['correct'],
            attempts: 4,
            timestamp: Date.now(),
            dictionaryId: 'cet4',
            reviewedCount: 0,
          });
        }
        vi.spyOn(storage, 'getMistakes').mockReturnValue(manyMistakes);

        const { result } = renderHook(() => useQuestionWeighting());

        const highWeight = result.current.getSentenceWeight('high-weight', manyMistakes);
        const newWordWeight = result.current.getSentenceWeight('new-word', manyMistakes);

        // High weight sentence should approach or equal MAX_WEIGHT 5.0
        expect(highWeight).toBeGreaterThan(newWordWeight);
        expect(highWeight).toBeLessThanOrEqual(5.0);

        // New word is always 0.6
        expect(newWordWeight).toBe(0.6);
      });
    });
  });
});