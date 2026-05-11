import { useMemo } from 'react';
import { storage } from '@/services/storage';
import type { Mistake } from '@/data/types';

export interface LearningEfficiencyMetrics {
  /** Memory retention rate: 0-100% of reviewed items answered correctly on review */
  memoryRetentionRate: number;
  /** Forgetting curve fit: 0-100 score, higher = longer retention */
  forgettingCurveFit: number;
  /** Weakness progress: 0-100, improvement in weak sentences over time */
  weaknessProgress: number;
  /** Details */
  totalReviewed: number;
  totalCorrectOnReview: number;
  totalMistakes: number;
  improvedMistakes: number; // mistakes that decreased error rate over time
}

interface ReviewSessionStats {
  totalReviews: number;
  correctReviews: number;
  intervalGrowth: number; // sum of interval improvements
  totalIntervals: number;
}

function calculateReviewStats(mistakes: Mistake[]): ReviewSessionStats {
  let totalReviews = 0;
  let correctReviews = 0;
  let intervalGrowth = 0;
  let totalIntervals = 0;

  for (const mistake of mistakes) {
    const history = mistake.reviewHistory ?? [];
    totalReviews += history.length;

    for (const result of history) {
      if (result.isCorrect) {
        correctReviews++;
      }
    }

    // Calculate interval growth: later intervals should be larger than earlier ones
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];
      if (curr.interval > prev.interval) {
        intervalGrowth++;
      }
      totalIntervals++;
    }
  }

  return { totalReviews, correctReviews, intervalGrowth, totalIntervals };
}

function calculateMemoryRetention(stats: ReviewSessionStats): number {
  if (stats.totalReviews === 0) return 0;
  return Math.round((stats.correctReviews / stats.totalReviews) * 100);
}

function calculateForgettingCurveFit(stats: ReviewSessionStats): number {
  if (stats.totalIntervals === 0) return 0;
  // Score based on interval growth ratio (how often intervals increased)
  const growthRatio = stats.intervalGrowth / stats.totalIntervals;
  return Math.round(growthRatio * 100);
}

function calculateWeaknessProgress(mistakes: Mistake[]): number {
  if (mistakes.length === 0) return 100; // No weaknesses = perfect

  let improved = 0;
  let countWithData = 0;

  for (const mistake of mistakes) {
    const history = mistake.reviewHistory ?? [];
    if (history.length < 2) {
      // Not enough data for comparison — treat as neutral (counts as "improved")
      countWithData++;
      improved++;
      continue;
    }

    countWithData++;

    // Compare first half vs second half accuracy
    const mid = Math.floor(history.length / 2);
    const firstHalf = history.slice(0, mid);
    const secondHalf = history.slice(mid);

    const firstCorrect = firstHalf.filter(r => r.isCorrect).length;
    const secondCorrect = secondHalf.filter(r => r.isCorrect).length;

    const firstAccuracy = firstCorrect / firstHalf.length;
    const secondAccuracy = secondHalf.length > 0
      ? secondCorrect / secondHalf.length
      : firstAccuracy;

    // If second half is better or equal, consider improved
    if (secondAccuracy >= firstAccuracy) {
      improved++;
    }
  }

  if (countWithData === 0) return 100;
  return Math.round((improved / countWithData) * 100);
}

/**
 * Hook that derives learning efficiency metrics from storage data.
 * Reads from existing Mistake storage (read-only).
 */
export function useLearningEfficiency(): LearningEfficiencyMetrics {
  return useMemo(() => {
    const mistakes = storage.getMistakes();

    const reviewStats = calculateReviewStats(mistakes);
    const memoryRetentionRate = calculateMemoryRetention(reviewStats);
    const forgettingCurveFit = calculateForgettingCurveFit(reviewStats);
    const weaknessProgress = calculateWeaknessProgress(mistakes);

    const totalReviewed = reviewStats.totalReviews;
    const totalCorrectOnReview = reviewStats.correctReviews;
    const totalMistakes = mistakes.length;
    const improvedMistakes = Math.round((weaknessProgress / 100) * mistakes.length);

    return {
      memoryRetentionRate,
      forgettingCurveFit,
      weaknessProgress,
      totalReviewed,
      totalCorrectOnReview,
      totalMistakes,
      improvedMistakes,
    };
  }, []);
}

export default useLearningEfficiency;