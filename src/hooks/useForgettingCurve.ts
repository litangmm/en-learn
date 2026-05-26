import { useMemo } from 'react';
import { storage } from '@/services/storage';

// ============================================================================
// Forgetting Curve Types (epic-083 iter-004)
// ============================================================================

/**
 * A single data point on the forgetting curve.
 * Represents memory retention at a specific point in time after review.
 */
export interface ForgettingCurvePoint {
  /** Days since the last review */
  daysSinceReview: number;
  /** Retention rate (0-100%) */
  retentionRate: number;
  /** Timestamp of this data point */
  timestamp: number;
}

/**
 * Review interval context for memory stability calculation.
 */
export interface ReviewIntervalContext {
  /** Current review interval in days (1, 3, 7, or 14) */
  currentInterval: number;
  /** Number of times this item has been reviewed */
  reviewCount: number;
}

/**
 * Forgetting curve data for a single sentence.
 * Contains historical retention points and predicted next review.
 */
export interface ForgettingCurveData {
  /** The sentence ID this curve belongs to */
  sentenceId: string;
  /** Dictionary this sentence belongs to */
  dictionaryId: string;
  /** Historical retention data points from review history */
  dataPoints: ForgettingCurvePoint[];
  /** Current review interval context */
  intervalContext: ReviewIntervalContext;
  /** Predicted next review timestamp (milliseconds) */
  nextReviewAt: number | null;
  /** Days until next scheduled review (negative means overdue) */
  daysUntilReview: number;
  /** Current memory retention score (0-100) */
  memoryRetentionScore: number;
  /** Whether this item is overdue for review */
  isOverdue: boolean;
  /** Urgency level for review (1=low, 2=medium, 3=high/overdue) */
  urgencyLevel: 1 | 2 | 3;
}

/**
 * Aggregated forgetting curve summary.
 */
export interface ForgettingCurveSummary {
  /** Total number of tracked sentences */
  totalTracked: number;
  /** Number of sentences overdue for review */
  overdueCount: number;
  /** Number of sentences due soon (within 1 day) */
  dueSoonCount: number;
  /** Number of sentences with good retention */
  healthyCount: number;
  /** Average retention score across all tracked items */
  averageRetention: number;
  /** Sorted list of curves by urgency (most urgent first) */
  sortedByUrgency: ForgettingCurveData[];
}

// ============================================================================
// Constants
// ============================================================================

/** Ebbinghaus forgetting curve stability parameter (S).
 * Higher values = slower forgetting. Based on typical learning patterns.
 */
const STABILITY_FACTOR = 1.25;

/** Days representing "due soon" threshold (within 1 day) */
const DUE_SOON_THRESHOLD_DAYS = 1;

/** Minimum retention score for "healthy" classification */
const HEALTHY_RETENTION_THRESHOLD = 60;

/** Maximum number of data points to keep per sentence */
const MAX_DATA_POINTS = 30;

/**
 * Ebbinghaus retention formula: R = e^(-t/S)
 * where t = time in days, S = stability factor
 */
function calculateRetention(daysSinceReview: number): number {
  if (daysSinceReview <= 0) return 100;
  return Math.round(100 * Math.exp(-daysSinceReview / STABILITY_FACTOR));
}

/**
 * Calculate predicted retention score based on days since last review
 * and the next review interval.
 */
function calculateMemoryRetentionScore(
  lastReviewedAt: number | undefined,
  nextReviewAt: number | undefined,
  _currentInterval: number,
  now: number
): number {
  // If never reviewed, return 100% (new item)
  if (lastReviewedAt === undefined) {
    return 100;
  }

  const daysSinceReview = Math.floor((now - lastReviewedAt) / (24 * 60 * 60 * 1000));

  // Base retention from Ebbinghaus curve
  const baseRetention = calculateRetention(daysSinceReview);

  // Adjust based on how well the user has kept up with reviews
  // If nextReviewAt is set and in the past, retention is dropping faster
  if (nextReviewAt !== undefined && nextReviewAt < now) {
    // Overdue: retention drops faster
    const daysOverdue = Math.floor((now - nextReviewAt) / (24 * 60 * 60 * 1000));
    return Math.max(0, baseRetention - (daysOverdue * 5));
  }

  return baseRetention;
}

/**
 * Build historical data points from review history.
 */
function buildDataPoints(
  reviewHistory: Array<{ timestamp: number; isCorrect: boolean; interval: number }> | undefined
): ForgettingCurvePoint[] {
  if (!reviewHistory || reviewHistory.length === 0) {
    return [];
  }

  // Sort by timestamp ascending
  const sorted = [...reviewHistory].sort((a, b) => a.timestamp - b.timestamp);

  return sorted.slice(-MAX_DATA_POINTS).map((review, index) => {
    const daysSinceReview = index === 0
      ? 0
      : Math.floor((review.timestamp - sorted[0].timestamp) / (24 * 60 * 60 * 1000));

    return {
      daysSinceReview,
      retentionRate: review.isCorrect ? 100 : calculateRetention(daysSinceReview),
      timestamp: review.timestamp,
    };
  });
}

/**
 * Determine urgency level based on days until review.
 */
function determineUrgencyLevel(daysUntilReview: number, isOverdue: boolean): 1 | 2 | 3 {
  if (isOverdue) return 3;
  if (daysUntilReview <= 0) return 3; // Due today
  if (daysUntilReview <= 1) return 2; // Due within 1 day
  return 1; // Not urgent
}

/**
 * Calculate days until review from nextReviewAt timestamp.
 * Accepts current time as parameter to maintain hook purity.
 */
function calculateDaysUntilReview(nextReviewAt: number | undefined, now: number): number {
  if (nextReviewAt === undefined) return 0; // New item, consider urgent

  const diff = nextReviewAt - now;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

/**
 * Hook that provides forgetting curve data for all tracked mistakes.
 *
 * Features:
 * - Lazy-loading of all mistake data
 * - Ebbinghaus curve calculation for each item
 * - Urgency sorting for review prioritization
 * - Historical retention point tracking
 *
 * @returns ForgettingCurveSummary with all forgetting curve data
 */
export function useForgettingCurve(): ForgettingCurveSummary {
  return useMemo(() => {
    const mistakes = storage.getMistakes();
    /* eslint-disable-next-line react-hooks/purity -- Date.now() is intentional for real-time review urgency */
    const now = Date.now();

    // Build curve data for each mistake
    const curves: ForgettingCurveData[] = mistakes.map((mistake) => {
      const daysUntilReview = calculateDaysUntilReview(mistake.nextReviewAt, now);
      const isOverdue = mistake.nextReviewAt !== undefined && mistake.nextReviewAt < now;

      // Determine current interval from review count
      const REVIEW_INTERVALS = [1, 3, 7, 14] as const;
      const currentInterval = REVIEW_INTERVALS[
        Math.min(mistake.reviewedCount, REVIEW_INTERVALS.length - 1)
      ];

      // Build historical data points
      const dataPoints = buildDataPoints(mistake.reviewHistory);

      // Calculate memory retention score
      const memoryRetentionScore = calculateMemoryRetentionScore(
        mistake.lastReviewedAt,
        mistake.nextReviewAt,
        currentInterval,
        now
      );

      // Determine urgency level
      const urgencyLevel = determineUrgencyLevel(daysUntilReview, isOverdue);

      return {
        sentenceId: mistake.sentenceId,
        dictionaryId: mistake.dictionaryId,
        dataPoints,
        intervalContext: {
          currentInterval,
          reviewCount: mistake.reviewedCount,
        },
        nextReviewAt: mistake.nextReviewAt ?? null,
        daysUntilReview,
        memoryRetentionScore,
        isOverdue,
        urgencyLevel,
      };
    });

    // Sort by urgency (most urgent first), then by retention score (lowest first)
    const sortedByUrgency = [...curves].sort((a, b) => {
      // First by urgency level
      if (a.urgencyLevel !== b.urgencyLevel) {
        return a.urgencyLevel - b.urgencyLevel;
      }
      // Then by days until review (overdue first)
      if (a.daysUntilReview !== b.daysUntilReview) {
        return a.daysUntilReview - b.daysUntilReview;
      }
      // Then by retention score (lowest first)
      return a.memoryRetentionScore - b.memoryRetentionScore;
    });

    // Calculate summary stats
    const overdueCount = curves.filter((c) => c.isOverdue).length;
    const dueSoonCount = curves.filter(
      (c) => !c.isOverdue && c.daysUntilReview <= DUE_SOON_THRESHOLD_DAYS
    ).length;
    const healthyCount = curves.filter(
      (c) => c.memoryRetentionScore >= HEALTHY_RETENTION_THRESHOLD
    ).length;

    const averageRetention =
      curves.length > 0
        ? Math.round(
            curves.reduce((sum, c) => sum + c.memoryRetentionScore, 0) / curves.length
          )
        : 0;

    return {
      totalTracked: curves.length,
      overdueCount,
      dueSoonCount,
      healthyCount,
      averageRetention,
      sortedByUrgency,
    };
  }, []);
}

/**
 * Hook that provides forgetting curve data for a specific sentence.
 *
 * @param sentenceId - The sentence ID to get curve data for
 * @returns ForgettingCurveData or null if not found
 */
export function useForgettingCurveForSentence(sentenceId: string): ForgettingCurveData | null {
  return useMemo(() => {
    const mistakes = storage.getMistakes();
    /* eslint-disable-next-line react-hooks/purity -- Date.now() is intentional for real-time review urgency */
    const now = Date.now();
    const mistake = mistakes.find((m) => m.sentenceId === sentenceId);

    if (!mistake) return null;

    const daysUntilReview = calculateDaysUntilReview(mistake.nextReviewAt, now);
    const isOverdue = mistake.nextReviewAt !== undefined && mistake.nextReviewAt < now;

    const REVIEW_INTERVALS = [1, 3, 7, 14] as const;
    const currentInterval = REVIEW_INTERVALS[
      Math.min(mistake.reviewedCount, REVIEW_INTERVALS.length - 1)
    ];

    const dataPoints = buildDataPoints(mistake.reviewHistory);

    const memoryRetentionScore = calculateMemoryRetentionScore(
      mistake.lastReviewedAt,
      mistake.nextReviewAt,
      currentInterval,
      now
    );

    const urgencyLevel = determineUrgencyLevel(daysUntilReview, isOverdue);

    return {
      sentenceId: mistake.sentenceId,
      dictionaryId: mistake.dictionaryId,
      dataPoints,
      intervalContext: {
        currentInterval,
        reviewCount: mistake.reviewedCount,
      },
      nextReviewAt: mistake.nextReviewAt ?? null,
      daysUntilReview,
      memoryRetentionScore,
      isOverdue,
      urgencyLevel,
    };
  }, [sentenceId]);
}

export default useForgettingCurve;