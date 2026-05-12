import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Mistake, Weakness } from '@/data/types';
import {
  DEFAULT_WEAKNESS_DEFINITION,
  detectWeaknessesFromMistake,
  detectAllWeaknesses,
  getWeaknessesByDictionary,
  getWeaknessCountByType,
  calculateOverallStrength,
} from '../useWeaknessDetection';

// Mock storage for the hook
vi.mock('@/services/storage', () => ({
  storage: {
    getMistakes: vi.fn(() => []),
    getMistakeCount: vi.fn(() => 0),
  },
}));

function createMistake(overrides: Partial<Mistake> = {}): Mistake {
  const now = Date.now();
  return {
    sentenceId: 's1',
    wrongAnswers: [],
    correctAnswers: [],
    attempts: 1,
    timestamp: now,
    dictionaryId: 'cet4',
    reviewedCount: 0,
    ...overrides,
  };
}

describe('useWeaknessDetection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectWeaknessesFromMistake', () => {
    it('returns empty array when no weakness conditions met', () => {
      const mistake = createMistake({
        wrongAnswers: ['wrong1'],
        attempts: 5,
        correctAnswers: ['correct1', 'correct2', 'correct3', 'correct4'],
        reviewedCount: 2,
        lastReviewedAt: Date.now(), // recently reviewed
      });
      const result = detectWeaknessesFromMistake(mistake);
      expect(result).toHaveLength(0);
    });

    it('detects high-error weakness when wrongAnswers >= 3', () => {
      const mistake = createMistake({
        wrongAnswers: ['w1', 'w2', 'w3'],
        attempts: 3,
        correctAnswers: [],
        dictionaryId: 'cet4',
      });
      const result = detectWeaknessesFromMistake(mistake);
      expect(result).toHaveLength(1);
      expect(result[0].weakType).toBe('high-error');
      expect(result[0].sentenceId).toBe('s1');
      expect(result[0].accuracy).toBe(0);
      expect(result[0].wrongCount).toBe(3);
    });

    it('detects low-accuracy weakness when accuracy < 60%', () => {
      const mistake = createMistake({
        wrongAnswers: ['w1'],
        correctAnswers: ['c1'],
        attempts: 4, // 1 correct out of 4 = 25% accuracy
        dictionaryId: 'cet6',
      });
      const result = detectWeaknessesFromMistake(mistake);
      expect(result).toHaveLength(1);
      expect(result[0].weakType).toBe('low-accuracy');
      expect(result[0].accuracy).toBe(0.25);
    });

    it('does not flag 0% accuracy as low-accuracy (never tried)', () => {
      const mistake = createMistake({
        wrongAnswers: [],
        correctAnswers: [],
        attempts: 1,
        dictionaryId: 'cet4',
      });
      const result = detectWeaknessesFromMistake(mistake);
      // 0% accuracy is "never tried" not "weak"
      expect(result.some((w) => w.weakType === 'low-accuracy')).toBe(false);
    });

    it('detects review-neglected weakness when not reviewed in 7+ days', () => {
      const nineDaysAgo = Date.now() - 9 * 24 * 60 * 60 * 1000;
      const mistake = createMistake({
        wrongAnswers: [],
        correctAnswers: ['c1', 'c2', 'c3'],
        attempts: 3, // 100% accuracy — avoid low-accuracy trigger
        reviewedCount: 1,
        lastReviewedAt: nineDaysAgo,
        dictionaryId: 'ielts',
      });
      const result = detectWeaknessesFromMistake(mistake);
      // Should only have review-neglected (no wrong answers, no low-accuracy)
      expect(result.some((w) => w.weakType === 'review-neglected')).toBe(true);
      const rn = result.find((w) => w.weakType === 'review-neglected');
      expect(rn?.daysSinceLastReview).toBe(9);
      expect(result.some((w) => w.weakType === 'low-accuracy')).toBe(false);
      expect(result.some((w) => w.weakType === 'high-error')).toBe(false);
    });

    it('does not flag review-neglected if never reviewed (reviewedCount=0)', () => {
      const oldTimestamp = Date.now() - 20 * 24 * 60 * 60 * 1000;
      const mistake = createMistake({
        timestamp: oldTimestamp,
        reviewedCount: 0,
        lastReviewedAt: undefined,
        wrongAnswers: ['w1'],
        correctAnswers: ['c1'],
        attempts: 2,
        dictionaryId: 'cet4',
      });
      const result = detectWeaknessesFromMistake(mistake);
      expect(result.some((w) => w.weakType === 'review-neglected')).toBe(false);
    });

    it('handles multiple weakness types on same mistake (deduplication: first wins)', () => {
      const fifteenDaysAgo = Date.now() - 15 * 24 * 60 * 60 * 1000;
      const mistake = createMistake({
        wrongAnswers: ['w1', 'w2', 'w3', 'w4', 'w5'],
        correctAnswers: ['c1'],
        attempts: 6, // 1/6 = ~16.7% accuracy < 60%
        reviewedCount: 2,
        lastReviewedAt: fifteenDaysAgo, // 15 days ago >= 7
        dictionaryId: 'toefl',
      });
      // A single mistake can trigger multiple types but we dedupe by sentenceId
      const result = detectWeaknessesFromMistake(mistake);
      // detectWeaknessesFromMistake returns ALL types for one mistake (no dedup here)
      // that's handled by detectAllWeaknesses
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it('respects custom definition thresholds', () => {
      const customDef = {
        ...DEFAULT_WEAKNESS_DEFINITION,
        sentenceCountThreshold: 5,
      };
      const mistake = createMistake({
        wrongAnswers: ['w1', 'w2', 'w3', 'w4'],
        attempts: 4,
        dictionaryId: 'cet4',
      });
      const result = detectWeaknessesFromMistake(mistake, customDef);
      // With threshold=5, 4 wrong answers should NOT flag high-error
      expect(result.some((w) => w.weakType === 'high-error')).toBe(false);
    });

    it('correctly calculates accuracy with partial attempts', () => {
      const mistake = createMistake({
        wrongAnswers: ['w1', 'w2'],
        correctAnswers: ['c1', 'c2'],
        attempts: 4, // 2/4 = 50% < 60% → low-accuracy
        dictionaryId: 'cet4',
      });
      const result = detectWeaknessesFromMistake(mistake);
      expect(result.some((w) => w.weakType === 'low-accuracy')).toBe(true);
      const lowAcc = result.find((w) => w.weakType === 'low-accuracy');
      expect(lowAcc?.accuracy).toBeCloseTo(0.5); // 2/4 = 50%
    });
  });

  describe('detectAllWeaknesses', () => {
    it('returns empty array for empty mistakes', () => {
      expect(detectAllWeaknesses([])).toEqual([]);
    });

    it('deduplicates by sentenceId — first weakness type wins per sentence', () => {
      const now = Date.now();
      const mistakes: Mistake[] = [
        createMistake({
          sentenceId: 's1',
          wrongAnswers: ['w1', 'w2', 'w3'], // high-error
          correctAnswers: ['c1', 'c2'],
          attempts: 5, // 2/5 = 40% < 60% → low-accuracy too
          reviewedCount: 1,
          lastReviewedAt: now - 10 * 24 * 60 * 60 * 1000, // 10 days ago → review-neglected
          dictionaryId: 'cet4',
        }),
        createMistake({
          sentenceId: 's2',
          wrongAnswers: ['w1', 'w2', 'w3'], // 3 wrong answers → high-error
          correctAnswers: ['c1', 'c2', 'c3'],
          attempts: 6, // 50% < 60% → low-accuracy too
          reviewedCount: 2,
          lastReviewedAt: now - 15 * 24 * 60 * 60 * 1000, // 15 days ago → review-neglected
          dictionaryId: 'cet6',
        }),
      ];

      const result = detectAllWeaknesses(mistakes);
      expect(result).toHaveLength(2);
      // Each sentenceId keeps its first weakness type
      const s1Weakness = result.find((w) => w.sentenceId === 's1');
      expect(s1Weakness?.weakType).toBe('high-error');
      const s2Weakness = result.find((w) => w.sentenceId === 's2');
      expect(s2Weakness?.weakType).toBe('high-error');
    });

    it('groups weaknesses by dictionary', () => {
      const mistakes: Mistake[] = [
        createMistake({ sentenceId: 's1', wrongAnswers: ['w1', 'w2', 'w3'], dictionaryId: 'cet4' }),
        createMistake({ sentenceId: 's2', wrongAnswers: ['w1', 'w2', 'w3'], dictionaryId: 'cet6' }),
        createMistake({ sentenceId: 's3', wrongAnswers: ['w1', 'w2', 'w3'], dictionaryId: 'cet4' }),
      ];
      const result = detectAllWeaknesses(mistakes);
      expect(result).toHaveLength(3);
      const cet4 = result.filter((w) => w.dictionaryId === 'cet4');
      const cet6 = result.filter((w) => w.dictionaryId === 'cet6');
      expect(cet4).toHaveLength(2);
      expect(cet6).toHaveLength(1);
    });

    it('handles mixed scenarios: some weak, some not', () => {
      const mistakes: Mistake[] = [
        createMistake({ sentenceId: 's1', wrongAnswers: ['w1', 'w2', 'w3'], dictionaryId: 'cet4' }),
        createMistake({ sentenceId: 's2', wrongAnswers: ['w1'], correctAnswers: ['c1', 'c2'], attempts: 3, dictionaryId: 'cet4' }),
        createMistake({ sentenceId: 's3', wrongAnswers: ['w1', 'w2'], correctAnswers: ['c1'], attempts: 3, dictionaryId: 'cet6' }),
      ];
      const result = detectAllWeaknesses(mistakes);
      expect(result).toHaveLength(2); // s1 and s3 are weak, s2 is not
      expect(result.map((w) => w.sentenceId)).toContain('s1');
      expect(result.map((w) => w.sentenceId)).toContain('s3');
      expect(result.map((w) => w.sentenceId)).not.toContain('s2');
    });

    it('handles multiple dictionaries', () => {
      const mistakes: Mistake[] = [
        createMistake({ sentenceId: 's1', dictionaryId: 'cet4' }),
        createMistake({ sentenceId: 's2', dictionaryId: 'cet6' }),
        createMistake({ sentenceId: 's3', dictionaryId: 'ielts' }),
        createMistake({ sentenceId: 's4', dictionaryId: 'toefl' }),
      ];
      const result = detectAllWeaknesses(mistakes);
      expect(result).toHaveLength(0); // no weaknesses (no wrong answers)
    });
  });

  describe('getWeaknessesByDictionary', () => {
    it('filters weaknesses by dictionaryId', () => {
      const weaknesses: Weakness[] = [
        { sentenceId: 's1', dictionaryId: 'cet4', weakType: 'high-error', accuracy: 0, wrongCount: 3, correctCount: 0, reviewCount: 0, daysSinceLastReview: null, detectedAt: Date.now() },
        { sentenceId: 's2', dictionaryId: 'cet6', weakType: 'high-error', accuracy: 0, wrongCount: 3, correctCount: 0, reviewCount: 0, daysSinceLastReview: null, detectedAt: Date.now() },
        { sentenceId: 's3', dictionaryId: 'cet4', weakType: 'low-accuracy', accuracy: 0.4, wrongCount: 2, correctCount: 2, reviewCount: 1, daysSinceLastReview: null, detectedAt: Date.now() },
      ];
      const result = getWeaknessesByDictionary(weaknesses, 'cet4');
      expect(result).toHaveLength(2);
      expect(result.every((w) => w.dictionaryId === 'cet4')).toBe(true);
    });

    it('returns empty array when no matches', () => {
      const weaknesses: Weakness[] = [
        { sentenceId: 's1', dictionaryId: 'cet4', weakType: 'high-error', accuracy: 0, wrongCount: 3, correctCount: 0, reviewCount: 0, daysSinceLastReview: null, detectedAt: Date.now() },
      ];
      expect(getWeaknessesByDictionary(weaknesses, 'gre')).toHaveLength(0);
    });
  });

  describe('getWeaknessCountByType', () => {
    it('counts weaknesses by type', () => {
      const weaknesses: Weakness[] = [
        { sentenceId: 's1', dictionaryId: 'cet4', weakType: 'high-error', accuracy: 0, wrongCount: 3, correctCount: 0, reviewCount: 0, daysSinceLastReview: null, detectedAt: Date.now() },
        { sentenceId: 's2', dictionaryId: 'cet6', weakType: 'high-error', accuracy: 0, wrongCount: 3, correctCount: 0, reviewCount: 0, daysSinceLastReview: null, detectedAt: Date.now() },
        { sentenceId: 's3', dictionaryId: 'ielts', weakType: 'low-accuracy', accuracy: 0.4, wrongCount: 2, correctCount: 2, reviewCount: 1, daysSinceLastReview: null, detectedAt: Date.now() },
        { sentenceId: 's4', dictionaryId: 'toefl', weakType: 'review-neglected', accuracy: 0.8, wrongCount: 0, correctCount: 4, reviewCount: 3, daysSinceLastReview: 10, detectedAt: Date.now() },
      ];
      const result = getWeaknessCountByType(weaknesses);
      expect(result['high-error']).toBe(2);
      expect(result['low-accuracy']).toBe(1);
      expect(result['review-neglected']).toBe(1);
      expect(result['mode-weak']).toBe(0);
    });

    it('returns zero counts for empty array', () => {
      const result = getWeaknessCountByType([]);
      expect(result['high-error']).toBe(0);
      expect(result['low-accuracy']).toBe(0);
      expect(result['review-neglected']).toBe(0);
      expect(result['mode-weak']).toBe(0);
    });
  });

  describe('calculateOverallStrength', () => {
    it('returns 100 when no mistakes', () => {
      expect(calculateOverallStrength(0, 0)).toBe(100);
    });

    it('returns 100 when no weaknesses among mistakes', () => {
      expect(calculateOverallStrength(5, 0)).toBe(100);
    });

    it('returns 50 when half are weak', () => {
      expect(calculateOverallStrength(10, 5)).toBe(50);
    });

    it('returns 0 when all are weak', () => {
      expect(calculateOverallStrength(10, 10)).toBe(0);
    });

    it('handles small numbers', () => {
      expect(calculateOverallStrength(1, 1)).toBe(0);
      expect(calculateOverallStrength(1, 0)).toBe(100);
    });

    it('rounds to nearest integer', () => {
      // 2/3 = 66.7%, strength = 33.3% → 33
      expect(calculateOverallStrength(3, 2)).toBe(33);
    });
  });
});
