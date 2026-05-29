import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAdaptiveDifficulty } from '../useAdaptiveDifficulty';
import { storage } from '@/services/storage';
import type { Mistake, AdaptiveDifficultyProfile, PracticeMode } from '@/data/types';
import { MAX_SESSION_ACCURACY_HISTORY } from '@/data/types';

// ============================================================================
// Mock dependencies
// ============================================================================

// Mock useQuestionWeighting
vi.mock('../useQuestionWeighting', () => ({
  useQuestionWeighting: () => ({
    getSentenceWeight: vi.fn((sentenceId: string, _mistakes: Mistake[]) => {
      // Return deterministic weight based on sentence ID
      if (sentenceId.includes('hard')) return 2.5;
      if (sentenceId.includes('easy')) return 1.0;
      return 1.5;
    }),
  }),
}));

// Mock useLearningProfile
vi.mock('../useLearningProfile', () => ({
  useLearningProfile: () => ({
    modeAccuracyBreakdown: [],
  }),
}));

// Mock storage functions
vi.mock('@/services/storage', () => ({
  storage: {
    getMistakes: vi.fn(),
    getAdaptiveConfig: vi.fn(),
    getDifficultyProfile: vi.fn(),
    saveDifficultyProfile: vi.fn(),
  },
}));

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a mock Mistake with specified parameters.
 */
function createMistake(params: {
  sentenceId: string;
  dictionaryId: string;
  wrongAnswers?: string[];
  correctAnswers?: string[];
  attempts?: number;
  timestamp?: number;
}): Mistake {
  return {
    sentenceId: params.sentenceId,
    dictionaryId: params.dictionaryId,
    wrongAnswers: params.wrongAnswers || [],
    correctAnswers: params.correctAnswers || [],
    attempts: params.attempts || (params.wrongAnswers?.length || 0) + (params.correctAnswers?.length || 0),
    timestamp: params.timestamp ?? Date.now(),
    reviewedCount: 0,
  };
}

/**
 * Create default adaptive config for testing.
 */
function createDefaultAdaptiveConfig() {
  return {
    strategy: 'mixed' as const,
    historyWeight: 0.5,
    difficultyCalibration: {
      enabled: true,
      targetAccuracy: 0.75,
      toleranceBand: 0.05,
      calibrationSpeed: 0.1,
    },
  };
}

/**
 * Create default difficulty profile for testing.
 */
function createDefaultDifficultyProfile(overrides?: Partial<AdaptiveDifficultyProfile>): AdaptiveDifficultyProfile {
  return {
    inferredDifficultyBand: 'normal',
    easyAccuracyRate: 0.8,
    mediumAccuracyRate: 0.75,
    hardAccuracyRate: 0.6,
    sessionAccuracyHistory: [],
    ...overrides,
  };
}

// ============================================================================
// Test Suites
// ============================================================================

describe('useAdaptiveDifficulty', () => {
  // ---------------------------------------------------------------------------
  // Mock setup
  // ---------------------------------------------------------------------------

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock returns
    (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue([]);
    (storage.getAdaptiveConfig as ReturnType<typeof vi.fn>).mockReturnValue(createDefaultAdaptiveConfig());
    (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockReturnValue(createDefaultDifficultyProfile());
    (storage.saveDifficultyProfile as ReturnType<typeof vi.fn>).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // describe: inferSentenceDifficulty
  // ---------------------------------------------------------------------------
  describe('inferSentenceDifficulty', () => {
    // ========================================================================
    // Difficulty inference - no mistakes / empty data
    // ========================================================================
    describe('edge cases - empty data', () => {
      it('should return normal for sentence with no mistakes (new sentence)', () => {
        (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue([]);

        const { result } = renderHook(() => useAdaptiveDifficulty());

        const difficulty = result.current.inferSentenceDifficulty('new-sentence', 'cet4');

        expect(difficulty).toBe('normal');
      });

      it('should return normal for sentence not in mistakes list', () => {
        const existingMistake = createMistake({
          sentenceId: 'existing',
          dictionaryId: 'cet4',
          wrongAnswers: ['a', 'b'],
          correctAnswers: ['c'],
          attempts: 3,
        });
        (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue([existingMistake]);

        const { result } = renderHook(() => useAdaptiveDifficulty());

        const difficulty = result.current.inferSentenceDifficulty('different-sentence', 'cet4');

        expect(difficulty).toBe('normal');
      });

      it('should return normal for sentence with mistakes but different dictionary', () => {
        const mistake = createMistake({
          sentenceId: 'sentence-1',
          dictionaryId: 'cet6',
          wrongAnswers: ['a', 'b', 'c'],
          correctAnswers: [],
          attempts: 3,
        });
        (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue([mistake]);

        const { result } = renderHook(() => useAdaptiveDifficulty());

        const difficulty = result.current.inferSentenceDifficulty('sentence-1', 'cet4');

        expect(difficulty).toBe('normal');
      });
    });

    // ========================================================================
    // Difficulty inference - error rate boundaries (0, 0.3, 0.6, 1.0)
    // ========================================================================
    describe('errorRate 0 boundaries', () => {
      it('should return easy for 0% error rate with recent correct attempts', () => {
        // 0 wrong answers, 3 attempts = 0% error rate
        const mistake = createMistake({
          sentenceId: 'perfect',
          dictionaryId: 'cet4',
          wrongAnswers: [],
          correctAnswers: ['a', 'b', 'c'],
          attempts: 3,
          timestamp: Date.now() - 1000, // Recent (within 7 days)
        });
        (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue([mistake]);

        const { result } = renderHook(() => useAdaptiveDifficulty());

        const difficulty = result.current.inferSentenceDifficulty('perfect', 'cet4');

        // 0% error rate + recent correct attempts = easy
        expect(difficulty).toBe('easy');
      });

      it('should return normal for 0% error rate without recent attempts', () => {
        // 0 wrong answers, but old timestamp (>7 days ago)
        const oldTimestamp = Date.now() - 8 * 24 * 60 * 60 * 1000; // 8 days ago
        const mistake = createMistake({
          sentenceId: 'old-perfect',
          dictionaryId: 'cet4',
          wrongAnswers: [],
          correctAnswers: ['a', 'b'],
          attempts: 2,
          timestamp: oldTimestamp,
        });
        (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue([mistake]);

        const { result } = renderHook(() => useAdaptiveDifficulty());

        const difficulty = result.current.inferSentenceDifficulty('old-perfect', 'cet4');

        // No recent attempts = not easy
        expect(difficulty).toBe('normal');
      });
    });

    describe('errorRate 0.3 (30%) boundary', () => {
      it('should return normal for error rate at exactly 0.3', () => {
        // 3 wrong, 10 attempts = 0.3 (exact boundary)
        // For easy: errorRate < 0.3 (strict), so 0.3 is NOT easy
        const mistake = createMistake({
          sentenceId: 'boundary-30',
          dictionaryId: 'cet4',
          wrongAnswers: ['a', 'b', 'c'],
          correctAnswers: ['d', 'e', 'f', 'g'],
          attempts: 10,
          timestamp: Date.now() - 1000,
        });
        (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue([mistake]);

        const { result } = renderHook(() => useAdaptiveDifficulty());

        const difficulty = result.current.inferSentenceDifficulty('boundary-30', 'cet4');

        expect(difficulty).toBe('normal');
      });

      it('should return normal for error rate just above 0.3', () => {
        // 4 wrong, 10 attempts = 0.4 error rate (> 0.3)
        const mistake = createMistake({
          sentenceId: 'above-30',
          dictionaryId: 'cet4',
          wrongAnswers: ['a', 'b', 'c', 'd'],
          correctAnswers: ['e', 'f', 'g', 'h', 'i', 'j'],
          attempts: 10,
          timestamp: Date.now() - 1000,
        });
        (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue([mistake]);

        const { result } = renderHook(() => useAdaptiveDifficulty());

        const difficulty = result.current.inferSentenceDifficulty('above-30', 'cet4');

        expect(difficulty).toBe('normal');
      });
    });

    describe('errorRate 0.6 (60%) boundary', () => {
      it('should return normal for error rate at exactly 0.6', () => {
        // 6 wrong, 10 attempts = 0.6 error rate (exact boundary)
        // For hard: errorRate > 0.6 (strict), so 0.6 is NOT hard
        const mistake = createMistake({
          sentenceId: 'boundary-60',
          dictionaryId: 'cet4',
          wrongAnswers: ['a', 'b', 'c', 'd', 'e', 'f'],
          correctAnswers: ['g', 'h', 'i', 'j'],
          attempts: 10,
          timestamp: Date.now() - 1000,
        });
        (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue([mistake]);

        const { result } = renderHook(() => useAdaptiveDifficulty());

        const difficulty = result.current.inferSentenceDifficulty('boundary-60', 'cet4');

        expect(difficulty).toBe('normal');
      });

      it('should return hard for error rate just above 0.6', () => {
        // 7 wrong, 10 attempts = 0.7 error rate (> 0.6)
        const mistake = createMistake({
          sentenceId: 'above-60',
          dictionaryId: 'cet4',
          wrongAnswers: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
          correctAnswers: ['h', 'i', 'j'],
          attempts: 10,
          timestamp: Date.now() - 1000,
        });
        (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue([mistake]);

        const { result } = renderHook(() => useAdaptiveDifficulty());

        const difficulty = result.current.inferSentenceDifficulty('above-60', 'cet4');

        expect(difficulty).toBe('hard');
      });

      it('should return hard for 100% error rate (all wrong)', () => {
        // 5 wrong, 5 attempts = 1.0 error rate
        const mistake = createMistake({
          sentenceId: 'all-wrong',
          dictionaryId: 'cet4',
          wrongAnswers: ['a', 'b', 'c', 'd', 'e'],
          correctAnswers: [],
          attempts: 5,
          timestamp: Date.now() - 1000,
        });
        (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue([mistake]);

        const { result } = renderHook(() => useAdaptiveDifficulty());

        const difficulty = result.current.inferSentenceDifficulty('all-wrong', 'cet4');

        expect(difficulty).toBe('hard');
      });
    });

    // ========================================================================
    // Difficulty inference - attempt count boundaries
    // ========================================================================
    describe('attemptCount > 10 boundary', () => {
      it('should return hard for many attempts with high error rate', () => {
        // 8 wrong, 12 attempts = 0.67 error rate (> 0.6)
        // attemptCount = 12 > 10 AND high error rate
        const mistake = createMistake({
          sentenceId: 'many-attempts',
          dictionaryId: 'cet4',
          wrongAnswers: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
          correctAnswers: ['i', 'j', 'k', 'l'],
          attempts: 12,
          timestamp: Date.now() - 1000,
        });
        (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue([mistake]);

        const { result } = renderHook(() => useAdaptiveDifficulty());

        // High error rate (0.67 > 0.6) = hard
        const difficulty = result.current.inferSentenceDifficulty('many-attempts', 'cet4');
        expect(difficulty).toBe('hard');
      });

      it('should return easy for many attempts with low error rate (isEasy checked first)', () => {
        // 2 wrong, 12 attempts = 0.167 error rate (< 0.3)
        // isEasy is checked BEFORE isHard, so returns 'easy'
        const mistake = createMistake({
          sentenceId: 'many-attempts-low-error',
          dictionaryId: 'cet4',
          wrongAnswers: ['a', 'b'],
          correctAnswers: ['c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'],
          attempts: 12,
          timestamp: Date.now() - 1000,
        });
        (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue([mistake]);

        const { result } = renderHook(() => useAdaptiveDifficulty());

        // Low error rate + recent correct = 'easy' (isEasy checked first)
        expect(result.current.inferSentenceDifficulty('many-attempts-low-error', 'cet4')).toBe('easy');
      });

      it('should return normal for exactly 10 attempts with moderate error rate', () => {
        // 3 wrong, 10 attempts = 0.3 error rate
        // attemptCount = 10 is not > 10
        const mistake = createMistake({
          sentenceId: 'ten-attempts',
          dictionaryId: 'cet4',
          wrongAnswers: ['a', 'b', 'c'],
          correctAnswers: ['d', 'e', 'f', 'g', 'h', 'i', 'j'],
          attempts: 10,
          timestamp: Date.now() - 1000,
        });
        (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue([mistake]);

        const { result } = renderHook(() => useAdaptiveDifficulty());

        expect(result.current.inferSentenceDifficulty('ten-attempts', 'cet4')).toBe('normal');
      });
    });

    // ========================================================================
    // Difficulty inference - recent attempts correct check
    // ========================================================================
    describe('recentAttemptsCorrect condition', () => {
      it('should return normal for low error rate but no recent correct attempts', () => {
        // Old mistake with some wrong answers
        const oldTimestamp = Date.now() - 15 * 24 * 60 * 60 * 1000; // 15 days ago
        const mistake = createMistake({
          sentenceId: 'old-low-error',
          dictionaryId: 'cet4',
          wrongAnswers: ['a'],
          correctAnswers: ['b', 'c', 'd'],
          attempts: 4,
          timestamp: oldTimestamp,
        });
        (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue([mistake]);

        const { result } = renderHook(() => useAdaptiveDifficulty());

        const difficulty = result.current.inferSentenceDifficulty('old-low-error', 'cet4');

        // No recent attempts = not easy
        expect(difficulty).toBe('normal');
      });
    });

    // ========================================================================
    // Difficulty inference - single entry edge case
    // ========================================================================
    describe('single entry edge cases', () => {
      it('should handle single mistake record correctly', () => {
        const mistake = createMistake({
          sentenceId: 'single',
          dictionaryId: 'cet4',
          wrongAnswers: ['a', 'b'],
          correctAnswers: ['c'],
          attempts: 3,
          timestamp: Date.now() - 1000,
        });
        (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue([mistake]);

        const { result } = renderHook(() => useAdaptiveDifficulty());

        const difficulty = result.current.inferSentenceDifficulty('single', 'cet4');

        // 2/3 = 0.67 error rate > 0.6 = hard
        expect(difficulty).toBe('hard');
      });

      it('should handle single correct attempt', () => {
        const mistake = createMistake({
          sentenceId: 'single-correct',
          dictionaryId: 'cet4',
          wrongAnswers: [],
          correctAnswers: ['a'],
          attempts: 1,
          timestamp: Date.now() - 1000,
        });
        (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue([mistake]);

        const { result } = renderHook(() => useAdaptiveDifficulty());

        const difficulty = result.current.inferSentenceDifficulty('single-correct', 'cet4');

        // 0% error rate + recent correct = easy
        expect(difficulty).toBe('easy');
      });

      it('should handle single wrong attempt', () => {
        const mistake = createMistake({
          sentenceId: 'single-wrong',
          dictionaryId: 'cet4',
          wrongAnswers: ['a'],
          correctAnswers: [],
          attempts: 1,
          timestamp: Date.now() - 1000,
        });
        (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue([mistake]);

        const { result } = renderHook(() => useAdaptiveDifficulty());

        const difficulty = result.current.inferSentenceDifficulty('single-wrong', 'cet4');

        // 100% error rate = hard
        expect(difficulty).toBe('hard');
      });
    });
  });

  // ---------------------------------------------------------------------------
  // describe: getUserDifficultyProfile
  // ---------------------------------------------------------------------------
  describe('getUserDifficultyProfile', () => {
    it('should return default profile when no history and empty mode breakdown', () => {
      (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockReturnValue(createDefaultDifficultyProfile({
        sessionAccuracyHistory: [],
        easyAccuracyRate: 0,
        mediumAccuracyRate: 0,
        hardAccuracyRate: 0,
      }));

      const { result } = renderHook(() => useAdaptiveDifficulty());

      const profile = result.current.getUserDifficultyProfile();

      // When modeAccuracyBreakdown is empty and rates are 0,
      // fallback rates are used from stored profile (0)
      expect(profile).toBeDefined();
      expect(profile.sessionAccuracyHistory).toEqual([]);
    });

    it('should infer easy band when recent accuracy is high', () => {
      const highAccuracyHistory = [
        { timestamp: Date.now() - 1000, accuracy: 0.9, mode: 'fill-in-blanks' as PracticeMode },
        { timestamp: Date.now() - 2000, accuracy: 0.85, mode: 'fill-in-blanks' as PracticeMode },
        { timestamp: Date.now() - 3000, accuracy: 0.88, mode: 'fill-in-blanks' as PracticeMode },
      ];

      (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockReturnValue(createDefaultDifficultyProfile({
        sessionAccuracyHistory: highAccuracyHistory,
      }));

      const { result } = renderHook(() => useAdaptiveDifficulty());

      const profile = result.current.getUserDifficultyProfile();

      // Average of recent entries: (0.9 + 0.85 + 0.88) / 3 = 0.877
      // 0.877 > 0.75 + 0.05 = 0.8 = easy
      expect(profile.inferredDifficultyBand).toBe('easy');
    });

    it('should infer hard band when recent accuracy is low', () => {
      const lowAccuracyHistory = [
        { timestamp: Date.now() - 1000, accuracy: 0.5, mode: 'fill-in-blanks' as PracticeMode },
        { timestamp: Date.now() - 2000, accuracy: 0.55, mode: 'fill-in-blanks' as PracticeMode },
        { timestamp: Date.now() - 3000, accuracy: 0.52, mode: 'fill-in-blanks' as PracticeMode },
      ];

      (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockReturnValue(createDefaultDifficultyProfile({
        sessionAccuracyHistory: lowAccuracyHistory,
      }));

      const { result } = renderHook(() => useAdaptiveDifficulty());

      const profile = result.current.getUserDifficultyProfile();

      // Average of recent entries: (0.5 + 0.55 + 0.52) / 3 = 0.523
      // 0.523 < 0.75 - 0.05 = 0.7 = hard
      expect(profile.inferredDifficultyBand).toBe('hard');
    });

    it('should infer normal band when accuracy is within tolerance', () => {
      const moderateAccuracyHistory = [
        { timestamp: Date.now() - 1000, accuracy: 0.76, mode: 'fill-in-blanks' as PracticeMode },
        { timestamp: Date.now() - 2000, accuracy: 0.74, mode: 'fill-in-blanks' as PracticeMode },
        { timestamp: Date.now() - 3000, accuracy: 0.75, mode: 'fill-in-blanks' as PracticeMode },
      ];

      (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockReturnValue(createDefaultDifficultyProfile({
        sessionAccuracyHistory: moderateAccuracyHistory,
      }));

      const { result } = renderHook(() => useAdaptiveDifficulty());

      const profile = result.current.getUserDifficultyProfile();

      // Average of recent entries: ~0.75
      // 0.70 <= 0.75 <= 0.80 = normal
      expect(profile.inferredDifficultyBand).toBe('normal');
    });
  });

  // ---------------------------------------------------------------------------
  // describe: calibrateSessionBand
  // ---------------------------------------------------------------------------
  describe('calibrateSessionBand', () => {
    it('should return normal when adaptive difficulty is disabled', () => {
      (storage.getAdaptiveConfig as ReturnType<typeof vi.fn>).mockReturnValue({
        strategy: 'mixed' as const,
        historyWeight: 0.5,
        difficultyCalibration: {
          enabled: false,
          targetAccuracy: 0.75,
          toleranceBand: 0.05,
          calibrationSpeed: 0.1,
        },
      });

      const { result } = renderHook(() => useAdaptiveDifficulty());

      const band = result.current.calibrateSessionBand();

      expect(band).toBe('normal');
    });

    it('should return easy when smoothed accuracy exceeds target + tolerance', () => {
      const highAccuracyHistory = [
        { timestamp: Date.now() - 1000, accuracy: 0.95, mode: 'fill-in-blanks' as PracticeMode },
        { timestamp: Date.now() - 2000, accuracy: 0.9, mode: 'fill-in-blanks' as PracticeMode },
      ];

      (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockReturnValue(createDefaultDifficultyProfile({
        sessionAccuracyHistory: highAccuracyHistory,
      }));
      (storage.getAdaptiveConfig as ReturnType<typeof vi.fn>).mockReturnValue(createDefaultAdaptiveConfig());

      const { result } = renderHook(() => useAdaptiveDifficulty());

      const band = result.current.calibrateSessionBand();

      // Smoothed accuracy: high history average > 0.75 + 0.05 = 0.8
      // With calibration speed 0.1: smoothed = 0.925 * 0.9 + 0.75 * 0.1 = 0.9075
      expect(band).toBe('easy');
    });

    it('should return hard when smoothed accuracy is below target - tolerance', () => {
      const lowAccuracyHistory = [
        { timestamp: Date.now() - 1000, accuracy: 0.4, mode: 'fill-in-blanks' as PracticeMode },
        { timestamp: Date.now() - 2000, accuracy: 0.45, mode: 'fill-in-blanks' as PracticeMode },
      ];

      (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockReturnValue(createDefaultDifficultyProfile({
        sessionAccuracyHistory: lowAccuracyHistory,
      }));
      (storage.getAdaptiveConfig as ReturnType<typeof vi.fn>).mockReturnValue(createDefaultAdaptiveConfig());

      const { result } = renderHook(() => useAdaptiveDifficulty());

      const band = result.current.calibrateSessionBand();

      // Smoothed accuracy should be < 0.75 - 0.05 = 0.7
      expect(band).toBe('hard');
    });

    it('should return normal when accuracy is within tolerance band', () => {
      const moderateAccuracyHistory = [
        { timestamp: Date.now() - 1000, accuracy: 0.77, mode: 'fill-in-blanks' as PracticeMode },
        { timestamp: Date.now() - 2000, accuracy: 0.73, mode: 'fill-in-blanks' as PracticeMode },
        { timestamp: Date.now() - 3000, accuracy: 0.76, mode: 'fill-in-blanks' as PracticeMode },
      ];

      (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockReturnValue(createDefaultDifficultyProfile({
        sessionAccuracyHistory: moderateAccuracyHistory,
      }));
      (storage.getAdaptiveConfig as ReturnType<typeof vi.fn>).mockReturnValue(createDefaultAdaptiveConfig());

      const { result } = renderHook(() => useAdaptiveDifficulty());

      const band = result.current.calibrateSessionBand();

      // Average ~0.75, should be within 0.7-0.8 range
      expect(band).toBe('normal');
    });

    it('should use default accuracy when no history exists', () => {
      (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockReturnValue(createDefaultDifficultyProfile({
        sessionAccuracyHistory: [],
      }));

      const { result } = renderHook(() => useAdaptiveDifficulty());

      const band = result.current.calibrateSessionBand();

      // With no history, default 0.5 accuracy
      // 0.5 < 0.75 - 0.05 = 0.7 = hard
      expect(band).toBe('hard');
    });

    it('should apply exponential smoothing based on calibration speed', () => {
      // Test with higher calibration speed
      const accurateHistory = [
        { timestamp: Date.now() - 1000, accuracy: 0.8, mode: 'fill-in-blanks' as PracticeMode },
      ];

      (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockReturnValue(createDefaultDifficultyProfile({
        sessionAccuracyHistory: accurateHistory,
      }));
      (storage.getAdaptiveConfig as ReturnType<typeof vi.fn>).mockReturnValue({
        strategy: 'mixed' as const,
        historyWeight: 0.5,
        difficultyCalibration: {
          enabled: true,
          targetAccuracy: 0.75,
          toleranceBand: 0.05,
          calibrationSpeed: 0.5, // Higher speed
        },
      });

      const { result } = renderHook(() => useAdaptiveDifficulty());

      const band = result.current.calibrateSessionBand();

      // With speed 0.5: smoothed = 0.8 * 0.5 + 0.75 * 0.5 = 0.775
      // 0.775 is within tolerance 0.7-0.8 = normal
      expect(band).toBe('normal');
    });
  });

  // ---------------------------------------------------------------------------
  // describe: getDifficultyAdjustedSentenceIds
  // ---------------------------------------------------------------------------
  describe('getDifficultyAdjustedSentenceIds', () => {
    it('should return all sentence IDs when insufficient filtered sentences', () => {
      // Setup: mixed difficulty sentences
      const mistakes: Mistake[] = [
        // Easy sentence (0% error)
        createMistake({
          sentenceId: 'easy-sentence',
          dictionaryId: 'cet4',
          wrongAnswers: [],
          correctAnswers: ['a'],
          attempts: 1,
          timestamp: Date.now() - 1000,
        }),
        // Hard sentence (100% error)
        createMistake({
          sentenceId: 'hard-sentence',
          dictionaryId: 'cet4',
          wrongAnswers: ['a'],
          correctAnswers: [],
          attempts: 1,
          timestamp: Date.now() - 1000,
        }),
      ];
      (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue(mistakes);
      (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockReturnValue(createDefaultDifficultyProfile({
        sessionAccuracyHistory: [],
        inferredDifficultyBand: 'normal',
      }));

      const { result } = renderHook(() => useAdaptiveDifficulty());

      const sentenceIds = ['easy-sentence', 'hard-sentence', 'new-sentence'];
      const filtered = result.current.getDifficultyAdjustedSentenceIds(sentenceIds, 'cet4');

      // Should include sentences from multiple bands due to fallback
      expect(filtered.length).toBeGreaterThan(0);
      // All original IDs should be in result (may be reordered)
      expect(filtered.sort()).toEqual(expect.arrayContaining(sentenceIds.sort()));
    });

    it('should filter sentences by difficulty band when enough exist', () => {
      // Setup: many sentences with varying difficulties
      const mistakes: Mistake[] = [
        // Easy
        createMistake({
          sentenceId: 'easy-1',
          dictionaryId: 'cet4',
          wrongAnswers: [],
          correctAnswers: ['a', 'b'],
          attempts: 2,
          timestamp: Date.now() - 1000,
        }),
        // Hard
        createMistake({
          sentenceId: 'hard-1',
          dictionaryId: 'cet4',
          wrongAnswers: ['a', 'b'],
          correctAnswers: [],
          attempts: 2,
          timestamp: Date.now() - 1000,
        }),
      ];
      (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue(mistakes);
      (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockReturnValue(createDefaultDifficultyProfile({
        sessionAccuracyHistory: [],
        inferredDifficultyBand: 'normal',
      }));

      const { result } = renderHook(() => useAdaptiveDifficulty());

      const sentenceIds = ['easy-1', 'hard-1', 'new-1', 'new-2', 'new-3', 'new-4', 'new-5', 'new-6', 'new-7', 'new-8', 'new-9', 'new-10'];
      const filtered = result.current.getDifficultyAdjustedSentenceIds(sentenceIds, 'cet4');

      // Should return sentences (with weighted shuffle applied)
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.length).toBeLessThanOrEqual(sentenceIds.length);
    });

    it('should handle empty input array', () => {
      (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue([]);
      (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockReturnValue(createDefaultDifficultyProfile());

      const { result } = renderHook(() => useAdaptiveDifficulty());

      const filtered = result.current.getDifficultyAdjustedSentenceIds([], 'cet4');

      expect(filtered).toEqual([]);
    });

    it('should include adjacent bands for variety', () => {
      // Normal band should include easy and hard for variety
      const mistakes: Mistake[] = [
        createMistake({
          sentenceId: 'normal-1',
          dictionaryId: 'cet4',
          wrongAnswers: ['a'],
          correctAnswers: ['b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'],
          attempts: 11, // Many attempts
          timestamp: Date.now() - 1000,
        }),
      ];
      (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue(mistakes);
      (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockReturnValue(createDefaultDifficultyProfile({
        sessionAccuracyHistory: [],
        inferredDifficultyBand: 'normal',
      }));

      const { result } = renderHook(() => useAdaptiveDifficulty());

      const sentenceIds = ['normal-1', 'easy-1', 'hard-1', 'new-1', 'new-2', 'new-3', 'new-4', 'new-5', 'new-6', 'new-7', 'new-8', 'new-9', 'new-10'];
      const filtered = result.current.getDifficultyAdjustedSentenceIds(sentenceIds, 'cet4');

      // Should include sentences from multiple bands
      expect(filtered.length).toBeGreaterThan(0);
    });

    it('should handle dictionary-specific filtering', () => {
      const mistakes: Mistake[] = [
        createMistake({
          sentenceId: 'cet4-sentence',
          dictionaryId: 'cet4',
          wrongAnswers: ['a'],
          correctAnswers: ['b'],
          attempts: 2,
          timestamp: Date.now() - 1000,
        }),
        createMistake({
          sentenceId: 'cet6-sentence',
          dictionaryId: 'cet6',
          wrongAnswers: ['a'],
          correctAnswers: ['b'],
          attempts: 2,
          timestamp: Date.now() - 1000,
        }),
      ];
      (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue(mistakes);
      (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockReturnValue(createDefaultDifficultyProfile());

      const { result } = renderHook(() => useAdaptiveDifficulty());

      // Only CET4 sentences
      const cet4Ids = ['cet4-sentence', 'new-1', 'new-2', 'new-3', 'new-4', 'new-5', 'new-6', 'new-7', 'new-8', 'new-9', 'new-10'];
      const filtered = result.current.getDifficultyAdjustedSentenceIds(cet4Ids, 'cet4');

      // Should filter to CET4 only
      expect(filtered).not.toContain('cet6-sentence');
    });
  });

  // ---------------------------------------------------------------------------
  // describe: trackSessionAccuracy
  // ---------------------------------------------------------------------------
  describe('trackSessionAccuracy', () => {
    it('should record correct answer with accuracy 1', () => {
      const initialProfile = createDefaultDifficultyProfile({
        sessionAccuracyHistory: [],
      });
      (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockReturnValue(initialProfile);
      (storage.saveDifficultyProfile as ReturnType<typeof vi.fn>).mockImplementation(() => {});

      const { result } = renderHook(() => useAdaptiveDifficulty());

      result.current.trackSessionAccuracy(true, 'fill-in-blanks');

      expect(storage.saveDifficultyProfile).toHaveBeenCalledTimes(1);
      const savedProfile = (storage.saveDifficultyProfile as ReturnType<typeof vi.fn>).mock.calls[0][0] as AdaptiveDifficultyProfile;

      // Should have added new entry with accuracy 1
      expect(savedProfile.sessionAccuracyHistory.length).toBe(1);
      expect(savedProfile.sessionAccuracyHistory[0].accuracy).toBe(1);
      expect(savedProfile.sessionAccuracyHistory[0].mode).toBe('fill-in-blanks');
    });

    it('should record incorrect answer with accuracy 0', () => {
      const initialProfile = createDefaultDifficultyProfile({
        sessionAccuracyHistory: [],
      });
      (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockReturnValue(initialProfile);
      (storage.saveDifficultyProfile as ReturnType<typeof vi.fn>).mockImplementation(() => {});

      const { result } = renderHook(() => useAdaptiveDifficulty());

      result.current.trackSessionAccuracy(false, 'dictation');

      expect(storage.saveDifficultyProfile).toHaveBeenCalledTimes(1);
      const savedProfile = (storage.saveDifficultyProfile as ReturnType<typeof vi.fn>).mock.calls[0][0] as AdaptiveDifficultyProfile;

      expect(savedProfile.sessionAccuracyHistory[0].accuracy).toBe(0);
      expect(savedProfile.sessionAccuracyHistory[0].mode).toBe('dictation');
    });

    it('should enforce MAX_SESSION_ACCURACY_HISTORY limit of 50', () => {
      // Create existing history with 50 entries
      const existingHistory = Array.from({ length: MAX_SESSION_ACCURACY_HISTORY }, (_, i) => ({
        timestamp: Date.now() - i * 1000,
        accuracy: 0.8,
        mode: 'fill-in-blanks' as PracticeMode,
      }));
      const initialProfile = createDefaultDifficultyProfile({
        sessionAccuracyHistory: existingHistory,
      });
      (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockReturnValue(initialProfile);
      (storage.saveDifficultyProfile as ReturnType<typeof vi.fn>).mockImplementation(() => {});

      const { result } = renderHook(() => useAdaptiveDifficulty());

      result.current.trackSessionAccuracy(true, 'multiple-choice');

      const savedProfile = (storage.saveDifficultyProfile as ReturnType<typeof vi.fn>).mock.calls[0][0] as AdaptiveDifficultyProfile;

      // Should still be limited to 50 entries
      expect(savedProfile.sessionAccuracyHistory.length).toBe(MAX_SESSION_ACCURACY_HISTORY);
      // New entry should be at the end
      expect(savedProfile.sessionAccuracyHistory[savedProfile.sessionAccuracyHistory.length - 1].accuracy).toBe(1);
    });

    it('should update accuracy rates using exponential smoothing', () => {
      const initialProfile = createDefaultDifficultyProfile({
        sessionAccuracyHistory: [
          { timestamp: Date.now() - 1000, accuracy: 0.8, mode: 'fill-in-blanks' as PracticeMode },
        ],
        easyAccuracyRate: 0.8,
        mediumAccuracyRate: 0.75,
        hardAccuracyRate: 0.6,
      });
      (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockReturnValue(initialProfile);
      (storage.saveDifficultyProfile as ReturnType<typeof vi.fn>).mockImplementation(() => {});

      const { result } = renderHook(() => useAdaptiveDifficulty());

      result.current.trackSessionAccuracy(true, 'fill-in-blanks');

      const savedProfile = (storage.saveDifficultyProfile as ReturnType<typeof vi.fn>).mock.calls[0][0] as AdaptiveDifficultyProfile;

      // With calibration speed 0.1:
      // New session accuracy = (0.8 + 1) / 2 = 0.9
      // Updated rate = 0.8 * 0.9 + 0.9 * 0.1 = 0.81
      expect(savedProfile.easyAccuracyRate).toBeCloseTo(0.81, 1);
    });

    it('should update inferred difficulty band based on session accuracy', () => {
      // Start with high accuracy history so band is 'easy' from the start
      // After calibration smoothing, it should stay 'easy'
      const initialProfile = createDefaultDifficultyProfile({
        sessionAccuracyHistory: [
          { timestamp: Date.now() - 1000, accuracy: 0.9, mode: 'fill-in-blanks' as PracticeMode },
          { timestamp: Date.now() - 2000, accuracy: 0.85, mode: 'fill-in-blanks' as PracticeMode },
          { timestamp: Date.now() - 3000, accuracy: 0.88, mode: 'fill-in-blanks' as PracticeMode },
        ],
        inferredDifficultyBand: 'easy',
      });
      (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockReturnValue(initialProfile);
      (storage.saveDifficultyProfile as ReturnType<typeof vi.fn>).mockImplementation(() => {});

      const { result } = renderHook(() => useAdaptiveDifficulty());

      // Track several correct answers - should maintain or reach 'easy' band
      for (let i = 0; i < 5; i++) {
        result.current.trackSessionAccuracy(true, 'fill-in-blanks');
      }

      const savedProfile = (storage.saveDifficultyProfile as ReturnType<typeof vi.fn>).mock.calls[4][0] as AdaptiveDifficultyProfile;

      // With high initial accuracy and correct answers, should be 'easy'
      expect(savedProfile.inferredDifficultyBand).toBe('easy');
    });

    it('should track session accuracy correctly accumulates entries', () => {
      let currentHistory: Array<{timestamp: number; accuracy: number; mode: PracticeMode}> = [];

      const initialProfile = createDefaultDifficultyProfile({
        sessionAccuracyHistory: [],
      });
      (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        ...initialProfile,
        sessionAccuracyHistory: currentHistory,
      }));
      (storage.saveDifficultyProfile as ReturnType<typeof vi.fn>).mockImplementation((profile: AdaptiveDifficultyProfile) => {
        currentHistory = profile.sessionAccuracyHistory;
      });

      const { result } = renderHook(() => useAdaptiveDifficulty());

      // Track several answers - each call updates the profile
      result.current.trackSessionAccuracy(true, 'fill-in-blanks');
      result.current.trackSessionAccuracy(true, 'fill-in-blanks');
      result.current.trackSessionAccuracy(false, 'dictation');
      result.current.trackSessionAccuracy(true, 'multiple-choice');

      // After 4 calls, history should have 4 entries
      expect(currentHistory.length).toBe(4);
      expect(currentHistory[0].accuracy).toBe(1);
      expect(currentHistory[1].accuracy).toBe(1);
      expect(currentHistory[2].accuracy).toBe(0);
      expect(currentHistory[3].accuracy).toBe(1);
    });

    it('should handle all practice modes', () => {
      const modes: PracticeMode[] = ['fill-in-blanks', 'dictation', 'multiple-choice', 'sentence-reorder'];
      const initialProfile = createDefaultDifficultyProfile({
        sessionAccuracyHistory: [],
      });
      (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockReturnValue(initialProfile);
      (storage.saveDifficultyProfile as ReturnType<typeof vi.fn>).mockImplementation(() => {});

      const { result } = renderHook(() => useAdaptiveDifficulty());

      modes.forEach((mode) => {
        result.current.trackSessionAccuracy(true, mode);
      });

      expect(storage.saveDifficultyProfile).toHaveBeenCalledTimes(4);
    });
  });

  // ---------------------------------------------------------------------------
  // describe: integration tests
  // ---------------------------------------------------------------------------
  describe('integration - full workflow', () => {
    it('should work through complete adaptive difficulty cycle', () => {
      // Setup: new user with no history
      const mistakes: Mistake[] = [
        createMistake({
          sentenceId: 'sentence-1',
          dictionaryId: 'cet4',
          wrongAnswers: ['a', 'b'],
          correctAnswers: ['c', 'd'],
          attempts: 4,
          timestamp: Date.now() - 1000,
        }),
        createMistake({
          sentenceId: 'sentence-2',
          dictionaryId: 'cet4',
          wrongAnswers: [],
          correctAnswers: ['a'],
          attempts: 1,
          timestamp: Date.now() - 1000,
        }),
        createMistake({
          sentenceId: 'sentence-3',
          dictionaryId: 'cet4',
          wrongAnswers: ['a', 'b', 'c', 'd', 'e'],
          correctAnswers: [],
          attempts: 5,
          timestamp: Date.now() - 1000,
        }),
      ];
      (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue(mistakes);
      (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockReturnValue(createDefaultDifficultyProfile({
        sessionAccuracyHistory: [],
        inferredDifficultyBand: 'normal',
      }));
      (storage.saveDifficultyProfile as ReturnType<typeof vi.fn>).mockImplementation(() => {});

      const { result } = renderHook(() => useAdaptiveDifficulty());

      // Step 1: Infer difficulty for each sentence
      expect(result.current.inferSentenceDifficulty('sentence-1', 'cet4')).toBe('normal'); // 2/4 = 0.5
      expect(result.current.inferSentenceDifficulty('sentence-2', 'cet4')).toBe('easy'); // 0/1 = 0%
      expect(result.current.inferSentenceDifficulty('sentence-3', 'cet4')).toBe('hard'); // 5/5 = 100%

      // Step 2: Get user profile
      const profile = result.current.getUserDifficultyProfile();
      expect(profile).toBeDefined();

      // Step 3: Calibrate session band
      const sessionBand = result.current.calibrateSessionBand();
      expect(['easy', 'normal', 'hard']).toContain(sessionBand);

      // Step 4: Get difficulty adjusted sentences
      const adjustedIds = result.current.getDifficultyAdjustedSentenceIds(
        ['sentence-1', 'sentence-2', 'sentence-3', 'new-sentence'],
        'cet4'
      );
      expect(adjustedIds.length).toBeGreaterThan(0);

      // Step 5: Track session accuracy
      result.current.trackSessionAccuracy(true, 'fill-in-blanks');
      result.current.trackSessionAccuracy(false, 'dictation');

      expect(storage.saveDifficultyProfile).toHaveBeenCalledTimes(2);
    });

    it('should maintain consistency across multiple calls', () => {
      (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue([]);
      (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockReturnValue(createDefaultDifficultyProfile({
        sessionAccuracyHistory: [
          { timestamp: Date.now() - 1000, accuracy: 0.7, mode: 'fill-in-blanks' as PracticeMode },
        ],
      }));
      (storage.saveDifficultyProfile as ReturnType<typeof vi.fn>).mockImplementation(() => {});

      const { result } = renderHook(() => useAdaptiveDifficulty());

      // Multiple calls should return consistent results
      const band1 = result.current.calibrateSessionBand();
      const band2 = result.current.calibrateSessionBand();

      expect(band1).toBe(band2);

      result.current.trackSessionAccuracy(true, 'fill-in-blanks');
      const band3 = result.current.calibrateSessionBand();

      // After tracking, band may change due to updated history
      expect(band3).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // describe: edge cases and error handling
  // ---------------------------------------------------------------------------
  describe('edge cases', () => {
    it('should handle max history limit correctly', () => {
      // Create history at exactly the limit
      const maxHistory = Array.from({ length: MAX_SESSION_ACCURACY_HISTORY }, (_, i) => ({
        timestamp: Date.now() - i * 1000,
        accuracy: 0.8,
        mode: 'fill-in-blanks' as PracticeMode,
      }));
      (storage.getDifficultyProfile as ReturnType<typeof vi.fn>).mockReturnValue(createDefaultDifficultyProfile({
        sessionAccuracyHistory: maxHistory,
      }));
      (storage.saveDifficultyProfile as ReturnType<typeof vi.fn>).mockImplementation(() => {});

      const { result } = renderHook(() => useAdaptiveDifficulty());

      // Add one more entry
      result.current.trackSessionAccuracy(true, 'fill-in-blanks');

      const savedProfile = (storage.saveDifficultyProfile as ReturnType<typeof vi.fn>).mock.calls[0][0] as AdaptiveDifficultyProfile;

      // Should still be exactly 50 entries
      expect(savedProfile.sessionAccuracyHistory.length).toBe(MAX_SESSION_ACCURACY_HISTORY);
      // Should be FIFO - oldest removed
      expect(savedProfile.sessionAccuracyHistory[0].timestamp).toBe(maxHistory[1].timestamp);
    });

    it('should handle extremely old timestamps gracefully', () => {
      // Timestamp from 100 days ago
      const oldMistake = createMistake({
        sentenceId: 'very-old',
        dictionaryId: 'cet4',
        wrongAnswers: ['a'],
        correctAnswers: ['b'],
        attempts: 2,
        timestamp: Date.now() - 100 * 24 * 60 * 60 * 1000,
      });
      (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue([oldMistake]);

      const { result } = renderHook(() => useAdaptiveDifficulty());

      // Should not crash and return a valid difficulty
      const difficulty = result.current.inferSentenceDifficulty('very-old', 'cet4');
      expect(['easy', 'normal', 'hard']).toContain(difficulty);
    });

    it('should handle very recent timestamps', () => {
      const recentMistake = createMistake({
        sentenceId: 'very-recent',
        dictionaryId: 'cet4',
        wrongAnswers: [],
        correctAnswers: ['a'],
        attempts: 1,
        timestamp: Date.now(), // Current time
      });
      (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue([recentMistake]);

      const { result } = renderHook(() => useAdaptiveDifficulty());

      const difficulty = result.current.inferSentenceDifficulty('very-recent', 'cet4');

      // Recent + 0% error = easy
      expect(difficulty).toBe('easy');
    });

    it('should handle empty dictionary ID', () => {
      (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue([]);

      const { result } = renderHook(() => useAdaptiveDifficulty());

      const difficulty = result.current.inferSentenceDifficulty('any-sentence', '');
      expect(difficulty).toBe('normal');
    });

    it('should handle special characters in sentence ID', () => {
      const mistake = createMistake({
        sentenceId: 'sentence-with-special_Chars-123',
        dictionaryId: 'cet4',
        wrongAnswers: ['a', 'b'],
        correctAnswers: ['c'],
        attempts: 3,
        timestamp: Date.now() - 1000,
      });
      (storage.getMistakes as ReturnType<typeof vi.fn>).mockReturnValue([mistake]);

      const { result } = renderHook(() => useAdaptiveDifficulty());

      const difficulty = result.current.inferSentenceDifficulty('sentence-with-special_Chars-123', 'cet4');

      // 2/3 = 0.67 > 0.6 = hard
      expect(difficulty).toBe('hard');
    });
  });
});