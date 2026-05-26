import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdaptiveQuestionSelector } from '../useAdaptiveQuestionSelector';
import { storage } from '@/services/storage';
import { useQuestionWeighting } from '@/hooks/useQuestionWeighting';
import { useWeaknessDetection } from '@/hooks/useWeaknessDetection';

// Mock dependencies
vi.mock('@/hooks/useQuestionWeighting', () => ({
  useQuestionWeighting: vi.fn(),
}));

vi.mock('@/hooks/useWeaknessDetection', () => ({
  useWeaknessDetection: vi.fn(),
}));

const mockContext = {
  totalXP: 500,
  currentLevel: 5,
  currentStreak: 10,
  mistakes: [],
  weaknesses: [],
  recommendations: [
    {
      id: 'r1',
      type: 'weakness' as const,
      priority: 1 as const,
      reason: 'High error rate',
      targetSentenceId: 'w1',
      action: 'Focus on this',
    },
    {
      id: 'r2',
      type: 'weakness' as const,
      priority: 2 as const,
      reason: 'Low accuracy',
      targetSentenceId: 'w2',
      action: 'Practice more',
    },
    {
      id: 'r3',
      type: 'new-content' as const,
      priority: 3 as const,
      reason: 'New vocabulary',
      targetSentenceId: 'n1',
      action: 'Learn new',
    },
  ],
  flowState: 'normal' as const,
  fatigueSignals: [],
  updatedAt: Date.now(),
};

describe('useAdaptiveQuestionSelector', () => {
  const defaultSentenceIds = ['w1', 'w2', 'w3', 'n1', 'n2', 'n3'];

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(useQuestionWeighting).mockReturnValue({
      getSentenceWeight: vi.fn((sentenceId: string) => {
        // Return weight based on sentenceId for predictable testing
        const weightMap: Record<string, number> = {
          'w1': 3.5, // high weight (problematic)
          'w2': 2.0, // medium weight
          'w3': 1.0, // low weight (easy)
          'n1': 1.0, // new word (default)
          'n2': 1.0,
        };
        return weightMap[sentenceId] ?? 1.0;
      }),
      getWeightedSentenceIds: vi.fn(() => []),
      getWeightExplanation: vi.fn(() => ({
        sentenceId: '',
        totalWeight: 1.0,
        baseWeight: 1.0,
        mistakeWeight: 0,
        errorRateWeight: 0,
        spacedRepetitionModifier: 1.0,
        isNewWord: true,
        newWordPenalty: 0.6,
        spacedRepetitionState: 'new' as const,
        explanation: '',
      })),
    });

    vi.mocked(useWeaknessDetection).mockReturnValue([
      {
        sentenceId: 'w1',
        weakType: 'high-error' as const,
        accuracy: 0.3,
        wrongCount: 5,
        correctCount: 2,
        reviewCount: 1,
        daysSinceLastReview: 10,
        detectedAt: Date.now(),
        dictionaryId: 'cet4',
      },
      {
        sentenceId: 'w2',
        weakType: 'low-accuracy' as const,
        accuracy: 0.5,
        wrongCount: 2,
        correctCount: 2,
        reviewCount: 2,
        daysSinceLastReview: 3,
        detectedAt: Date.now(),
        dictionaryId: 'cet4',
      },
    ]);

    vi.spyOn(storage, 'getMistakes').mockReturnValue([]);
    vi.spyOn(storage, 'getAdaptiveQuestionContext').mockReturnValue(mockContext as typeof mockContext);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('strategy switching', () => {
    it('should start with balanced strategy by default', () => {
      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      expect(result.current.currentStrategy).toBe('balanced');
    });

    it('should allow setting strategy to priority', () => {
      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      act(() => {
        result.current.setStrategy('priority');
      });

      expect(result.current.currentStrategy).toBe('priority');
    });

    it('should allow setting strategy to balanced', () => {
      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      act(() => {
        result.current.setStrategy('balanced');
      });

      expect(result.current.currentStrategy).toBe('balanced');
    });

    it('should allow setting strategy to focus-weak', () => {
      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      act(() => {
        result.current.setStrategy('focus-weak');
      });

      expect(result.current.currentStrategy).toBe('focus-weak');
    });

    it('should use setStrategy for selection', () => {
      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      // Set to priority strategy
      act(() => {
        result.current.setStrategy('priority');
      });

      const selected = result.current.selectQuestions(defaultSentenceIds, 'priority');
      expect(selected.length).toBeGreaterThan(0);
    });
  });

  describe('priority strategy selection', () => {
    it('should return up to 5 sentences from recommendations', () => {
      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const selected = result.current.selectQuestions(defaultSentenceIds, 'priority');

      // Should include recommended sentences
      expect(selected.length).toBeLessThanOrEqual(5);
      expect(selected.length).toBeGreaterThan(0);
    });

    it('should prioritize recommendations by priority level', () => {
      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const selected = result.current.selectQuestions(defaultSentenceIds, 'priority');

      // w1 and w2 have priority 1 and 2, should be included
      expect(selected).toContain('w1');
      expect(selected).toContain('w2');
    });

    it('should fall back to available sentences when no recommendations', () => {
      vi.spyOn(storage, 'getAdaptiveQuestionContext').mockReturnValue({
        ...mockContext,
        recommendations: [],
      } as typeof mockContext);

      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const selected = result.current.selectQuestions(defaultSentenceIds, 'priority');

      // Should return first 5 from available
      expect(selected.length).toBe(5);
      expect(selected).toEqual(defaultSentenceIds.slice(0, 5));
    });

    it('should filter recommendations to only valid sentence IDs', () => {
      // Add recommendation for non-existent sentence
      const contextWithInvalidRec = {
        ...mockContext,
        recommendations: [
          ...mockContext.recommendations,
          {
            id: 'r4',
            type: 'weakness' as const,
            priority: 1 as const,
            reason: 'Test',
            targetSentenceId: 'non-existent',
            action: 'Test',
          },
        ],
      };
      vi.spyOn(storage, 'getAdaptiveQuestionContext').mockReturnValue(contextWithInvalidRec as typeof mockContext);

      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const selected = result.current.selectQuestions(defaultSentenceIds, 'priority');

      // Should not include non-existent sentence
      expect(selected).not.toContain('non-existent');
    });
  });

  describe('balanced strategy selection', () => {
    it('should return a mix of recommendations and high-weight sentences', () => {
      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const selected = result.current.selectQuestions(defaultSentenceIds, 'balanced');

      expect(selected.length).toBeGreaterThan(0);
      // Should include some recommended sentences
      expect(selected).toContain('w1'); // Recommended and high weight
    });

    it('should return all sentences when count <= 2', () => {
      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const selected = result.current.selectQuestions(['s1', 's2'], 'balanced');

      expect(selected).toEqual(['s1', 's2']);
    });

    it('should include up to 3 recommendations', () => {
      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const selected = result.current.selectQuestions(defaultSentenceIds, 'balanced');

      // Count how many recommendations are in the selection
      const recIds = mockContext.recommendations.map((r) => r.targetSentenceId);
      const recCount = selected.filter((id) => recIds.includes(id)).length;

      expect(recCount).toBeLessThanOrEqual(3);
    });

    it('should fill remaining slots with high-weight sentences', () => {
      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const selected = result.current.selectQuestions(defaultSentenceIds, 'balanced');

      // Should have up to 5 items total
      expect(selected.length).toBeLessThanOrEqual(5);
    });
  });

  describe('focus-weak strategy selection', () => {
    it('should only return sentences with weaknesses', () => {
      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const selected = result.current.selectQuestions(defaultSentenceIds, 'focus-weak');

      // Should only include w1 and w2 (the weakness sentences)
      selected.forEach((id) => {
        expect(['w1', 'w2']).toContain(id);
      });
    });

    it('should sort weak sentences by weight (highest first)', () => {
      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const selected = result.current.selectQuestions(defaultSentenceIds, 'focus-weak');

      // w1 has higher weight (3.5) than w2 (2.0), so should come first
      const w1Index = selected.indexOf('w1');
      const w2Index = selected.indexOf('w2');

      if (w1Index !== -1 && w2Index !== -1) {
        expect(w1Index).toBeLessThan(w2Index);
      }
    });

    it('should fall back to weighted selection when no weaknesses', () => {
      vi.mocked(useWeaknessDetection).mockReturnValue([]);

      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const selected = result.current.selectQuestions(defaultSentenceIds, 'focus-weak');

      // Should return up to 5 sentences (weighted selection fallback)
      expect(selected.length).toBeLessThanOrEqual(5);
    });

    it('should return weighted selection sorted by weight', () => {
      vi.mocked(useWeaknessDetection).mockReturnValue([]);

      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const selected = result.current.selectQuestions(defaultSentenceIds, 'focus-weak');

      // Since w1 has highest weight, it should be first
      expect(selected[0]).toBe('w1');
    });
  });

  describe('flow state integration', () => {
    it('should apply focused flow state adjustments', () => {
      const focusedContext = { ...mockContext, flowState: 'focused' as const };
      vi.spyOn(storage, 'getAdaptiveQuestionContext').mockReturnValue(focusedContext as typeof mockContext);

      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const selected = result.current.selectQuestions(defaultSentenceIds, 'priority');

      expect(selected.length).toBeGreaterThan(0);
    });

    it('should apply normal flow state (no change)', () => {
      const normalContext = { ...mockContext, flowState: 'normal' as const };
      vi.spyOn(storage, 'getAdaptiveQuestionContext').mockReturnValue(normalContext as typeof mockContext);

      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const selected = result.current.selectQuestions(defaultSentenceIds, 'priority');

      // Normal state should return recommendations in order
      expect(selected).toContain('w1');
    });

    it('should apply fatigued flow state adjustments', () => {
      const fatiguedContext = { ...mockContext, flowState: 'fatigued' as const };
      vi.spyOn(storage, 'getAdaptiveQuestionContext').mockReturnValue(fatiguedContext as typeof mockContext);

      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const selected = result.current.selectQuestions(defaultSentenceIds, 'balanced');

      // Fatigued state should de-prioritize difficult content
      expect(selected.length).toBeGreaterThan(0);
    });

    it('should handle empty flow state as normal', () => {
      vi.spyOn(storage, 'getAdaptiveQuestionContext').mockReturnValue({
        ...mockContext,
        flowState: undefined,
      } as unknown as typeof mockContext);

      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const selected = result.current.selectQuestions(defaultSentenceIds, 'balanced');

      expect(selected.length).toBeGreaterThan(0);
    });
  });

  describe('getPriorityScore calculation', () => {
    it('should calculate priority score for recommended sentence', () => {
      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const score = result.current.getPriorityScore('w1');

      expect(score.sentenceId).toBe('w1');
      expect(score.recommendationPriority).toBe(1);
      expect(score.weight).toBe(3.5);
      expect(score.weaknessMultiplier).toBeGreaterThan(1.0);
    });

    it('should give 0 recommendation priority for non-recommended sentence', () => {
      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const score = result.current.getPriorityScore('n2');

      expect(score.sentenceId).toBe('n2');
      expect(score.recommendationPriority).toBe(0);
    });

    it('should apply weakness multipliers correctly', () => {
      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      // w1 is high-error weakness (should get 1.5 multiplier)
      const highErrorScore = result.current.getPriorityScore('w1');
      expect(highErrorScore.weaknessMultiplier).toBe(1.5);

      // w2 is low-accuracy weakness (should get 1.3 multiplier)
      const lowAccuracyScore = result.current.getPriorityScore('w2');
      expect(lowAccuracyScore.weaknessMultiplier).toBe(1.3);
    });

    it('should apply flow modifiers based on flow state', () => {
      // Focused state
      vi.spyOn(storage, 'getAdaptiveQuestionContext').mockReturnValue({
        ...mockContext,
        flowState: 'focused' as const,
      } as typeof mockContext);

      const { result: focusedResult } = renderHook(() => useAdaptiveQuestionSelector());

      // High weight in focused state
      const focusedHighScore = focusedResult.current.getPriorityScore('w1');
      expect(focusedHighScore.flowModifier).toBe(1.3);

      // Low weight in focused state
      const focusedLowScore = focusedResult.current.getPriorityScore('n1');
      expect(focusedLowScore.flowModifier).toBe(0.9);

      // Fatigued state
      vi.spyOn(storage, 'getAdaptiveQuestionContext').mockReturnValue({
        ...mockContext,
        flowState: 'fatigued' as const,
      } as typeof mockContext);

      const { result: fatiguedResult } = renderHook(() => useAdaptiveQuestionSelector());

      // High weight in fatigued state (should be reduced)
      const fatiguedHighScore = fatiguedResult.current.getPriorityScore('w1');
      expect(fatiguedHighScore.flowModifier).toBe(0.7);

      // Low weight in fatigued state (should be boosted)
      const fatiguedLowScore = fatiguedResult.current.getPriorityScore('n1');
      expect(fatiguedLowScore.flowModifier).toBe(1.2);
    });

    it('should calculate total score correctly', () => {
      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const score = result.current.getPriorityScore('w1');

      // totalScore = (weight * weaknessMultiplier * flowModifier) + (4 - recommendationPriority)
      // = (3.5 * 1.5 * 1.0) + (4 - 1) = 5.25 + 3 = 8.25
      expect(score.totalScore).toBeCloseTo(8.25, 1);
    });
  });

  describe('helper methods', () => {
    it('should get all weakness sentence IDs', () => {
      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const weaknessIds = result.current.getWeaknessSentenceIds();

      expect(weaknessIds).toContain('w1');
      expect(weaknessIds).toContain('w2');
      expect(weaknessIds).not.toContain('n1');
    });

    it('should get all recommended sentence IDs', () => {
      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const recommendedIds = result.current.getRecommendedSentenceIds();

      expect(recommendedIds).toContain('w1');
      expect(recommendedIds).toContain('w2');
      expect(recommendedIds).toContain('n1');
      expect(recommendedIds.length).toBe(3);
    });
  });

  describe('edge cases', () => {
    it('should handle empty sentenceIds array', () => {
      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const selected = result.current.selectQuestions([], 'priority');

      expect(selected).toEqual([]);
    });

    it('should handle single sentence', () => {
      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const selected = result.current.selectQuestions(['only-one'], 'priority');

      expect(selected).toEqual(['only-one']);
    });

    it('should handle no recommendations', () => {
      vi.spyOn(storage, 'getAdaptiveQuestionContext').mockReturnValue({
        ...mockContext,
        recommendations: [],
      } as typeof mockContext);

      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const selected = result.current.selectQuestions(defaultSentenceIds, 'balanced');

      // Should still work, falling back to weighted selection
      expect(selected.length).toBeGreaterThan(0);
    });

    it('should handle no weaknesses', () => {
      vi.mocked(useWeaknessDetection).mockReturnValue([]);

      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const weaknessIds = result.current.getWeaknessSentenceIds();

      expect(weaknessIds).toEqual([]);
    });

    it('should handle storage errors gracefully', () => {
      vi.spyOn(storage, 'getAdaptiveQuestionContext').mockImplementation(() => {
        throw new Error('Storage error');
      });
      vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      // Should still work with defaults
      const selected = result.current.selectQuestions(defaultSentenceIds, 'balanced');
      expect(selected.length).toBeGreaterThan(0);
    });

    it('should handle unknown weakness types', () => {
      vi.mocked(useWeaknessDetection).mockReturnValue([
        {
          sentenceId: 'unknown-type',
          weakType: 'mode-weak' as const, // Should get 1.1 multiplier
          accuracy: 0.4,
          wrongCount: 3,
          correctCount: 2,
          reviewCount: 1,
          daysSinceLastReview: 5,
          detectedAt: Date.now(),
          dictionaryId: 'cet4',
        },
      ]);

      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const score = result.current.getPriorityScore('unknown-type');
      expect(score.weaknessMultiplier).toBe(1.1);
    });

    it('should use balanced as default for unknown strategy', () => {
      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      // @ts-expect-error - testing fallback behavior with invalid strategy
      const selected = result.current.selectQuestions(defaultSentenceIds, 'unknown');

      // Should still return results (defaulting to balanced)
      expect(selected.length).toBeGreaterThan(0);
    });

    it('should handle context with missing recommendations', () => {
      vi.spyOn(storage, 'getAdaptiveQuestionContext').mockReturnValue({
        ...mockContext,
        recommendations: undefined,
      } as unknown as typeof mockContext);

      const { result } = renderHook(() => useAdaptiveQuestionSelector());

      const recommendedIds = result.current.getRecommendedSentenceIds();

      expect(recommendedIds).toEqual([]);
    });
  });
});