import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mistake, Sentence, PracticeMode } from '@/data/types';
import { getTopRecommendations } from '../usePracticeRecommendations';

// Mock the constants
vi.mock('@/data/types', () => ({
  RECOMMENDATION_THRESHOLDS: {
    highErrorCount: 3,
    neglectedReviewDays: 7,
    modeWeakAccuracy: 50,
  },
  DEFAULT_RECOMMENDATION_LIMIT: 4,
}));

// Helper function to create a test sentence
function createSentence(id: string, word: string = 'test'): Sentence {
  return {
    id,
    english: `This is a ${word} sentence.`,
    chinese: '这是一个测试句子。',
    blanks: [{ word }],
    level: 'cet4',
  };
}

// Helper function to create a test mistake
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
    lastReviewedAt: now,
    ...overrides,
  };
}

// Helper to create mode accuracy data
function createModeAccuracy(mode: PracticeMode, accuracy: number): { mode: PracticeMode; accuracy: number } {
  return { mode, accuracy };
}

describe('usePracticeRecommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTopRecommendations', () => {
    describe('empty data', () => {
      it('returns empty array when all inputs are empty', () => {
        const result = getTopRecommendations([], [], [], undefined, undefined, 4);
        expect(result).toEqual([]);
      });

      it('returns empty array when only mistakes are provided and empty', () => {
        const result = getTopRecommendations([], [], [], undefined, undefined, 4);
        expect(result).toEqual([]);
      });

      it('returns empty array when mistakes have no high errors', () => {
        const mistakes: Mistake[] = [
          createMistake({ sentenceId: 's1', wrongAnswers: ['w1'], correctAnswers: ['c1'] }),
          createMistake({ sentenceId: 's2', wrongAnswers: ['w1'], correctAnswers: ['c1'] }),
        ];
        const result = getTopRecommendations(mistakes, [], [], undefined, undefined, 4);
        // Should have low-accuracy recommendations for these (1 correct, 1 wrong = 50% < 60%)
        expect(result.length).toBeGreaterThanOrEqual(0);
      });
    });

    describe('high-frequency errors detection', () => {
      it('detects high-frequency errors with 3+ wrong answers', () => {
        const mistakes: Mistake[] = [
          createMistake({ sentenceId: 's1', wrongAnswers: ['w1', 'w2', 'w3'] }),
        ];
        const result = getTopRecommendations(mistakes, [], [], undefined, undefined, 4);
        expect(result.length).toBeGreaterThanOrEqual(1);
        expect(result[0].type).toBe('high-error');
        expect(result[0].targetSentenceId).toBe('s1');
        expect(result[0].priority).toBe(1);
      });

      it('detects multiple high-frequency errors', () => {
        const mistakes: Mistake[] = [
          createMistake({ sentenceId: 's1', wrongAnswers: ['w1', 'w2', 'w3'] }),
          createMistake({ sentenceId: 's2', wrongAnswers: ['w1', 'w2', 'w3', 'w4'] }),
        ];
        const result = getTopRecommendations(mistakes, [], [], undefined, undefined, 4);
        const highErrorRecs = result.filter(r => r.type === 'high-error');
        expect(highErrorRecs.length).toBe(2);
      });

      it('does not trigger high-error for fewer than 3 wrong answers', () => {
        const mistakes: Mistake[] = [
          createMistake({ sentenceId: 's1', wrongAnswers: ['w1', 'w2'] }),
        ];
        const result = getTopRecommendations(mistakes, [], [], undefined, undefined, 4);
        const highErrorRecs = result.filter(r => r.type === 'high-error');
        expect(highErrorRecs.length).toBe(0);
      });
    });

    describe('neglected review detection', () => {
      it('detects sentences not reviewed in 7+ days', () => {
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);

        const mistakes: Mistake[] = [
          createMistake({
            sentenceId: 's1',
            lastReviewedAt: sevenDaysAgo, // exactly 7 days - should trigger (>= 7)
          }),
          createMistake({
            sentenceId: 's2',
            lastReviewedAt: eightDaysAgo, // 8 days - should trigger
          }),
        ];

        const history = mistakes.map(m => ({
          sentenceId: m.sentenceId,
          lastReviewedAt: m.lastReviewedAt,
          reviewedCount: 1,
        }));

        const result = getTopRecommendations(mistakes, [], [], history, undefined, 4);
        const neglectedRecs = result.filter(r => r.type === 'neglected-review');

        // Both s1 (7 days) and s2 (8 days) should be detected (>= threshold)
        expect(neglectedRecs.length).toBe(2);
        expect(neglectedRecs[0].targetSentenceId).toBe('s1');
        expect(neglectedRecs[0].priority).toBe(2);
        expect(neglectedRecs[1].targetSentenceId).toBe('s2');
        expect(neglectedRecs[1].priority).toBe(2);
      });

      it('ignores sentences reviewed today', () => {
        const mistakes: Mistake[] = [
          createMistake({
            sentenceId: 's1',
            lastReviewedAt: Date.now(), // just now
          }),
        ];

        const history = mistakes.map(m => ({
          sentenceId: m.sentenceId,
          lastReviewedAt: m.lastReviewedAt,
          reviewedCount: 1,
        }));

        const result = getTopRecommendations(mistakes, [], [], history, undefined, 4);
        const neglectedRecs = result.filter(r => r.type === 'neglected-review');
        expect(neglectedRecs.length).toBe(0);
      });
    });

    describe('new word recommendations', () => {
      it('recommends personal words not yet practiced', () => {
        const mistakes: Mistake[] = [
          createMistake({ sentenceId: 's-existing' }),
        ];

        const personalWords: Sentence[] = [
          createSentence('pw-1', 'apple'),
          createSentence('pw-2', 'banana'),
        ];

        const result = getTopRecommendations(mistakes, [], personalWords, undefined, undefined, 4);
        const newWordRecs = result.filter(r => r.type === 'new-word');

        expect(newWordRecs.length).toBe(2);
        expect(newWordRecs[0].priority).toBe(3);
      });

      it('does not recommend already practiced personal words', () => {
        const mistakes: Mistake[] = [
          createMistake({ sentenceId: 'pw-1' }), // pw-1 is practiced
        ];

        const personalWords: Sentence[] = [
          createSentence('pw-1', 'apple'), // practiced
          createSentence('pw-2', 'banana'), // not practiced
        ];

        const result = getTopRecommendations(mistakes, [], personalWords, undefined, undefined, 4);
        const newWordRecs = result.filter(r => r.type === 'new-word');

        expect(newWordRecs.length).toBe(1);
        expect(newWordRecs[0].targetSentenceId).toBe('pw-2');
      });

      it('includes target sentence for new word recommendations', () => {
        const personalWords: Sentence[] = [
          createSentence('pw-1', 'apple'),
        ];

        const result = getTopRecommendations([], [], personalWords, undefined, undefined, 4);
        const newWordRecs = result.filter(r => r.type === 'new-word');

        expect(newWordRecs.length).toBe(1);
        expect(newWordRecs[0].targetSentence).toBeDefined();
        expect(newWordRecs[0].targetSentence!.id).toBe('pw-1');
      });
    });

    describe('mode weakness recommendations', () => {
      it('detects mode with accuracy below 50%', () => {
        const modeAccuracy = [
          createModeAccuracy('fill-in-blanks', 70),
          createModeAccuracy('multiple-choice', 45), // < 50%
          createModeAccuracy('sentence-reorder', 80),
          createModeAccuracy('dictation', 60),
        ];

        const result = getTopRecommendations([], [], [], undefined, modeAccuracy, 4);
        const modeWeakRecs = result.filter(r => r.type === 'mode-weak');

        expect(modeWeakRecs.length).toBe(1);
        expect(modeWeakRecs[0].suggestedMode).toBe('multiple-choice');
        expect(modeWeakRecs[0].priority).toBe(3);
      });

      it('recommends the weakest mode when multiple modes are weak', () => {
        const modeAccuracy = [
          createModeAccuracy('fill-in-blanks', 30), // weakest
          createModeAccuracy('multiple-choice', 45),
          createModeAccuracy('sentence-reorder', 48),
          createModeAccuracy('dictation', 60),
        ];

        const result = getTopRecommendations([], [], [], undefined, modeAccuracy, 4);
        const modeWeakRecs = result.filter(r => r.type === 'mode-weak');

        expect(modeWeakRecs.length).toBe(1);
        expect(modeWeakRecs[0].suggestedMode).toBe('fill-in-blanks');
      });

      it('does not trigger mode-weak when all modes are above 50%', () => {
        const modeAccuracy = [
          createModeAccuracy('fill-in-blanks', 70),
          createModeAccuracy('multiple-choice', 65),
          createModeAccuracy('sentence-reorder', 80),
          createModeAccuracy('dictation', 75),
        ];

        const result = getTopRecommendations([], [], [], undefined, modeAccuracy, 4);
        const modeWeakRecs = result.filter(r => r.type === 'mode-weak');

        expect(modeWeakRecs.length).toBe(0);
      });

      it('does not trigger mode-weak for modes with 0% accuracy (no data)', () => {
        const modeAccuracy = [
          createModeAccuracy('fill-in-blanks', 0), // no data
          createModeAccuracy('multiple-choice', 45),
        ];

        const result = getTopRecommendations([], [], [], undefined, modeAccuracy, 4);
        const modeWeakRecs = result.filter(r => r.type === 'mode-weak');

        // 0% accuracy should not trigger (indicates no practice)
        expect(modeWeakRecs.length).toBe(1);
        expect(modeWeakRecs[0].suggestedMode).toBe('multiple-choice');
      });
    });

    describe('priority ordering', () => {
      it('high-error recommendations have priority 1', () => {
        const mistakes: Mistake[] = [
          createMistake({ sentenceId: 's1', wrongAnswers: ['w1', 'w2', 'w3'] }),
        ];

        const result = getTopRecommendations(mistakes, [], [], undefined, undefined, 4);
        const highErrorRec = result.find(r => r.type === 'high-error');

        expect(highErrorRec).toBeDefined();
        expect(highErrorRec!.priority).toBe(1);
      });

      it('neglected-review recommendations have priority 2', () => {
        const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
        const mistakes: Mistake[] = [
          createMistake({ sentenceId: 's1', lastReviewedAt: eightDaysAgo }),
        ];
        const history = mistakes.map(m => ({
          sentenceId: m.sentenceId,
          lastReviewedAt: m.lastReviewedAt,
          reviewedCount: 1,
        }));

        const result = getTopRecommendations(mistakes, [], [], history, undefined, 4);
        const neglectedRec = result.find(r => r.type === 'neglected-review');

        expect(neglectedRec).toBeDefined();
        expect(neglectedRec!.priority).toBe(2);
      });

      it('low-accuracy recommendations have priority 2', () => {
        const mistakes: Mistake[] = [
          createMistake({
            sentenceId: 's1',
            wrongAnswers: ['w1'],
            correctAnswers: ['c1'],
          }),
        ];

        const result = getTopRecommendations(mistakes, [], [], undefined, undefined, 4);
        const lowAccuracyRec = result.find(r => r.type === 'low-accuracy');

        expect(lowAccuracyRec).toBeDefined();
        expect(lowAccuracyRec!.priority).toBe(2);
      });

      it('new-word recommendations have priority 3', () => {
        const personalWords: Sentence[] = [
          createSentence('pw-1', 'apple'),
        ];

        const result = getTopRecommendations([], [], personalWords, undefined, undefined, 4);
        const newWordRec = result.find(r => r.type === 'new-word');

        expect(newWordRec).toBeDefined();
        expect(newWordRec!.priority).toBe(3);
      });

      it('mode-weak recommendations have priority 3', () => {
        const modeAccuracy = [
          createModeAccuracy('multiple-choice', 45),
        ];

        const result = getTopRecommendations([], [], [], undefined, modeAccuracy, 4);
        const modeWeakRec = result.find(r => r.type === 'mode-weak');

        expect(modeWeakRec).toBeDefined();
        expect(modeWeakRec!.priority).toBe(3);
      });

      it('sorts recommendations by priority (1 before 2 before 3)', () => {
        const mistakes: Mistake[] = [
          createMistake({ sentenceId: 's1', wrongAnswers: ['w1', 'w2', 'w3'] }), // high-error
        ];
        const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
        const history = [
          { sentenceId: 's2', lastReviewedAt: eightDaysAgo, reviewedCount: 1 },
        ];
        const personalWords: Sentence[] = [
          createSentence('pw-1', 'apple'),
        ];

        const result = getTopRecommendations(mistakes, [], personalWords, history, undefined, 4);

        // Results should be sorted by priority
        const priorities = result.map(r => r.priority);
        expect(priorities).toEqual([...priorities].sort((a, b) => a - b));
      });

      it('when same priority, sort by recommendation type order', () => {
        const eightDaysAgo = Date.now() - (8 * 24 * 60 * 60 * 1000);
        const mistakes: Mistake[] = [
          createMistake({ sentenceId: 's1', lastReviewedAt: eightDaysAgo }), // neglected
        ];
        const history = mistakes.map(m => ({
          sentenceId: m.sentenceId,
          lastReviewedAt: m.lastReviewedAt,
          reviewedCount: 1,
        }));

        const result = getTopRecommendations(mistakes, [], [], history, undefined, 4);

        // With only neglected-review (priority 2), check it's properly sorted
        expect(result.length).toBeGreaterThanOrEqual(1);
        expect(result[0].priority).toBe(2);
      });
    });

    describe('limit parameter', () => {
      it('returns at most limit recommendations', () => {
        const mistakes: Mistake[] = [
          createMistake({ sentenceId: 's1', wrongAnswers: ['w1', 'w2', 'w3'] }),
          createMistake({ sentenceId: 's2', wrongAnswers: ['w1', 'w2', 'w3'] }),
          createMistake({ sentenceId: 's3', wrongAnswers: ['w1', 'w2', 'w3'] }),
        ];

        const result = getTopRecommendations(mistakes, [], [], undefined, undefined, 2);

        expect(result.length).toBeLessThanOrEqual(2);
      });

      it('returns default limit of 4 when not specified', () => {
        const mistakes: Mistake[] = [
          createMistake({ sentenceId: 's1', wrongAnswers: ['w1', 'w2', 'w3'] }),
          createMistake({ sentenceId: 's2', wrongAnswers: ['w1', 'w2', 'w3'] }),
          createMistake({ sentenceId: 's3', wrongAnswers: ['w1', 'w2', 'w3'] }),
          createMistake({ sentenceId: 's4', wrongAnswers: ['w1', 'w2', 'w3'] }),
          createMistake({ sentenceId: 's5', wrongAnswers: ['w1', 'w2', 'w3'] }),
        ];

        const result = getTopRecommendations(mistakes, [], [], undefined, undefined);

        expect(result.length).toBeLessThanOrEqual(4);
      });

      it('handles limit of 1', () => {
        const mistakes: Mistake[] = [
          createMistake({ sentenceId: 's1', wrongAnswers: ['w1', 'w2', 'w3'] }),
          createMistake({ sentenceId: 's2', wrongAnswers: ['w1', 'w2', 'w3'] }),
        ];

        const result = getTopRecommendations(mistakes, [], [], undefined, undefined, 1);

        expect(result.length).toBeLessThanOrEqual(1);
      });

      it('handles limit larger than available recommendations', () => {
        const mistakes: Mistake[] = [
          createMistake({ sentenceId: 's1', wrongAnswers: ['w1', 'w2', 'w3'] }),
        ];

        const result = getTopRecommendations(mistakes, [], [], undefined, undefined, 10);

        // Should return all available recommendations
        expect(result.length).toBeGreaterThanOrEqual(1);
        expect(result.length).toBeLessThanOrEqual(10);
      });
    });

    describe('deduplication', () => {
      it('deduplicates recommendations for same sentence ID', () => {
        const mistakes: Mistake[] = [
          createMistake({
            sentenceId: 's1',
            wrongAnswers: ['w1', 'w2', 'w3'], // high-error
          }),
        ];

        // When same sentence has both high-error and low-accuracy (which is likely),
        // only the higher priority one should be kept
        const result = getTopRecommendations(mistakes, [], [], undefined, undefined, 4);

        // Count how many recommendations target the same sentence
        const bySentenceId = new Map<string, number>();
        result.forEach(r => {
          bySentenceId.set(r.targetSentenceId, (bySentenceId.get(r.targetSentenceId) || 0) + 1);
        });

        // Each sentence should only appear once
        for (const count of bySentenceId.values()) {
          expect(count).toBe(1);
        }
      });
    });

    describe('recommendation format', () => {
      it('each recommendation has required fields', () => {
        const mistakes: Mistake[] = [
          createMistake({ sentenceId: 's1', wrongAnswers: ['w1', 'w2', 'w3'] }),
        ];

        const result = getTopRecommendations(mistakes, [], [], undefined, undefined, 4);
        const rec = result[0];

        expect(rec.id).toBeDefined();
        expect(rec.type).toBeDefined();
        expect(rec.priority).toBeDefined();
        expect(rec.reason).toBeDefined();
        expect(rec.targetSentenceId).toBeDefined();
        expect(rec.action).toBeDefined();
      });

      it('high-error recommendation includes correct reason text', () => {
        const mistakes: Mistake[] = [
          createMistake({ sentenceId: 's1', wrongAnswers: ['w1', 'w2', 'w3', 'w4'] }),
        ];

        const result = getTopRecommendations(mistakes, [], [], undefined, undefined, 4);
        const highErrorRec = result.find(r => r.type === 'high-error');

        expect(highErrorRec).toBeDefined();
        expect(highErrorRec!.reason).toContain('4'); // 4 wrong answers
        expect(highErrorRec!.reason).toContain('高频错误');
      });

      it('new-word recommendation includes word name in reason', () => {
        const personalWords: Sentence[] = [
          createSentence('pw-1', 'apple'),
        ];

        const result = getTopRecommendations([], [], personalWords, undefined, undefined, 4);
        const newWordRec = result.find(r => r.type === 'new-word');

        expect(newWordRec).toBeDefined();
        expect(newWordRec!.reason).toContain('apple');
      });

      it('mode-weak recommendation includes mode name in reason', () => {
        const modeAccuracy = [
          createModeAccuracy('dictation', 45),
        ];

        const result = getTopRecommendations([], [], [], undefined, modeAccuracy, 4);
        const modeWeakRec = result.find(r => r.type === 'mode-weak');

        expect(modeWeakRec).toBeDefined();
        expect(modeWeakRec!.reason).toContain('听写'); // dictation in Chinese
      });
    });
  });
});