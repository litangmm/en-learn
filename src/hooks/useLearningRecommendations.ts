import { useMemo } from 'react';
import type { ModeRecommendation, PracticeMode, ModeAccuracy } from '@/data/types';
import type { ProgressStats } from './useProgressStats';
import type { WeaknessStats } from '@/data/types';
import { useProgressStats, MODE_LABELS } from './useProgressStats';
import { useWeaknessStats } from './useWeaknessStats';

/** All practice modes for recommendations */
const ALL_PRACTICE_MODES: PracticeMode[] = ['fill-in-blanks', 'multiple-choice', 'sentence-reorder', 'dictation'];

/**
 * Generate a natural language reason for a mode recommendation.
 */
function generateReason(mode: PracticeMode, accuracy: number, totalQuestions: number, weaknessCount: number): string {
  const modeLabel = MODE_LABELS[mode];

  // No data case
  if (totalQuestions === 0) {
    return `你还没有练习过「${modeLabel}」模式，建议尝试一下`;
  }

  // Very low accuracy or high weakness
  if (accuracy < 40) {
    return `「${modeLabel}」正确率仅${accuracy}%，需要重点加强`;
  }

  if (weaknessCount > 5) {
    return `「${modeLabel}」有${weaknessCount}个薄弱句子，建议专项练习`;
  }

  // Low accuracy
  if (accuracy < 60) {
    return `「${modeLabel}」正确率${accuracy}%，需要更多练习`;
  }

  // Moderate accuracy
  if (accuracy < 75) {
    return `「${modeLabel}」正确率${accuracy}%，可以继续巩固`;
  }

  // Good accuracy
  if (accuracy >= 75 && weaknessCount === 0) {
    return `「${modeLabel}」表现不错，正确率${accuracy}%，继续保持`;
  }

  // Has some weaknesses but decent accuracy
  if (weaknessCount > 0) {
    return `「${modeLabel}」正确率${accuracy}%，有${weaknessCount}个薄弱点可以改进`;
  }

  // Default
  return `「${modeLabel}」正确率${accuracy}%，建议继续练习`;
}

/**
 * Pure function to generate mode recommendations from stats.
 * Exported for testability.
 */
export function getRecommendations(stats: ProgressStats, weaknessStats: WeaknessStats): ModeRecommendation[] {
  const { modeAccuracy } = stats;
  const { overallStrength } = weaknessStats;

  // Create a map of mode -> mode accuracy data
  const accuracyMap = new Map<PracticeMode, ModeAccuracy>();
  modeAccuracy.forEach((ma) => {
    accuracyMap.set(ma.mode, ma);
  });

  // Calculate priority for each mode
  const recommendations: ModeRecommendation[] = ALL_PRACTICE_MODES.map((mode) => {
    const modeData = accuracyMap.get(mode);
    const accuracy = modeData?.accuracy ?? 0;
    const totalQuestions = modeData?.totalQuestions ?? 0;

    // Calculate priority based on multiple factors:
    // 1. Lower accuracy = higher priority (needs more practice)
    // 2. More questions in this mode = slightly higher priority (user is engaging with it)
    // 3. No data = lower priority (user hasn't tried it yet)

    let priority = 0;

    if (totalQuestions === 0) {
      // New mode - lower base priority, but still some priority
      priority = 10;
    } else {
      // Inverse accuracy weighting (lower accuracy = higher priority)
      // Scale: 0% accuracy = 100 priority, 100% accuracy = 0 priority
      const accuracyPriority = Math.max(0, 100 - accuracy);

      // Engagement weighting (more questions = slightly higher priority)
      // This ensures modes user engage with get recommended
      const engagementWeight = Math.min(totalQuestions / 50, 1) * 20;

      // Combined priority
      priority = accuracyPriority + engagementWeight;
    }

    // Adjust priority based on overall strength (low overall strength = boost all priorities)
    if (overallStrength < 50 && totalQuestions > 0) {
      priority *= 1.2;
    }

    // Round priority to integer for cleaner output
    priority = Math.round(priority);

    const reason = generateReason(mode, accuracy, totalQuestions, 0);

    return {
      mode,
      preferred: false,
      reason,
      priority,
    };
  });

  // Sort by priority descending
  recommendations.sort((a, b) => b.priority - a.priority);

  // Mark the top priority mode as preferred
  if (recommendations.length > 0) {
    recommendations[0].preferred = true;
  }

  return recommendations;
}

/**
 * Hook that generates practice mode recommendations based on user's learning statistics.
 * Derives recommendations from useProgressStats and useWeaknessStats.
 *
 * @returns Array of ModeRecommendation sorted by priority (highest first)
 */
export function useLearningRecommendations(): ModeRecommendation[] {
  const progressStats = useProgressStats();
  const { stats: weaknessStats } = useWeaknessStats();

  const recommendations = useMemo(
    () => getRecommendations(progressStats, weaknessStats),
    [progressStats, weaknessStats]
  );

  return recommendations;
}

export default useLearningRecommendations;