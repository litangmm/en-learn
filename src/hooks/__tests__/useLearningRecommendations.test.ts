import { describe, it, expect } from 'vitest';
import { getRecommendations } from '../useLearningRecommendations';
import type { ProgressStats } from '../useProgressStats';
import type { WeaknessStats } from '@/data/types';

/**
 * Helper to create a minimal ProgressStats object for testing.
 */
function createProgressStats(modeAccuracy: ProgressStats['modeAccuracy'] = []): ProgressStats {
  return {
    xp: { totalXP: 0, currentLevel: 1, levelProgress: 0 },
    level: 1,
    totalXP: 0,
    currentXP: 0,
    progressToNextLevel: 0,
    learningDays: 0,
    totalAccuracy: 0,
    completedDictionaries: 0,
    totalQuestions: 0,
    totalCorrect: 0,
    modeAccuracy,
  };
}

/**
 * Helper to create a WeaknessStats object for testing.
 */
function createWeaknessStats(overallStrength: number = 50): WeaknessStats {
  return {
    totalWeakCount: 0,
    byDictionary: {},
    byType: { 'high-error': 0, 'low-accuracy': 0, 'review-neglected': 0, 'mode-weak': 0 },
    overallStrength,
  };
}

describe('getRecommendations', () => {
  describe('All modes same accuracy', () => {
    it('should give all modes similar priority when accuracy is equal', () => {
      const stats = createProgressStats([
        { mode: 'fill-in-blanks', accuracy: 50, totalQuestions: 10, correctCount: 5 },
        { mode: 'multiple-choice', accuracy: 50, totalQuestions: 10, correctCount: 5 },
        { mode: 'sentence-reorder', accuracy: 50, totalQuestions: 10, correctCount: 5 },
        { mode: 'dictation', accuracy: 50, totalQuestions: 10, correctCount: 5 },
      ]);
      const weaknessStats = createWeaknessStats(50);

      const recommendations = getRecommendations(stats, weaknessStats);

      // All modes should have similar priority (within 5 due to engagement weight variance)
      const priorities = recommendations.map((r) => r.priority);
      const maxPriority = Math.max(...priorities);
      const minPriority = Math.min(...priorities);

      // With same accuracy and same questions, priorities should be very close
      expect(maxPriority - minPriority).toBeLessThanOrEqual(5);
    });

    it('should mark the first mode as preferred when priorities are equal', () => {
      const stats = createProgressStats([
        { mode: 'fill-in-blanks', accuracy: 50, totalQuestions: 10, correctCount: 5 },
        { mode: 'multiple-choice', accuracy: 50, totalQuestions: 10, correctCount: 5 },
        { mode: 'sentence-reorder', accuracy: 50, totalQuestions: 10, correctCount: 5 },
        { mode: 'dictation', accuracy: 50, totalQuestions: 10, correctCount: 5 },
      ]);
      const weaknessStats = createWeaknessStats(50);

      const recommendations = getRecommendations(stats, weaknessStats);

      // Exactly one should be preferred
      const preferredCount = recommendations.filter((r) => r.preferred).length;
      expect(preferredCount).toBe(1);
      // First item (sorted by priority) should be preferred
      expect(recommendations[0].preferred).toBe(true);
    });
  });

  describe('All accuracy = 0 (no questions)', () => {
    it('should give all modes priority=10 when no questions answered', () => {
      const stats = createProgressStats([
        { mode: 'fill-in-blanks', accuracy: 0, totalQuestions: 0, correctCount: 0 },
        { mode: 'multiple-choice', accuracy: 0, totalQuestions: 0, correctCount: 0 },
        { mode: 'sentence-reorder', accuracy: 0, totalQuestions: 0, correctCount: 0 },
        { mode: 'dictation', accuracy: 0, totalQuestions: 0, correctCount: 0 },
      ]);
      const weaknessStats = createWeaknessStats(50);

      const recommendations = getRecommendations(stats, weaknessStats);

      // All should have priority 10 when no questions
      recommendations.forEach((r) => {
        expect(r.priority).toBe(10);
      });
    });

    it('should mark the first mode as preferred', () => {
      const stats = createProgressStats([
        { mode: 'fill-in-blanks', accuracy: 0, totalQuestions: 0, correctCount: 0 },
        { mode: 'multiple-choice', accuracy: 0, totalQuestions: 0, correctCount: 0 },
      ]);
      const weaknessStats = createWeaknessStats(50);

      const recommendations = getRecommendations(stats, weaknessStats);

      expect(recommendations[0].preferred).toBe(true);
    });
  });

  describe('No weaknesses (high overall strength)', () => {
    it('should work fine with overallStrength = 100', () => {
      const stats = createProgressStats([
        { mode: 'fill-in-blanks', accuracy: 85, totalQuestions: 20, correctCount: 17 },
        { mode: 'multiple-choice', accuracy: 80, totalQuestions: 15, correctCount: 12 },
        { mode: 'sentence-reorder', accuracy: 90, totalQuestions: 10, correctCount: 9 },
        { mode: 'dictation', accuracy: 75, totalQuestions: 25, correctCount: 19 },
      ]);
      const weaknessStats = createWeaknessStats(100);

      const recommendations = getRecommendations(stats, weaknessStats);

      // Should still generate recommendations without errors
      expect(recommendations).toHaveLength(4);
      // All should have valid priorities
      recommendations.forEach((r) => {
        expect(typeof r.priority).toBe('number');
        expect(r.priority).toBeGreaterThanOrEqual(0);
      });
    });

    it('should generate positive reason for high accuracy mode', () => {
      const stats = createProgressStats([
        { mode: 'fill-in-blanks', accuracy: 85, totalQuestions: 20, correctCount: 17 },
      ]);
      const weaknessStats = createWeaknessStats(100);

      const recommendations = getRecommendations(stats, weaknessStats);

      const recommendation = recommendations.find((r) => r.mode === 'fill-in-blanks');
      expect(recommendation?.reason).toContain('表现不错');
      expect(recommendation?.reason).toContain('85%');
    });
  });

  describe('Low overall strength', () => {
    it('should boost all priorities by 1.2x when overallStrength < 50', () => {
      const stats = createProgressStats([
        { mode: 'fill-in-blanks', accuracy: 50, totalQuestions: 20, correctCount: 10 },
      ]);
      const weaknessStats = createWeaknessStats(40);

      const recommendations = getRecommendations(stats, weaknessStats);

      const recommendation = recommendations.find((r) => r.mode === 'fill-in-blanks');
      // Without boost: 100 - 50 = 50 + engagement(20 * 0.4 = 8) = 58, rounded = 58
      // With 1.2x boost: 58 * 1.2 = 69.6, rounded = 70
      expect(recommendation?.priority).toBe(70);
    });

    it('should not boost priorities when overallStrength >= 50', () => {
      const stats = createProgressStats([
        { mode: 'fill-in-blanks', accuracy: 50, totalQuestions: 20, correctCount: 10 },
      ]);
      const weaknessStats = createWeaknessStats(50);

      const recommendations = getRecommendations(stats, weaknessStats);

      const recommendation = recommendations.find((r) => r.mode === 'fill-in-blanks');
      // Without boost: 100 - 50 = 50 + engagement(20 * 0.4 = 8) = 58, rounded = 58
      expect(recommendation?.priority).toBe(58);
    });
  });

  describe('Different accuracies', () => {
    it('should give lower accuracy modes higher priority', () => {
      const stats = createProgressStats([
        { mode: 'fill-in-blanks', accuracy: 90, totalQuestions: 20, correctCount: 18 },
        { mode: 'multiple-choice', accuracy: 50, totalQuestions: 20, correctCount: 10 },
        { mode: 'sentence-reorder', accuracy: 30, totalQuestions: 20, correctCount: 6 },
        { mode: 'dictation', accuracy: 70, totalQuestions: 20, correctCount: 14 },
      ]);
      const weaknessStats = createWeaknessStats(50);

      const recommendations = getRecommendations(stats, weaknessStats);

      // Sort by priority descending
      const sortedByPriority = [...recommendations].sort((a, b) => b.priority - a.priority);

      // sentence-reorder (30%) should be highest priority
      expect(sortedByPriority[0].mode).toBe('sentence-reorder');
      // fill-in-blanks (90%) should be lowest priority
      expect(sortedByPriority[sortedByPriority.length - 1].mode).toBe('fill-in-blanks');
    });

    it('should generate appropriate reasons for different accuracy levels', () => {
      const stats = createProgressStats([
        { mode: 'fill-in-blanks', accuracy: 85, totalQuestions: 20, correctCount: 17 },
        { mode: 'multiple-choice', accuracy: 55, totalQuestions: 20, correctCount: 11 },
        { mode: 'sentence-reorder', accuracy: 35, totalQuestions: 20, correctCount: 7 },
      ]);
      const weaknessStats = createWeaknessStats(50);

      const recommendations = getRecommendations(stats, weaknessStats);

      const highAcc = recommendations.find((r) => r.mode === 'fill-in-blanks');
      const medAcc = recommendations.find((r) => r.mode === 'multiple-choice');
      const lowAcc = recommendations.find((r) => r.mode === 'sentence-reorder');

      expect(highAcc?.reason).toContain('表现不错');
      expect(medAcc?.reason).toContain('需要更多练习');
      expect(lowAcc?.reason).toContain('需要重点加强');
    });
  });

  describe('No data at all', () => {
    it('should handle empty modeAccuracy array', () => {
      const stats = createProgressStats([]);
      const weaknessStats = createWeaknessStats(50);

      const recommendations = getRecommendations(stats, weaknessStats);

      // Should still return all modes
      expect(recommendations).toHaveLength(4);
      // All should have priority 10 (no questions = no data)
      recommendations.forEach((r) => {
        expect(r.priority).toBe(10);
      });
    });

    it('should generate "你还没有练习过" reason for modes with no data', () => {
      const stats = createProgressStats([]);
      const weaknessStats = createWeaknessStats(50);

      const recommendations = getRecommendations(stats, weaknessStats);

      recommendations.forEach((r) => {
        expect(r.reason).toContain('你还没有练习过');
      });
    });

    it('should mark the first mode as preferred with no data', () => {
      const stats = createProgressStats([]);
      const weaknessStats = createWeaknessStats(50);

      const recommendations = getRecommendations(stats, weaknessStats);

      expect(recommendations[0].preferred).toBe(true);
    });
  });

  describe('Priority calculation edge cases', () => {
    it('should handle 100% accuracy (highest possible)', () => {
      const stats = createProgressStats([
        { mode: 'fill-in-blanks', accuracy: 100, totalQuestions: 50, correctCount: 50 },
      ]);
      const weaknessStats = createWeaknessStats(50);

      const recommendations = getRecommendations(stats, weaknessStats);

      const recommendation = recommendations.find((r) => r.mode === 'fill-in-blanks');
      // 100% accuracy = 0 priority from accuracy, plus engagement weight
      // engagement = Math.min(50/50, 1) * 20 = 20
      expect(recommendation?.priority).toBe(20);
    });

    it('should handle 0% accuracy (lowest possible)', () => {
      const stats = createProgressStats([
        { mode: 'fill-in-blanks', accuracy: 0, totalQuestions: 50, correctCount: 0 },
      ]);
      const weaknessStats = createWeaknessStats(50);

      const recommendations = getRecommendations(stats, weaknessStats);

      const recommendation = recommendations.find((r) => r.mode === 'fill-in-blanks');
      // 0% accuracy = 100 priority from accuracy, plus engagement weight
      // 100 + 20 = 120
      expect(recommendation?.priority).toBe(120);
    });

    it('should cap engagement weight at 1.0', () => {
      const stats = createProgressStats([
        { mode: 'fill-in-blanks', accuracy: 50, totalQuestions: 100, correctCount: 50 },
      ]);
      const weaknessStats = createWeaknessStats(50);

      const recommendations = getRecommendations(stats, weaknessStats);

      const recommendation = recommendations.find((r) => r.mode === 'fill-in-blanks');
      // engagement = Math.min(100/50, 1) * 20 = 20 (capped)
      // 50 + 20 = 70
      expect(recommendation?.priority).toBe(70);
    });
  });

  describe('Sorting and preferred logic', () => {
    it('should sort recommendations by priority descending', () => {
      const stats = createProgressStats([
        { mode: 'fill-in-blanks', accuracy: 90, totalQuestions: 20, correctCount: 18 },
        { mode: 'multiple-choice', accuracy: 30, totalQuestions: 20, correctCount: 6 },
        { mode: 'sentence-reorder', accuracy: 70, totalQuestions: 20, correctCount: 14 },
        { mode: 'dictation', accuracy: 50, totalQuestions: 20, correctCount: 10 },
      ]);
      const weaknessStats = createWeaknessStats(50);

      const recommendations = getRecommendations(stats, weaknessStats);

      // Verify descending order
      for (let i = 0; i < recommendations.length - 1; i++) {
        expect(recommendations[i].priority).toBeGreaterThanOrEqual(
          recommendations[i + 1].priority
        );
      }
    });

    it('should only mark the top priority mode as preferred', () => {
      const stats = createProgressStats([
        { mode: 'fill-in-blanks', accuracy: 30, totalQuestions: 20, correctCount: 6 },
        { mode: 'multiple-choice', accuracy: 50, totalQuestions: 20, correctCount: 10 },
        { mode: 'sentence-reorder', accuracy: 70, totalQuestions: 20, correctCount: 14 },
        { mode: 'dictation', accuracy: 90, totalQuestions: 20, correctCount: 18 },
      ]);
      const weaknessStats = createWeaknessStats(50);

      const recommendations = getRecommendations(stats, weaknessStats);

      const preferredCount = recommendations.filter((r) => r.preferred).length;
      expect(preferredCount).toBe(1);
      expect(recommendations[0].mode).toBe('fill-in-blanks');
      expect(recommendations[0].preferred).toBe(true);
    });
  });

  describe('Reason generation', () => {
    it('should include mode label in reason', () => {
      const stats = createProgressStats([
        { mode: 'fill-in-blanks', accuracy: 50, totalQuestions: 10, correctCount: 5 },
      ]);
      const weaknessStats = createWeaknessStats(50);

      const recommendations = getRecommendations(stats, weaknessStats);

      const recommendation = recommendations.find((r) => r.mode === 'fill-in-blanks');
      expect(recommendation?.reason).toContain('填空');
    });

    it('should generate different reasons based on accuracy thresholds', () => {
      const testCases = [
        { accuracy: 35, expectedReason: '需要重点加强' },
        { accuracy: 55, expectedReason: '需要更多练习' },
        { accuracy: 70, expectedReason: '可以继续巩固' },
        { accuracy: 80, expectedReason: '表现不错' },
      ];

      for (const { accuracy, expectedReason } of testCases) {
        const stats = createProgressStats([
          { mode: 'fill-in-blanks', accuracy, totalQuestions: 10, correctCount: Math.floor(accuracy / 10) },
        ]);
        const weaknessStats = createWeaknessStats(50);

        const recommendations = getRecommendations(stats, weaknessStats);
        const recommendation = recommendations.find((r) => r.mode === 'fill-in-blanks');

        expect(recommendation?.reason).toContain(expectedReason);
        expect(recommendation?.reason).toContain(String(accuracy));
      }
    });

    it('should use different message when overall strength is low but accuracy is good', () => {
      const stats = createProgressStats([
        { mode: 'fill-in-blanks', accuracy: 80, totalQuestions: 10, correctCount: 8 },
      ]);
      const weaknessStats = createWeaknessStats(40);

      const recommendations = getRecommendations(stats, weaknessStats);

      const recommendation = recommendations.find((r) => r.mode === 'fill-in-blanks');
      expect(recommendation?.reason).toContain('整体偏弱需继续努力');
    });
  });
});