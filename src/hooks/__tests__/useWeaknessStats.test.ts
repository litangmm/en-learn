import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mistake } from '@/data/types';
import { getWeaknessStats } from '../useWeaknessStats';

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

describe('useWeaknessStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getWeaknessStats', () => {
    it('returns correct stats for empty mistakes array', () => {
      const result = getWeaknessStats([]);
      expect(result.totalWeakCount).toBe(0);
      expect(result.byDictionary).toEqual({});
      expect(result.overallStrength).toBe(100);
      expect(result.byType['high-error']).toBe(0);
      expect(result.byType['low-accuracy']).toBe(0);
      expect(result.byType['review-neglected']).toBe(0);
      expect(result.byType['mode-weak']).toBe(0);
    });

    it('groups weaknesses by dictionary', () => {
      const mistakes: Mistake[] = [
        createMistake({ sentenceId: 's1', dictionaryId: 'cet4', wrongAnswers: ['w1', 'w2', 'w3'] }),
        createMistake({ sentenceId: 's2', dictionaryId: 'cet4', wrongAnswers: ['w1', 'w2', 'w3'] }),
        createMistake({ sentenceId: 's3', dictionaryId: 'cet6', wrongAnswers: ['w1', 'w2', 'w3'] }),
      ];
      const result = getWeaknessStats(mistakes);
      expect(result.totalWeakCount).toBe(3);
      expect(result.byDictionary['cet4']).toBe(2);
      expect(result.byDictionary['cet6']).toBe(1);
    });

    it('counts weaknesses by type', () => {
      const mistakes: Mistake[] = [
        // high-error
        createMistake({ sentenceId: 's1', wrongAnswers: ['w1', 'w2', 'w3'], dictionaryId: 'cet4' }),
        // another high-error
        createMistake({ sentenceId: 's2', wrongAnswers: ['w1', 'w2', 'w3'], dictionaryId: 'cet6' }),
        // low-accuracy (1/4 = 25%)
        createMistake({ sentenceId: 's3', wrongAnswers: ['w1'], correctAnswers: ['c1'], attempts: 4, dictionaryId: 'ielts' }),
      ];
      const result = getWeaknessStats(mistakes);
      expect(result.totalWeakCount).toBe(3);
      expect(result.byType['high-error']).toBe(2);
      expect(result.byType['low-accuracy']).toBe(1);
    });

    it('calculates overallStrength correctly', () => {
      const mistakes: Mistake[] = [
        // Weak sentences (high-error or low-accuracy)
        createMistake({ sentenceId: 's1', wrongAnswers: ['w1', 'w2', 'w3'], dictionaryId: 'cet4' }),
        createMistake({ sentenceId: 's2', wrongAnswers: ['w1', 'w2', 'w3'], dictionaryId: 'cet6' }),
        // Not weak sentences
        createMistake({ sentenceId: 's3', wrongAnswers: [], correctAnswers: ['c1'], attempts: 1, dictionaryId: 'ielts' }),
        createMistake({ sentenceId: 's4', wrongAnswers: [], correctAnswers: ['c1'], attempts: 1, dictionaryId: 'toefl' }),
        createMistake({ sentenceId: 's5', wrongAnswers: ['w1'], correctAnswers: ['c1', 'c2'], attempts: 3, dictionaryId: 'gre' }),
      ];
      const result = getWeaknessStats(mistakes);
      // 5 total mistakes, 2 are weak → 60% strength
      expect(result.totalWeakCount).toBe(2);
      expect(result.overallStrength).toBe(60);
    });

    it('handles single dictionary correctly', () => {
      const mistakes: Mistake[] = [
        createMistake({ sentenceId: 's1', dictionaryId: 'cet4' }),
      ];
      const result = getWeaknessStats(mistakes);
      expect(result.totalWeakCount).toBe(0);
      expect(result.byDictionary).toEqual({});
      expect(result.overallStrength).toBe(100);
    });

    it('handles mixed weak and non-weak sentences', () => {
      const mistakes: Mistake[] = [
        createMistake({ sentenceId: 's1', dictionaryId: 'cet4' }),
        createMistake({ sentenceId: 's2', wrongAnswers: ['w1', 'w2', 'w3'], dictionaryId: 'cet4' }),
        createMistake({ sentenceId: 's3', dictionaryId: 'cet4' }),
      ];
      const result = getWeaknessStats(mistakes);
      expect(result.totalWeakCount).toBe(1);
      expect(result.overallStrength).toBe(67); // 2/3 = 66.7% → 67%
    });
  });
});
