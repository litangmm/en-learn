import type { SentenceDifficultyLevel, AdaptiveDifficultyProfile, PracticeMode, Mistake } from '@/data/types';
import { MAX_SESSION_ACCURACY_HISTORY } from '@/data/types';
import { storage } from '@/services/storage';
import { useQuestionWeighting } from './useQuestionWeighting';
import { useLearningProfile } from './useLearningProfile';

// ---------------------------------------------------------------------------
// Hook Implementation
// ---------------------------------------------------------------------------
const ERROR_RATE_THRESHOLD_EASY = 0.3;   // < 30% error rate = easy
const ERROR_RATE_THRESHOLD_HARD = 0.6;   // > 60% error rate = hard

/** Time thresholds in milliseconds */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;     // 7 days = recent
const THIRTY_DAYS_MS = 30 * ONE_DAY_MS;   // 30 days = very old

/** Default target accuracy and tolerance band for calibration */
const DEFAULT_TARGET_ACCURACY = 0.75;
const DEFAULT_TOLERANCE_BAND = 0.05;

/**
 * Sentence difficulty classification based on three dimensions:
 * - errorRate: percentage of wrong answers (40% weight)
 * - attemptCount: number of attempts (30% weight)
 * - timeSinceLastAttempt: how recently it was practiced (30% weight)
 */
interface SentenceDifficultyDimensions {
  errorRate: number;
  attemptCount: number;
  timeSinceLastAttempt: number;
  recentAttemptsCorrect: boolean;
}

// ---------------------------------------------------------------------------
// Hook Implementation
// ---------------------------------------------------------------------------

/**
 * Hook providing adaptive difficulty calibration functionality.
 *
 * Features:
 * 1. inferSentenceDifficulty - Derives sentence difficulty from Mistake records
 * 2. getUserDifficultyProfile - User ability profile from storage
 * 3. calibrateSessionBand - Calculates target difficulty band for current session
 * 4. getDifficultyAdjustedSentenceIds - Filters sentences by difficulty band
 * 5. trackSessionAccuracy - Records session accuracy for calibration
 *
 * Integrates with:
 * - useQuestionWeighting (for weighted shuffle)
 * - useLearningProfile (for modeAccuracyBreakdown)
 * - storage (for AdaptiveDifficultyProfile persistence)
 */
export function useAdaptiveDifficulty() {
  // Get question weighting for weighted shuffle
  const { getSentenceWeight } = useQuestionWeighting();

  // Get mode accuracy breakdown from learning profile
  const learningProfile = useLearningProfile();

  // ---------------------------------------------------------------------------
  // inferSentenceDifficulty
  // ---------------------------------------------------------------------------

  /**
   * Derives sentence difficulty from Mistake records using three dimensions:
   * - errorRate (40% weight): percentage of wrong answers
   * - attemptCount (30% weight): number of attempts made
   * - timeSinceLastAttempt (30% weight): how recently it was practiced
   *
   * Returns:
   * - 'easy': errorRate < 0.3 and recent attempts correct
   * - 'hard': errorRate > 0.6 or many wrong attempts
   * - 'normal': otherwise
   *
   * @param sentenceId - The sentence ID to infer difficulty for
   * @param dictionaryId - The dictionary ID (for dictionary-specific filtering)
   * @returns The inferred difficulty level for this sentence
   */
  function inferSentenceDifficulty(sentenceId: string, dictionaryId: string): SentenceDifficultyLevel {
    // Load mistakes for this dictionary
    const allMistakes = storage.getMistakes();
    const mistakes = allMistakes.filter(
      (m) => m.sentenceId === sentenceId && m.dictionaryId === dictionaryId
    );

    // No mistakes = new sentence, default to normal
    if (mistakes.length === 0) {
      return 'normal';
    }

    // Calculate difficulty dimensions
    const dimensions = calculateDifficultyDimensions(mistakes);

    // Determine difficulty level based on score and conditions
    if (isEasy(dimensions)) {
      return 'easy';
    }
    if (isHard(dimensions)) {
      return 'hard';
    }
    return 'normal';
  }

  /**
   * Calculate all three difficulty dimensions from mistake records.
   */
  function calculateDifficultyDimensions(mistakes: Mistake[]): SentenceDifficultyDimensions {
    let totalErrors = 0;
    let totalAttempts = 0;
    let latestAttemptTime = 0;
    let recentCorrectCount = 0;
    let recentTotalCount = 0;

    for (const mistake of mistakes) {
      totalErrors += mistake.wrongAnswers.length;
      totalAttempts += mistake.attempts;

      // Track latest attempt time
      if (mistake.timestamp > latestAttemptTime) {
        latestAttemptTime = mistake.timestamp;
      }

      // Calculate recent attempts (last 7 days)
      const now = Date.now();
      if (mistake.timestamp >= now - SEVEN_DAYS_MS) {
        recentTotalCount++;
        // Check if recent attempts were mostly correct
        if (mistake.correctAnswers.length >= mistake.wrongAnswers.length) {
          recentCorrectCount++;
        }
      }
    }

    // Calculate error rate
    const errorRate = totalAttempts > 0 ? totalErrors / totalAttempts : 0;

    // Calculate time since last attempt
    const timeSinceLastAttempt = latestAttemptTime > 0
      ? Date.now() - latestAttemptTime
      : THIRTY_DAYS_MS + 1; // Default to very old if never attempted

    // Check if recent attempts were mostly correct
    const recentAttemptsCorrect = recentTotalCount > 0 && recentCorrectCount >= recentTotalCount * 0.7;

    return {
      errorRate,
      attemptCount: totalAttempts,
      timeSinceLastAttempt,
      recentAttemptsCorrect,
    };
  }

  // Check if recent attempts were mostly correct
  function isEasy(dimensions: SentenceDifficultyDimensions): boolean {
    return dimensions.errorRate < ERROR_RATE_THRESHOLD_EASY && dimensions.recentAttemptsCorrect;
  }

  /**
   * Check if sentence should be classified as hard.
   */
  function isHard(dimensions: SentenceDifficultyDimensions): boolean {
    return dimensions.errorRate > ERROR_RATE_THRESHOLD_HARD || dimensions.attemptCount > 10;
  }

  // ---------------------------------------------------------------------------
  // getUserDifficultyProfile
  // ---------------------------------------------------------------------------

  /**
   * Derives user ability profile from Mistake records and mode accuracy breakdown.
   * Calculates:
   * - easyAccuracyRate: accuracy rate for easy sentences
   * - mediumAccuracyRate: accuracy rate for medium sentences
   * - hardAccuracyRate: accuracy rate for hard sentences
   * - sessionAccuracyHistory: limited to last 50 entries
   *
   * @returns The user's adaptive difficulty profile
   */
  function getUserDifficultyProfile(): AdaptiveDifficultyProfile {
    // Load from storage
    const storedProfile = storage.getDifficultyProfile();

    // Calculate accuracy rates per difficulty band using mode accuracy breakdown
    const modeAccuracyBreakdown = learningProfile.modeAccuracyBreakdown;

    // Calculate weighted accuracy rates
    let easyTotal = 0;
    let easyCount = 0;
    let mediumTotal = 0;
    let mediumCount = 0;
    let hardTotal = 0;
    let hardCount = 0;

    // Calculate overall ability once (outside loop)
    const overallAbility = calculateOverallAbility(modeAccuracyBreakdown);

    for (const modeData of modeAccuracyBreakdown) {
      const accuracy = modeData.accuracy / 100; // Convert from percentage

      // Distribute modes into ALL difficulty bands proportionally
      // High ability modes contribute more to easy band
      // Low ability modes contribute more to hard band

      // Always add to easy band (weight based on ability)
      const easyWeight = Math.max(0, overallAbility - 0.5) * 2; // 0 to 0.5 weight for easy
      easyTotal += accuracy * easyWeight;
      easyCount += easyWeight;

      // Always add to medium band (weight based on proximity to 0.5)
      const mediumWeight = 1 - Math.abs(overallAbility - 0.5) * 2; // Highest when ability is 0.5
      mediumTotal += accuracy * mediumWeight;
      mediumCount += mediumWeight;

      // Always add to hard band (weight based on low ability)
      const hardWeight = Math.max(0, 0.5 - overallAbility) * 2; // 0 to 0.5 weight for hard
      hardTotal += accuracy * hardWeight;
      hardCount += hardWeight;
    }

    // Calculate rates with fallbacks
    const easyAccuracyRate = easyCount > 0 ? easyTotal / easyCount : storedProfile.easyAccuracyRate;
    const mediumAccuracyRate = mediumCount > 0 ? mediumTotal / mediumCount : storedProfile.mediumAccuracyRate;
    const hardAccuracyRate = hardCount > 0 ? hardTotal / hardCount : storedProfile.hardAccuracyRate;

    // Infer difficulty band from overall accuracy
    const inferredDifficultyBand = inferDifficultyBand(
      easyAccuracyRate,
      mediumAccuracyRate,
      hardAccuracyRate,
      storedProfile.sessionAccuracyHistory
    );

    return {
      inferredDifficultyBand,
      easyAccuracyRate,
      mediumAccuracyRate,
      hardAccuracyRate,
      sessionAccuracyHistory: storedProfile.sessionAccuracyHistory,
    };
  }

  /**
   * Calculate overall user ability from mode accuracy breakdown.
   */
  function calculateOverallAbility(
    modeAccuracyBreakdown: { mode: PracticeMode; accuracy: number; totalQuestions: number }[]
  ): number {
    if (modeAccuracyBreakdown.length === 0) {
      return 0.5;
    }

    // Weighted average by total questions
    let totalQuestions = 0;
    let weightedSum = 0;

    for (const mode of modeAccuracyBreakdown) {
      weightedSum += mode.accuracy * mode.totalQuestions;
      totalQuestions += mode.totalQuestions;
    }

    return totalQuestions > 0 ? weightedSum / totalQuestions / 100 : 0.5;
  }

  /**
   * Infer the difficulty band based on accuracy rates.
   */
  function inferDifficultyBand(
    easyRate: number,
    mediumRate: number,
    hardRate: number,
    history: { accuracy: number }[]
  ): SentenceDifficultyLevel {
    // Use recent history if available
    if (history.length > 0) {
      const recentEntries = history.slice(-10);
      const avgRecentAccuracy = recentEntries.reduce((sum, e) => sum + e.accuracy, 0) / recentEntries.length;

      if (avgRecentAccuracy > DEFAULT_TARGET_ACCURACY + DEFAULT_TOLERANCE_BAND) {
        return 'easy';
      } else if (avgRecentAccuracy < DEFAULT_TARGET_ACCURACY - DEFAULT_TOLERANCE_BAND) {
        return 'hard';
      }
    }

    // Fallback to accuracy rates
    const avgAccuracy = (easyRate + mediumRate + hardRate) / 3;

    if (avgAccuracy > DEFAULT_TARGET_ACCURACY + DEFAULT_TOLERANCE_BAND) {
      return 'easy';
    } else if (avgAccuracy < DEFAULT_TARGET_ACCURACY - DEFAULT_TOLERANCE_BAND) {
      return 'hard';
    }
    return 'normal';
  }

  // ---------------------------------------------------------------------------
  // calibrateSessionBand
  // ---------------------------------------------------------------------------

  /**
   * Calculates current session's target difficulty band.
   *
   * Compares actual accuracy vs targetAccuracy from difficultyCalibration config.
   * Uses calibrationSpeed for exponential smoothing.
   *
   * @returns The inferred difficulty band for current session
   */
  function calibrateSessionBand(): SentenceDifficultyLevel {
    // Get calibration config
    const adaptiveConfig = storage.getAdaptiveConfig();
    const { enabled, targetAccuracy, toleranceBand, calibrationSpeed } = adaptiveConfig.difficultyCalibration;

    // If adaptive difficulty is disabled, return normal band
    if (!enabled) {
      return 'normal';
    }

    // Get stored profile with session history
    const profile = storage.getDifficultyProfile();

    // Calculate current session accuracy from recent history
    const recentHistory = profile.sessionAccuracyHistory.slice(-10);

    let currentAccuracy = 0.5; // Default if no history

    if (recentHistory.length > 0) {
      currentAccuracy = recentHistory.reduce((sum, entry) => sum + entry.accuracy, 0) / recentHistory.length;
    }

    // Apply exponential smoothing to calculate adjusted accuracy
    const smoothedAccuracy = applyExponentialSmoothing(currentAccuracy, targetAccuracy, calibrationSpeed);

    // Determine difficulty band based on smoothed accuracy
    if (smoothedAccuracy > targetAccuracy + toleranceBand) {
      return 'easy';
    } else if (smoothedAccuracy < targetAccuracy - toleranceBand) {
      return 'hard';
    }
    return 'normal';
  }

  /**
   * Apply exponential smoothing to accuracy value.
   * Higher calibrationSpeed = faster adaptation to new data.
   */
  function applyExponentialSmoothing(
    currentAccuracy: number,
    targetAccuracy: number,
    calibrationSpeed: number
  ): number {
    // Formula: smoothed = current * (1 - speed) + target * speed
    // This brings current towards target based on calibration speed
    return currentAccuracy * (1 - calibrationSpeed) + targetAccuracy * calibrationSpeed;
  }

  // ---------------------------------------------------------------------------
  // getDifficultyAdjustedSentenceIds
  // ---------------------------------------------------------------------------

  /**
   * Filters sentences by difficulty band and applies weighted shuffle for prioritization.
   *
   * Falls back to weighted shuffle when insufficient history data.
   * Does NOT modify Sentence source data (read-only).
   *
   * @param allSentenceIds - Array of all sentence IDs to filter
   * @param dictionaryId - The dictionary ID for dictionary-specific filtering
   * @returns Array of sentence IDs filtered by difficulty band, with weighted shuffle
   */
  function getDifficultyAdjustedSentenceIds(
    allSentenceIds: string[],
    dictionaryId: string
  ): string[] {
    // Determine target difficulty band for this session
    const sessionBand = calibrateSessionBand();

    // Get user profile
    const userProfile = getUserDifficultyProfile();

    // Get all mistakes for weighting
    const allMistakes = storage.getMistakes();
    const dictionaryMistakes = allMistakes.filter((m) => m.dictionaryId === dictionaryId);

    // Classify each sentence by difficulty
    const sentencesByDifficulty: Record<SentenceDifficultyLevel, string[]> = {
      easy: [],
      normal: [],
      hard: [],
    };

    for (const sentenceId of allSentenceIds) {
      const difficulty = inferSentenceDifficulty(sentenceId, dictionaryId);
      sentencesByDifficulty[difficulty].push(sentenceId);
    }

    // Determine which difficulty bands to include based on session band
    // Include the target band plus adjacent bands for variety
    const bandsToInclude = getBandsToInclude(sessionBand, userProfile.inferredDifficultyBand);

    // Filter to only include sentences from target bands
    const filteredIds = allSentenceIds.filter((id) => {
      const difficulty = inferSentenceDifficulty(id, dictionaryId);
      return bandsToInclude.includes(difficulty);
    });

    // If not enough filtered sentences, use graduated fallback
    // Include target bands + adjacent bands + small sample of others
    const minRequired = Math.min(10, allSentenceIds.length);
    let finalIds: string[];

    if (filteredIds.length >= minRequired) {
      finalIds = filteredIds;
    } else {
      // Graduated fallback: target -> adjacent -> small sample of others
      const allBands: SentenceDifficultyLevel[] = ['easy', 'normal', 'hard'];
      const targetAndAdjacent = getBandsToInclude(sessionBand, userProfile.inferredDifficultyBand);
      const otherBands = allBands.filter((b) => !targetAndAdjacent.includes(b));

      // Start with target+adjacent bands
      finalIds = [...filteredIds];

      // Add more from target bands if still not enough
      for (const band of targetAndAdjacent) {
        const bandIds = sentencesByDifficulty[band];
        for (const id of bandIds) {
          if (!finalIds.includes(id) && finalIds.length < minRequired * 2) {
            finalIds.push(id);
          }
        }
      }

      // Finally add small sample from other bands
      for (const band of otherBands) {
        const bandIds = sentencesByDifficulty[band];
        const sampleSize = Math.min(3, bandIds.length);
        for (let i = 0; i < sampleSize && finalIds.length < minRequired * 3; i++) {
          const id = bandIds[i];
          if (!finalIds.includes(id)) {
            finalIds.push(id);
          }
        }
      }
    }

    // Apply weighted shuffle to prioritize
    const weightedIds = applyWeightedShuffle(finalIds, dictionaryMistakes);

    return weightedIds;
  }

  /**
   * Get difficulty bands to include based on session and user profile.
   */
  function getBandsToInclude(
    sessionBand: SentenceDifficultyLevel,
    userProfileBand: SentenceDifficultyLevel
  ): SentenceDifficultyLevel[] {
    // Primary band is session band
    const bands: SentenceDifficultyLevel[] = [sessionBand];

    // Add adjacent bands based on user profile
    if (sessionBand === 'easy') {
      bands.push('normal');
    } else if (sessionBand === 'hard') {
      bands.push('normal');
    } else {
      // 'normal' - include adjacent bands
      bands.push('easy');
      bands.push('hard');
    }

    // Also include user's preferred band if different
    if (!bands.includes(userProfileBand)) {
      bands.push(userProfileBand);
    }

    return [...new Set(bands)]; // Deduplicate
  }

  /**
   * Apply weighted shuffle to prioritize sentences with higher weights.
   */
  function applyWeightedShuffle(
    sentenceIds: string[],
    mistakes: Mistake[]
  ): string[] {
    if (sentenceIds.length === 0) {
      return [];
    }

    // Calculate weights for all sentences
    const weightedSentences = sentenceIds.map((id) => ({
      id,
      weight: getSentenceWeight(id, mistakes),
    }));

    // Sort by weight descending
    weightedSentences.sort((a, b) => b.weight - a.weight);

    // Get top sentences (weighted high priority)
    const topCount = Math.min(5, weightedSentences.length);
    const topSentences = weightedSentences.slice(0, topCount);

    // Get remaining sentences
    const remainingSentences = weightedSentences.slice(topCount);

    // Shuffle each group
    const shuffleArray = <T>(arr: T[]): T[] => {
      const result = [...arr];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    };

    // Combine and shuffle
    return shuffleArray([...topSentences.map((s) => s.id), ...shuffleArray(remainingSentences.map((s) => s.id))]);
  }

  // ---------------------------------------------------------------------------
  // trackSessionAccuracy
  // ---------------------------------------------------------------------------

  /**
   * Records session accuracy for calibration.
   * Updates sessionAccuracyHistory in storage.
   * Uses MAX_SESSION_ACCURACY_HISTORY (50) limit.
   *
   * @param isCorrect - Whether the user answered correctly
   * @param mode - The practice mode used
   */
  function trackSessionAccuracy(isCorrect: boolean, mode: PracticeMode): void {
    // Get current profile
    const currentProfile = storage.getDifficultyProfile();

    // Create new accuracy entry
    const newEntry = {
      timestamp: Date.now(),
      accuracy: isCorrect ? 1 : 0,
      mode,
    };

    // Update history with new entry
    const updatedHistory = [...currentProfile.sessionAccuracyHistory, newEntry];

    // Trim to max entries
    const trimmedHistory = updatedHistory.slice(-MAX_SESSION_ACCURACY_HISTORY);

    // Calculate new accuracy rates using exponential smoothing
    const adaptiveConfig = storage.getAdaptiveConfig();
    const { calibrationSpeed } = adaptiveConfig.difficultyCalibration;

    const updateRate = (prev: number, newVal: number): number => {
      return prev * (1 - calibrationSpeed) + newVal * calibrationSpeed;
    };

    // Calculate current session accuracy
    const sessionEntries = [...currentProfile.sessionAccuracyHistory, newEntry];
    const sessionAccuracy = sessionEntries.reduce((sum, e) => sum + e.accuracy, 0) / sessionEntries.length;

    // Update difficulty band based on session accuracy
    const inferredBand = calibrateSessionBand();

    // Create updated profile
    const updatedProfile: AdaptiveDifficultyProfile = {
      inferredDifficultyBand: inferredBand,
      easyAccuracyRate: updateRate(currentProfile.easyAccuracyRate, sessionAccuracy),
      mediumAccuracyRate: updateRate(currentProfile.mediumAccuracyRate, sessionAccuracy),
      hardAccuracyRate: updateRate(currentProfile.hardAccuracyRate, sessionAccuracy),
      sessionAccuracyHistory: trimmedHistory,
    };

    // Save to storage
    storage.saveDifficultyProfile(updatedProfile);
  }

  // ---------------------------------------------------------------------------
  // Return public API
  // ---------------------------------------------------------------------------

  return {
    inferSentenceDifficulty,
    getUserDifficultyProfile,
    calibrateSessionBand,
    getDifficultyAdjustedSentenceIds,
    trackSessionAccuracy,
  };
}

// ---------------------------------------------------------------------------
// Export types for external use
// ---------------------------------------------------------------------------

export type { SentenceDifficultyDimensions };