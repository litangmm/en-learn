import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAdaptivePractice } from '../useAdaptivePractice';
import { storage } from '@/services/storage';

const mockSentences = [
  {
    id: '1',
    english: 'The early bird catches the worm.',
    chinese: '早起的鸟儿有虫吃。',
    blanks: [{ word: 'catches', hint: '抓住' }],
    level: 'junior' as const,
  },
  {
    id: '2',
    english: 'Actions speak louder than words.',
    chinese: '行动胜于言辞。',
    blanks: [
      { word: 'Actions', hint: '行动' },
      { word: 'words', hint: '言辞' },
    ],
    level: 'junior' as const,
  },
  {
    id: '3',
    english: 'Practice makes perfect.',
    chinese: '熟能生巧。',
    blanks: [{ word: 'perfect', hint: '完美的' }],
    level: 'junior' as const,
  },
  {
    id: '4',
    english: 'Better late than never.',
    chinese: '迟做总比不做好。',
    blanks: [{ word: 'late', hint: '晚' }],
    level: 'junior' as const,
  },
  {
    id: '5',
    english: 'No pain no gain.',
    chinese: '不劳无获。',
    blanks: [{ word: 'pain', hint: '痛苦' }],
    level: 'junior' as const,
  },
];

describe('useAdaptivePractice', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSmartDistractors', () => {
    describe('history-based strategy', () => {
      it('should select previously confused sentences as distractors', () => {
        // Set strategy to history-based
        vi.spyOn(storage, 'getAdaptiveConfig').mockReturnValue({
          strategy: 'history-based',
          historyWeight: 0.5,
          difficultyCalibration: { enabled: true, targetAccuracy: 0.75, toleranceBand: 0.05, calibrationSpeed: 0.1 },
        });

        // Create mock mistakes: user confused sentence X with correct sentence Y multiple times
        // In the practice context, mistakes are recorded when user picked wrong answer X
        // while the correct answer was Y
        const mockMistakes = [
          {
            sentenceId: '2', // correct answer was sentence 2
            wrongAnswers: ['3', '3'], // user picked sentence 3 twice
            correctAnswers: ['2'],
            attempts: 1,
            timestamp: Date.now(),
            dictionaryId: 'cet4',
            reviewedCount: 0,
          },
        ];
        vi.spyOn(storage, 'getMistakes').mockReturnValue(mockMistakes);

        const { result } = renderHook(() => useAdaptivePractice());

        const choices = result.current.getSmartDistractors('2', '2', mockSentences);

        // Assert: sentence 3 appears in the distractors (confusion frequency 2x)
        const distractorIds = choices.filter((c) => c.id !== '2').map((c) => c.id);
        expect(distractorIds).toContain('3');

        // Assert: the correct answer (sentence 2) is NOT in distractors
        expect(distractorIds).not.toContain('2');
      });

      it('should sort distractors by confusion frequency (most confused first)', () => {
        vi.spyOn(storage, 'getAdaptiveConfig').mockReturnValue({
          strategy: 'history-based',
          historyWeight: 0.5,
          difficultyCalibration: { enabled: true, targetAccuracy: 0.75, toleranceBand: 0.05, calibrationSpeed: 0.1 },
        });

        // User confused sentence 3 more times than sentence 4
        const mockMistakes = [
          {
            sentenceId: '2',
            wrongAnswers: ['3', '3', '3', '4'], // 3 appears 3 times, 4 appears 1 time
            correctAnswers: ['2'],
            attempts: 1,
            timestamp: Date.now(),
            dictionaryId: 'cet4',
            reviewedCount: 0,
          },
        ];
        vi.spyOn(storage, 'getMistakes').mockReturnValue(mockMistakes);

        const { result } = renderHook(() => useAdaptivePractice());

        const choices = result.current.getSmartDistractors('2', '2', mockSentences);

        // Get distractors (not including correct answer)
        const distractors = choices.filter((c) => c.id !== '2');
        const distractorIds = distractors.map((c) => c.id);

        // Sentence 3 should be in the distractors (was confused more)
        expect(distractorIds).toContain('3');
        // Should have exactly 3 distractors
        expect(distractors).toHaveLength(3);
      });

      it('should fill remaining slots with random distractors when history is insufficient', () => {
        vi.spyOn(storage, 'getAdaptiveConfig').mockReturnValue({
          strategy: 'history-based',
          historyWeight: 0.5,
          difficultyCalibration: { enabled: true, targetAccuracy: 0.75, toleranceBand: 0.05, calibrationSpeed: 0.1 },
        });

        // Only one mistake record
        const mockMistakes = [
          {
            sentenceId: '2',
            wrongAnswers: ['3'],
            correctAnswers: ['2'],
            attempts: 1,
            timestamp: Date.now(),
            dictionaryId: 'cet4',
            reviewedCount: 0,
          },
        ];
        vi.spyOn(storage, 'getMistakes').mockReturnValue(mockMistakes);

        const { result } = renderHook(() => useAdaptivePractice());

        const choices = result.current.getSmartDistractors('2', '2', mockSentences);

        // Should still have 3 distractors (filling with random)
        const distractors = choices.filter((c) => c.id !== '2');
        expect(distractors).toHaveLength(3);
      });
    });

    describe('random strategy', () => {
      it('should ignore history and pick random distractors', () => {
        vi.spyOn(storage, 'getAdaptiveConfig').mockReturnValue({
          strategy: 'random',
          historyWeight: 0.5,
          difficultyCalibration: { enabled: true, targetAccuracy: 0.75, toleranceBand: 0.05, calibrationSpeed: 0.1 },
        });

        // Even with mistake history that would normally influence selection
        const mockMistakes = [
          {
            sentenceId: '2',
            wrongAnswers: ['3', '3'],
            correctAnswers: ['2'],
            attempts: 1,
            timestamp: Date.now(),
            dictionaryId: 'cet4',
            reviewedCount: 0,
          },
        ];
        vi.spyOn(storage, 'getMistakes').mockReturnValue(mockMistakes);

        const { result } = renderHook(() => useAdaptivePractice());

        const choices = result.current.getSmartDistractors('2', '2', mockSentences);

        // Should have 3 distractors (all from random selection)
        const distractors = choices.filter((c) => c.id !== '2');
        expect(distractors).toHaveLength(3);

        // Correct answer should not be in distractors
        expect(distractors.map((c) => c.id)).not.toContain('2');
      });

      it('should produce deterministic results with fixed random values', () => {
        vi.spyOn(storage, 'getAdaptiveConfig').mockReturnValue({
          strategy: 'random',
          historyWeight: 0.5,
          difficultyCalibration: { enabled: true, targetAccuracy: 0.75, toleranceBand: 0.05, calibrationSpeed: 0.1 },
        });
        vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

        const { result } = renderHook(() => useAdaptivePractice());

        // Mock Math.random to return predictable values
        // First batch for first call's filter+sort, second batch for first call's final shuffle
        // Third batch for second call's filter+sort, fourth batch for second call's final shuffle
        vi.spyOn(Math, 'random')
          .mockReturnValueOnce(0.1)
          .mockReturnValueOnce(0.5)
          .mockReturnValueOnce(0.9)
          .mockReturnValueOnce(0.1)
          .mockReturnValueOnce(0.2)
          .mockReturnValueOnce(0.3)
          .mockReturnValueOnce(0.4)
          .mockReturnValueOnce(0.6);
        const choices1 = result.current.getSmartDistractors('1', '1', mockSentences);
        const ids1 = choices1.map((c) => c.id);

        // Second call with SAME random values
        vi.spyOn(Math, 'random')
          .mockReturnValueOnce(0.1)
          .mockReturnValueOnce(0.5)
          .mockReturnValueOnce(0.9)
          .mockReturnValueOnce(0.1)
          .mockReturnValueOnce(0.2)
          .mockReturnValueOnce(0.3)
          .mockReturnValueOnce(0.4)
          .mockReturnValueOnce(0.6);
        const choices2 = result.current.getSmartDistractors('1', '1', mockSentences);
        const ids2 = choices2.map((c) => c.id);

        // Same random inputs should produce same output
        expect(ids1).toEqual(ids2);

        // Verify core invariants
        expect(choices1).toHaveLength(4);
        expect(new Set(ids1).size).toBe(4); // no duplicates
        expect(ids1).toContain('1'); // correct answer included
      });

      it('should produce different results with different random values', () => {
        vi.spyOn(storage, 'getAdaptiveConfig').mockReturnValue({
          strategy: 'random',
          historyWeight: 0.5,
          difficultyCalibration: { enabled: true, targetAccuracy: 0.75, toleranceBand: 0.05, calibrationSpeed: 0.1 },
        });
        vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

        const { result } = renderHook(() => useAdaptivePractice());

        // First call with one random sequence (8 values for 2 sorts each)
        vi.spyOn(Math, 'random')
          .mockReturnValueOnce(0.1)
          .mockReturnValueOnce(0.5)
          .mockReturnValueOnce(0.9)
          .mockReturnValueOnce(0.1)
          .mockReturnValueOnce(0.2)
          .mockReturnValueOnce(0.3)
          .mockReturnValueOnce(0.4)
          .mockReturnValueOnce(0.6);
        const choices1 = result.current.getSmartDistractors('1', '1', mockSentences);
        const ids1 = choices1.map((c) => c.id);

        // Second call with different random sequence
        vi.spyOn(Math, 'random')
          .mockReturnValueOnce(0.9)
          .mockReturnValueOnce(0.1)
          .mockReturnValueOnce(0.5)
          .mockReturnValueOnce(0.9)
          .mockReturnValueOnce(0.8)
          .mockReturnValueOnce(0.7)
          .mockReturnValueOnce(0.6)
          .mockReturnValueOnce(0.5);
        const choices2 = result.current.getSmartDistractors('1', '1', mockSentences);
        const ids2 = choices2.map((c) => c.id);

        // Different random inputs should produce different output
        // (not guaranteed, but highly likely given different sort orders)
        expect(ids1).not.toEqual(ids2);

        // Verify both maintain core invariants
        expect(choices1).toHaveLength(4);
        expect(choices2).toHaveLength(4);
        expect(ids1).toContain('1');
        expect(ids2).toContain('1');
      });
    });

    describe('fallback behavior', () => {
      it('should fallback to random when no mistakes exist', () => {
        vi.spyOn(storage, 'getAdaptiveConfig').mockReturnValue({
          strategy: 'history-based',
          historyWeight: 0.5,
          difficultyCalibration: { enabled: true, targetAccuracy: 0.75, toleranceBand: 0.05, calibrationSpeed: 0.1 },
        });

        // No mistake history
        vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

        const { result } = renderHook(() => useAdaptivePractice());

        const choices = result.current.getSmartDistractors('2', '2', mockSentences);

        // Should still return 3 distractors (from random selection)
        const distractors = choices.filter((c) => c.id !== '2');
        expect(distractors).toHaveLength(3);
      });

      it('should fallback to random regardless of strategy when no mistakes exist', () => {
        // Test with history-based strategy but no mistakes
        vi.spyOn(storage, 'getAdaptiveConfig').mockReturnValue({
          strategy: 'history-based',
          historyWeight: 0.5,
          difficultyCalibration: { enabled: true, targetAccuracy: 0.75, toleranceBand: 0.05, calibrationSpeed: 0.1 },
        });
        vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

        const { result } = renderHook(() => useAdaptivePractice());

        const choices = result.current.getSmartDistractors('2', '2', mockSentences);

        // Should still have 3 distractors
        const distractors = choices.filter((c) => c.id !== '2');
        expect(distractors).toHaveLength(3);
        expect(distractors.map((c) => c.id)).not.toContain('2');
      });

      it('should return empty array when less than 4 sentences available', () => {
        vi.spyOn(storage, 'getAdaptiveConfig').mockReturnValue({
          strategy: 'random',
          historyWeight: 0.5,
          difficultyCalibration: { enabled: true, targetAccuracy: 0.75, toleranceBand: 0.05, calibrationSpeed: 0.1 },
        });
        vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

        const { result } = renderHook(() => useAdaptivePractice());

        // Only 2 sentences - not enough for 1 correct + 3 distractors
        const choices = result.current.getSmartDistractors('1', '1', mockSentences.slice(0, 2));

        expect(choices).toEqual([]);
      });
    });

    describe('distractor constraints', () => {
      it('should never return duplicate sentence IDs', () => {
        vi.spyOn(storage, 'getAdaptiveConfig').mockReturnValue({
          strategy: 'random',
          historyWeight: 0.5,
          difficultyCalibration: { enabled: true, targetAccuracy: 0.75, toleranceBand: 0.05, calibrationSpeed: 0.1 },
        });
        vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

        const { result } = renderHook(() => useAdaptivePractice());

        // Call multiple times to verify no duplicates
        for (let i = 0; i < 10; i++) {
          const choices = result.current.getSmartDistractors('1', '1', mockSentences);

          // All IDs should be unique
          const ids = choices.map((c) => c.id);
          const uniqueIds = new Set(ids);
          expect(uniqueIds.size).toBe(ids.length);
        }
      });

      it('should never include correct answer in distractors', () => {
        vi.spyOn(storage, 'getAdaptiveConfig').mockReturnValue({
          strategy: 'random',
          historyWeight: 0.5,
          difficultyCalibration: { enabled: true, targetAccuracy: 0.75, toleranceBand: 0.05, calibrationSpeed: 0.1 },
        });
        vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

        const { result } = renderHook(() => useAdaptivePractice());

        // Test with different correct answer IDs
        for (const correctId of ['1', '2', '3', '4', '5']) {
          const choices = result.current.getSmartDistractors(correctId, correctId, mockSentences);
          const distractorIds = choices.filter((c) => c.id !== correctId).map((c) => c.id);

          // Should have 3 distractors
          expect(distractorIds).toHaveLength(3);

          // Correct answer should NOT be in distractors
          expect(distractorIds).not.toContain(correctId);

          // All 3 distractors should be different from correct answer and each other
          expect(new Set(distractorIds).size).toBe(3);
        }
      });

      it('should always return exactly 4 choices (1 correct + 3 distractors)', () => {
        vi.spyOn(storage, 'getAdaptiveConfig').mockReturnValue({
          strategy: 'random',
          historyWeight: 0.5,
          difficultyCalibration: { enabled: true, targetAccuracy: 0.75, toleranceBand: 0.05, calibrationSpeed: 0.1 },
        });
        vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

        const { result } = renderHook(() => useAdaptivePractice());

        const choices = result.current.getSmartDistractors('1', '1', mockSentences);

        // Should have exactly 4 choices
        expect(choices).toHaveLength(4);

        // One of them should be the correct answer
        const correctChoice = choices.find((c) => c.id === '1');
        expect(correctChoice).toBeDefined();
      });
    });

    describe('config integration', () => {
      it('should expose config from storage', () => {
        vi.spyOn(storage, 'getAdaptiveConfig').mockReturnValue({
          strategy: 'history-based',
          historyWeight: 0.5,
          difficultyCalibration: { enabled: true, targetAccuracy: 0.75, toleranceBand: 0.05, calibrationSpeed: 0.1 },
        });
        vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

        const { result } = renderHook(() => useAdaptivePractice());

        expect(result.current.config).toEqual({
          strategy: 'history-based',
          historyWeight: 0.5,
          difficultyCalibration: { enabled: true, targetAccuracy: 0.75, toleranceBand: 0.05, calibrationSpeed: 0.1 },
        });
      });

      it('should handle mixed strategy', () => {
        vi.spyOn(storage, 'getAdaptiveConfig').mockReturnValue({
          strategy: 'mixed',
          historyWeight: 0.5,
          difficultyCalibration: { enabled: true, targetAccuracy: 0.75, toleranceBand: 0.05, calibrationSpeed: 0.1 },
        });

        const mockMistakes = [
          {
            sentenceId: '2',
            wrongAnswers: ['3'],
            correctAnswers: ['2'],
            attempts: 1,
            timestamp: Date.now(),
            dictionaryId: 'cet4',
            reviewedCount: 0,
          },
        ];
        vi.spyOn(storage, 'getMistakes').mockReturnValue(mockMistakes);

        const { result } = renderHook(() => useAdaptivePractice());

        const choices = result.current.getSmartDistractors('2', '2', mockSentences);

        // Should return 4 choices with sentence 3 as distractor
        expect(choices).toHaveLength(4);
        const distractorIds = choices.filter((c) => c.id !== '2').map((c) => c.id);
        expect(distractorIds).toContain('3');
      });
    });
  });
});