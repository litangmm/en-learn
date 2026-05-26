import type { Mistake, Weakness, Sentence, PracticeMode, PracticeRecommendation, RecommendationType } from '@/data/types';
import { RECOMMENDATION_THRESHOLDS, DEFAULT_RECOMMENDATION_LIMIT } from '@/data/types';

/**
 * Input data for recommendation generation.
 */
export interface RecommendationInput {
  /** User's mistakes/error data */
  mistakes: Mistake[];
  /** All detected weaknesses */
  weaknesses: Weakness[];
  /** Personal words as sentences for new-word recommendations */
  personalWords: Sentence[];
  /** History for calculating review dates (optional) */
  history?: { sentenceId: string; lastReviewedAt?: number; reviewedCount: number }[];
  /** Mode accuracy data for mode-weak recommendations */
  modeAccuracy?: { mode: PracticeMode; accuracy: number }[];
}

/**
 * Generate a unique recommendation ID.
 */
function generateRecommendationId(type: RecommendationType, sentenceId: string): string {
  return `rec-${type}-${sentenceId}-${Date.now()}`;
}

/**
 * Calculate days since last review for a sentence.
 */
function getDaysSinceLastReview(
  sentenceId: string,
  history: RecommendationInput['history']
): number | null {
  if (!history) return null;

  const entry = history.find(h => h.sentenceId === sentenceId);
  if (!entry || !entry.lastReviewedAt) return null;

  const now = Date.now();
  const diffMs = now - entry.lastReviewedAt;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)); // Convert to days
}

/**
 * Get high-error recommendations (Priority 1).
 * Sentences with 3+ wrong answers indicate persistent weakness.
 */
function getHighErrorRecommendations(
  mistakes: Mistake[]
): PracticeRecommendation[] {
  const threshold = RECOMMENDATION_THRESHOLDS.highErrorCount;

  return mistakes
    .filter(m => m.wrongAnswers.length >= threshold)
    .map(m => {
      const wrongCount = m.wrongAnswers.length;
      return {
        id: generateRecommendationId('high-error', m.sentenceId),
        type: 'high-error' as const,
        priority: 1 as const,
        reason: `这道题您已答错${wrongCount}次，属于高频错误，需要重点复习`,
        targetSentenceId: m.sentenceId,
        action: '重点练习这个句型',
      };
    });
}

/**
 * Get neglected-review recommendations (Priority 2).
 * Sentences not reviewed in 7+ days benefit from spaced repetition.
 */
function getNeglectedReviewRecommendations(
  mistakes: Mistake[],
  history: RecommendationInput['history']
): PracticeRecommendation[] {
  const threshold = RECOMMENDATION_THRESHOLDS.neglectedReviewDays;

  if (!history) return [];

  return mistakes
    .map(m => {
      const daysSinceReview = getDaysSinceLastReview(m.sentenceId, history);
      return { mistake: m, daysSinceReview };
    })
    .filter(item => item.daysSinceReview !== null && item.daysSinceReview >= threshold)
    .map(item => ({
      id: generateRecommendationId('neglected-review', item.mistake.sentenceId),
      type: 'neglected-review' as const,
      priority: 2 as const,
      reason: `这道题已经${item.daysSinceReview}天没有复习了，及时回顾有助于记忆`,
      targetSentenceId: item.mistake.sentenceId,
      action: '巩固复习',
    }));
}

/**
 * Get low-accuracy recommendations (Priority 2).
 * Sentences with accuracy below 60% need reinforcement.
 */
function getLowAccuracyRecommendations(
  mistakes: Mistake[]
): PracticeRecommendation[] {
  const ACCURACY_THRESHOLD = 60; // 60%

  return mistakes
    .map(m => {
      const total = m.correctAnswers.length + m.wrongAnswers.length;
      const accuracy = total > 0 ? (m.correctAnswers.length / total) * 100 : 100;
      return { mistake: m, accuracy };
    })
    .filter(item => item.accuracy < ACCURACY_THRESHOLD && item.accuracy > 0)
    .map(item => ({
      id: generateRecommendationId('low-accuracy', item.mistake.sentenceId),
      type: 'low-accuracy' as const,
      priority: 2 as const,
      reason: `这道题正确率只有${Math.round(item.accuracy)}%，需要加强练习`,
      targetSentenceId: item.mistake.sentenceId,
      action: '提高正确率',
    }));
}

/**
 * Get new-word recommendations (Priority 3).
 * Personal words not yet practiced should be introduced.
 */
function getNewWordRecommendations(
  personalWords: Sentence[],
  mistakes: Mistake[]
): PracticeRecommendation[] {
  // Get sentence IDs that have been practiced
  const practicedSentenceIds = new Set(mistakes.map(m => m.sentenceId));

  // Filter personal words that haven't been practiced
  const unpracticedWords = personalWords.filter(
    pw => !practicedSentenceIds.has(pw.id)
  );

  return unpracticedWords.slice(0, 2).map(pw => ({
    id: generateRecommendationId('new-word', pw.id),
    type: 'new-word' as const,
    priority: 3 as const,
    reason: `生词"${pw.blanks[0]?.word || pw.english.substring(0, 20)}"还未练习，建议学习`,
    targetSentenceId: pw.id,
    targetSentence: pw,
    action: '学习新单词',
  }));
}

/**
 * Get mode-weak recommendations (Priority 3).
 * If any mode has < 50% accuracy, recommend practicing that mode.
 */
function getModeWeakRecommendations(
  modeAccuracy: RecommendationInput['modeAccuracy']
): PracticeRecommendation[] {
  if (!modeAccuracy || modeAccuracy.length === 0) return [];

  const threshold = RECOMMENDATION_THRESHOLDS.modeWeakAccuracy;

  // Find modes with accuracy below threshold
  const weakModes = modeAccuracy.filter(ma => ma.accuracy > 0 && ma.accuracy < threshold);

  if (weakModes.length === 0) return [];

  // Pick the weakest mode
  const weakest = weakModes.reduce((min, current) =>
    current.accuracy < min.accuracy ? current : min
  );

  const modeLabels: Record<PracticeMode, string> = {
    'fill-in-blanks': '填空题',
    'multiple-choice': '选择题',
    'sentence-reorder': '排序题',
    'dictation': '听写',
  };

  return [{
    id: generateRecommendationId('mode-weak', weakest.mode),
    type: 'mode-weak' as const,
    priority: 3 as const,
    reason: `${modeLabels[weakest.mode]}正确率只有${weakest.accuracy}%，建议加强这个题型的练习`,
    targetSentenceId: '', // Mode-weak doesn't target a specific sentence
    action: `练习${modeLabels[weakest.mode]}`,
    suggestedMode: weakest.mode,
  }];
}

/**
 * Sort recommendations by priority.
 * Priority 1 comes first, then Priority 2, then Priority 3.
 */
function sortByPriority(recommendations: PracticeRecommendation[]): PracticeRecommendation[] {
  return [...recommendations].sort((a, b) => a.priority - b.priority);
}

/**
 * Deduplicate recommendations by target sentence ID.
 * When multiple recommendation types apply to the same sentence,
 * keep only the highest priority one.
 */
function deduplicateRecommendations(
  recommendations: PracticeRecommendation[]
): PracticeRecommendation[] {
  const seen = new Map<string, PracticeRecommendation>();

  for (const rec of recommendations) {
    const existing = seen.get(rec.targetSentenceId);
    if (!existing || rec.priority < existing.priority) {
      seen.set(rec.targetSentenceId, rec);
    }
  }

  return Array.from(seen.values());
}

/**
 * Get top recommendations based on input data.
 *
 * Algorithm priorities:
 * - Priority 1 (highest): High-frequency errors - sentences with 3+ wrong answers
 * - Priority 2: Long un-reviewed - sentences not reviewed in 7+ days
 * - Priority 3: New words - personal words not yet practiced
 * - Priority 4 (lowest): Mode weakness - if any mode has <50% accuracy, recommend practicing that mode
 *
 * Generates 2-4 recommendations max.
 *
 * @param mistakes - User's mistakes/error data
 * @param weaknesses - All detected weaknesses (optional, for future use)
 * @param personalWords - Personal words as sentences
 * @param history - History for calculating review dates
 * @param modeAccuracy - Mode accuracy data for mode-weak recommendations
 * @param limit - Maximum number of recommendations to return (default 4)
 * @returns Array of PracticeRecommendation sorted by priority
 */
export function getTopRecommendations(
  mistakes: Mistake[],
  _weaknesses: Weakness[], // Reserved for future use
  personalWords: Sentence[],
  history?: RecommendationInput['history'],
  modeAccuracy?: RecommendationInput['modeAccuracy'],
  limit: number = DEFAULT_RECOMMENDATION_LIMIT
): PracticeRecommendation[] {
  const allRecommendations: PracticeRecommendation[] = [];

  // Priority 1: High-frequency errors
  const highErrorRecs = getHighErrorRecommendations(mistakes);
  allRecommendations.push(...highErrorRecs);

  // Priority 2: Neglected review
  const neglectedRecs = getNeglectedReviewRecommendations(mistakes, history);
  allRecommendations.push(...neglectedRecs);

  // Priority 2: Low accuracy (same priority as neglected)
  const lowAccuracyRecs = getLowAccuracyRecommendations(mistakes);
  allRecommendations.push(...lowAccuracyRecs);

  // Priority 3: New word
  const newWordRecs = getNewWordRecommendations(personalWords, mistakes);
  allRecommendations.push(...newWordRecs);

  // Priority 3: Mode weakness
  const modeWeakRecs = getModeWeakRecommendations(modeAccuracy);
  allRecommendations.push(...modeWeakRecs);

  // Deduplicate by sentence ID, keeping highest priority
  const deduplicated = deduplicateRecommendations(allRecommendations);

  // Sort by priority and limit
  const sorted = sortByPriority(deduplicated);
  return sorted.slice(0, limit);
}

/**
 * Hook providing practice recommendations.
 *
 * @param mistakes - User's mistakes data (from storage)
 * @param weaknesses - All detected weaknesses
 * @param personalWords - Personal words as sentences
 * @param modeAccuracy - Mode accuracy data for mode-weak recommendations
 * @param limit - Maximum number of recommendations (default 4)
 */
export function usePracticeRecommendations(
  mistakes: Mistake[],
  _weaknesses: Weakness[],
  personalWords: Sentence[],
  modeAccuracy?: RecommendationInput['modeAccuracy'],
  limit: number = DEFAULT_RECOMMENDATION_LIMIT
): {
  recommendations: PracticeRecommendation[];
  refresh: () => void;
} {
  // Build history from mistakes for review date calculation
  const history = mistakes.map(m => ({
    sentenceId: m.sentenceId,
    lastReviewedAt: m.lastReviewedAt,
    reviewedCount: m.reviewedCount,
  }));

  // Generate recommendations
  const recommendations = getTopRecommendations(
    mistakes,
    [],
    personalWords,
    history,
    modeAccuracy,
    limit
  );

  // Refresh function (can be called to recalculate)
  const refresh = () => {
    // In a real implementation, this would trigger a re-calculation
    // For now, recommendations are computed on each render
  };

  return {
    recommendations,
    refresh,
  };
}

export default usePracticeRecommendations;