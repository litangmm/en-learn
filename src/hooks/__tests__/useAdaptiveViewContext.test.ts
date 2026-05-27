import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAdaptiveViewContext } from '../useAdaptiveViewContext';
import { useFlowState } from '../useFlowState';
import { useAdaptiveQuestionContext } from '../useAdaptiveQuestionContext';
import type { FlowState } from '@/hooks/useAdaptiveQuestionSelector';
import type { Weakness } from '@/data/types';

// Mock the dependencies
vi.mock('@/hooks/useFlowState');
vi.mock('@/hooks/useAdaptiveQuestionContext');

describe('useAdaptiveViewContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create mock flow state return
  const mockFlowState = (state: FlowState, recentAccuracy = 0.6) => ({
    flowState: state,
    fatigueSignals: [],
    recentAccuracy,
    recordCorrect: vi.fn(),
    recordWrong: vi.fn(),
    reset: vi.fn(),
    consecutiveErrors: 0,
  });

  // Helper to create mock adaptive question context return
  const mockAdaptiveContext = (weaknesses: Weakness[] = []) => ({
    context: {
      totalXP: 0,
      currentLevel: 1,
      currentStreak: 0,
      mistakes: [],
      weaknesses,
      recommendations: [],
      flowState: 'normal' as FlowState,
      fatigueSignals: [],
      updatedAt: Date.now(),
    },
    refresh: vi.fn(),
  });

  describe('initialization', () => {
    it('should initialize with normal flow state by default', () => {
      vi.mocked(useFlowState).mockReturnValue(mockFlowState('normal'));
      vi.mocked(useAdaptiveQuestionContext).mockReturnValue(mockAdaptiveContext());

      const { result } = renderHook(() => useAdaptiveViewContext());

      expect(result.current.flowState).toBe('normal');
      expect(result.current.difficultyLevel).toBe('normal');
    });

    it('should have empty recommended views when no weaknesses', () => {
      vi.mocked(useFlowState).mockReturnValue(mockFlowState('normal'));
      vi.mocked(useAdaptiveQuestionContext).mockReturnValue(mockAdaptiveContext([]));

      const { result } = renderHook(() => useAdaptiveViewContext());

      expect(result.current.recommendedViews).toEqual([]);
    });

    it('should have no weakness bias initially', () => {
      vi.mocked(useFlowState).mockReturnValue(mockFlowState('normal'));
      vi.mocked(useAdaptiveQuestionContext).mockReturnValue(mockAdaptiveContext());

      const { result } = renderHook(() => useAdaptiveViewContext());

      expect(result.current.hasWeaknessBias).toBe(false);
      expect(result.current.weaknessCount).toBe(0);
    });
  });

  describe('difficulty level derivation from flow state', () => {
    it('should map focused flow state to hard difficulty', () => {
      vi.mocked(useFlowState).mockReturnValue(mockFlowState('focused', 1.0));
      vi.mocked(useAdaptiveQuestionContext).mockReturnValue(mockAdaptiveContext());

      const { result } = renderHook(() => useAdaptiveViewContext());

      expect(result.current.difficultyLevel).toBe('hard');
      expect(result.current.flowState).toBe('focused');
    });

    it('should map normal flow state to normal difficulty', () => {
      vi.mocked(useFlowState).mockReturnValue(mockFlowState('normal', 0.6));
      vi.mocked(useAdaptiveQuestionContext).mockReturnValue(mockAdaptiveContext());

      const { result } = renderHook(() => useAdaptiveViewContext());

      expect(result.current.difficultyLevel).toBe('normal');
      expect(result.current.flowState).toBe('normal');
    });

    it('should map fatigued flow state to easy difficulty', () => {
      vi.mocked(useFlowState).mockReturnValue(mockFlowState('fatigued', 0.3));
      vi.mocked(useAdaptiveQuestionContext).mockReturnValue(mockAdaptiveContext());

      const { result } = renderHook(() => useAdaptiveViewContext());

      expect(result.current.difficultyLevel).toBe('easy');
      expect(result.current.flowState).toBe('fatigued');
    });
  });

  describe('priority adjustment derivation from flow state', () => {
    it('should set priority adjustment to 1.2 for focused state', () => {
      vi.mocked(useFlowState).mockReturnValue(mockFlowState('focused'));
      vi.mocked(useAdaptiveQuestionContext).mockReturnValue(mockAdaptiveContext());

      const { result } = renderHook(() => useAdaptiveViewContext());

      expect(result.current.priorityAdjustment).toBe(1.2);
    });

    it('should set priority adjustment to 1.0 for normal state', () => {
      vi.mocked(useFlowState).mockReturnValue(mockFlowState('normal'));
      vi.mocked(useAdaptiveQuestionContext).mockReturnValue(mockAdaptiveContext());

      const { result } = renderHook(() => useAdaptiveViewContext());

      expect(result.current.priorityAdjustment).toBe(1.0);
    });

    it('should set priority adjustment to 0.8 for fatigued state', () => {
      vi.mocked(useFlowState).mockReturnValue(mockFlowState('fatigued'));
      vi.mocked(useAdaptiveQuestionContext).mockReturnValue(mockAdaptiveContext());

      const { result } = renderHook(() => useAdaptiveViewContext());

      expect(result.current.priorityAdjustment).toBe(0.8);
    });
  });

  describe('weakness-based view recommendations', () => {
    it('should recommend practice view for high-error weaknesses', () => {
      vi.mocked(useFlowState).mockReturnValue(mockFlowState('normal'));
      vi.mocked(useAdaptiveQuestionContext).mockReturnValue(mockAdaptiveContext([
        { weakType: 'high-error' as const, dictionaryId: 'cet4', sentenceId: 's1', accuracy: 0.3, wrongCount: 5, correctCount: 2, reviewCount: 1, daysSinceLastReview: null, detectedAt: Date.now() },
      ]));

      const { result } = renderHook(() => useAdaptiveViewContext());

      expect(result.current.recommendedViews).toContain('practice');
    });

    it('should recommend learning view for low-accuracy weaknesses', () => {
      vi.mocked(useFlowState).mockReturnValue(mockFlowState('normal'));
      vi.mocked(useAdaptiveQuestionContext).mockReturnValue(mockAdaptiveContext([
        { weakType: 'low-accuracy' as const, dictionaryId: 'cet4', sentenceId: 's2', accuracy: 0.4, wrongCount: 3, correctCount: 2, reviewCount: 1, daysSinceLastReview: null, detectedAt: Date.now() },
      ]));

      const { result } = renderHook(() => useAdaptiveViewContext());

      expect(result.current.recommendedViews).toContain('learning');
    });

    it('should recommend review view for review-neglected weaknesses', () => {
      vi.mocked(useFlowState).mockReturnValue(mockFlowState('normal'));
      vi.mocked(useAdaptiveQuestionContext).mockReturnValue(mockAdaptiveContext([
        { weakType: 'review-neglected' as const, dictionaryId: 'cet4', sentenceId: 's3', accuracy: 0.5, wrongCount: 2, correctCount: 2, reviewCount: 1, daysSinceLastReview: 10, detectedAt: Date.now() },
      ]));

      const { result } = renderHook(() => useAdaptiveViewContext());

      expect(result.current.recommendedViews).toContain('review');
    });

    it('should recommend modes view for mode-weak weaknesses', () => {
      vi.mocked(useFlowState).mockReturnValue(mockFlowState('normal'));
      vi.mocked(useAdaptiveQuestionContext).mockReturnValue(mockAdaptiveContext([
        { weakType: 'mode-weak' as const, dictionaryId: 'cet4', sentenceId: 's4', accuracy: 0.6, wrongCount: 1, correctCount: 1, reviewCount: 1, daysSinceLastReview: null, detectedAt: Date.now() },
      ]));

      const { result } = renderHook(() => useAdaptiveViewContext());

      expect(result.current.recommendedViews).toContain('modes');
    });

    it('should recommend multiple views for multiple weakness types', () => {
      vi.mocked(useFlowState).mockReturnValue(mockFlowState('normal'));
      vi.mocked(useAdaptiveQuestionContext).mockReturnValue(mockAdaptiveContext([
        { weakType: 'high-error' as const, dictionaryId: 'cet4', sentenceId: 's5', accuracy: 0.3, wrongCount: 5, correctCount: 2, reviewCount: 1, daysSinceLastReview: null, detectedAt: Date.now() },
        { weakType: 'low-accuracy' as const, dictionaryId: 'cet4', sentenceId: 's6', accuracy: 0.4, wrongCount: 3, correctCount: 2, reviewCount: 1, daysSinceLastReview: null, detectedAt: Date.now() },
      ]));

      const { result } = renderHook(() => useAdaptiveViewContext());

      expect(result.current.recommendedViews).toContain('practice');
      expect(result.current.recommendedViews).toContain('learning');
      expect(result.current.weaknessCount).toBe(2);
    });

    it('should set hasWeaknessBias when more than 2 weaknesses', () => {
      vi.mocked(useFlowState).mockReturnValue(mockFlowState('normal'));
      vi.mocked(useAdaptiveQuestionContext).mockReturnValue(mockAdaptiveContext([
        { weakType: 'high-error' as const, dictionaryId: 'cet4', sentenceId: 's7', accuracy: 0.3, wrongCount: 5, correctCount: 2, reviewCount: 1, daysSinceLastReview: null, detectedAt: Date.now() },
        { weakType: 'low-accuracy' as const, dictionaryId: 'cet4', sentenceId: 's8', accuracy: 0.4, wrongCount: 3, correctCount: 2, reviewCount: 1, daysSinceLastReview: null, detectedAt: Date.now() },
        { weakType: 'review-neglected' as const, dictionaryId: 'cet4', sentenceId: 's9', accuracy: 0.5, wrongCount: 2, correctCount: 2, reviewCount: 1, daysSinceLastReview: 10, detectedAt: Date.now() },
      ]));

      const { result } = renderHook(() => useAdaptiveViewContext());

      expect(result.current.hasWeaknessBias).toBe(true);
      expect(result.current.weaknessCount).toBe(3);
    });
  });

  describe('flow-state-based view recommendations', () => {
    it('should recommend challenge and leaderboard for focused state', () => {
      vi.mocked(useFlowState).mockReturnValue(mockFlowState('focused'));
      vi.mocked(useAdaptiveQuestionContext).mockReturnValue(mockAdaptiveContext());

      const { result } = renderHook(() => useAdaptiveViewContext());

      expect(result.current.recommendedViews).toContain('challenge');
      expect(result.current.recommendedViews).toContain('leaderboard');
    });

    it('should recommend progress and achievement for fatigued state', () => {
      vi.mocked(useFlowState).mockReturnValue(mockFlowState('fatigued'));
      vi.mocked(useAdaptiveQuestionContext).mockReturnValue(mockAdaptiveContext());

      const { result } = renderHook(() => useAdaptiveViewContext());

      expect(result.current.recommendedViews).toContain('progress');
      expect(result.current.recommendedViews).toContain('achievement');
    });

    it('should not recommend flow-state views for normal state', () => {
      vi.mocked(useFlowState).mockReturnValue(mockFlowState('normal'));
      vi.mocked(useAdaptiveQuestionContext).mockReturnValue(mockAdaptiveContext());

      const { result } = renderHook(() => useAdaptiveViewContext());

      expect(result.current.recommendedViews).toEqual([]);
    });
  });

  describe('combined weakness and flow state recommendations', () => {
    it('should merge weakness and flow state recommended views', () => {
      vi.mocked(useFlowState).mockReturnValue(mockFlowState('focused'));
      vi.mocked(useAdaptiveQuestionContext).mockReturnValue(mockAdaptiveContext([
        { weakType: 'high-error' as const, dictionaryId: 'cet4', sentenceId: 's10', accuracy: 0.3, wrongCount: 5, correctCount: 2, reviewCount: 1, daysSinceLastReview: null, detectedAt: Date.now() },
      ]));

      const { result } = renderHook(() => useAdaptiveViewContext());

      // Should contain both weakness recommendation (practice) and flow state recommendations
      expect(result.current.recommendedViews).toContain('practice');
      expect(result.current.recommendedViews).toContain('challenge');
      expect(result.current.recommendedViews).toContain('leaderboard');
    });

    it('should deduplicate recommended views', () => {
      vi.mocked(useFlowState).mockReturnValue(mockFlowState('focused'));
      vi.mocked(useAdaptiveQuestionContext).mockReturnValue(mockAdaptiveContext([
        // A weakness that recommends 'challenge' would be deduplicated with flow state
        // But in this case we use 'practice' which isn't duplicated
        { weakType: 'high-error' as const, dictionaryId: 'cet4', sentenceId: 's11', accuracy: 0.3, wrongCount: 5, correctCount: 2, reviewCount: 1, daysSinceLastReview: null, detectedAt: Date.now() },
      ]));

      const { result } = renderHook(() => useAdaptiveViewContext());

      // No duplicates in recommended views
      const uniqueViews = [...new Set(result.current.recommendedViews)];
      expect(result.current.recommendedViews).toEqual(uniqueViews);
    });
  });

  describe('fatigue signals passthrough', () => {
    it('should pass through fatigue signals from flow state', () => {
      const mockFatigueSignals = [
        { type: 'accuracy' as const, trend: 'stable' as const, description: '正确率保持稳定', severity: 0.2 },
        { type: 'consecutive_errors' as const, trend: 'stable' as const, description: '答题状态良好', severity: 0 },
        { type: 'speed' as const, trend: 'stable' as const, description: '答题节奏稳定', severity: 0.1 },
      ];

      vi.mocked(useFlowState).mockReturnValue({
        ...mockFlowState('normal'),
        fatigueSignals: mockFatigueSignals,
      });
      vi.mocked(useAdaptiveQuestionContext).mockReturnValue(mockAdaptiveContext());

      const { result } = renderHook(() => useAdaptiveViewContext());

      expect(result.current.fatigueSignals).toEqual(mockFatigueSignals);
    });
  });

  describe('recent accuracy passthrough', () => {
    it('should pass through recent accuracy from flow state', () => {
      vi.mocked(useFlowState).mockReturnValue(mockFlowState('focused', 0.85));
      vi.mocked(useAdaptiveQuestionContext).mockReturnValue(mockAdaptiveContext());

      const { result } = renderHook(() => useAdaptiveViewContext());

      expect(result.current.recentAccuracy).toBe(0.85);
    });
  });

  describe('return value structure', () => {
    it('should include all required AdaptiveViewState fields', () => {
      vi.mocked(useFlowState).mockReturnValue(mockFlowState('normal'));
      vi.mocked(useAdaptiveQuestionContext).mockReturnValue(mockAdaptiveContext());

      const { result } = renderHook(() => useAdaptiveViewContext());

      // Verify all required fields are present
      expect(result.current).toHaveProperty('difficultyLevel');
      expect(result.current).toHaveProperty('priorityAdjustment');
      expect(result.current).toHaveProperty('recommendedViews');
      expect(result.current).toHaveProperty('flowState');
      expect(result.current).toHaveProperty('fatigueSignals');
      expect(result.current).toHaveProperty('hasWeaknessBias');
      expect(result.current).toHaveProperty('weaknessCount');
      expect(result.current).toHaveProperty('recentAccuracy');
    });

    it('should return correct types for all fields', () => {
      vi.mocked(useFlowState).mockReturnValue(mockFlowState('normal'));
      vi.mocked(useAdaptiveQuestionContext).mockReturnValue(mockAdaptiveContext());

      const { result } = renderHook(() => useAdaptiveViewContext());

      expect(typeof result.current.difficultyLevel).toBe('string');
      expect(typeof result.current.priorityAdjustment).toBe('number');
      expect(Array.isArray(result.current.recommendedViews)).toBe(true);
      expect(typeof result.current.hasWeaknessBias).toBe('boolean');
      expect(typeof result.current.weaknessCount).toBe('number');
      expect(typeof result.current.recentAccuracy).toBe('number');
    });
  });
});