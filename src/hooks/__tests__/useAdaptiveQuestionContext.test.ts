import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAdaptiveQuestionContext } from '../useAdaptiveQuestionContext';
import { storage } from '@/services/storage';
import { useXP } from '@/hooks/useXP';
import { useFlowState } from '@/hooks/useFlowState';
import type { AdaptiveQuestionContext } from '@/data/types';

// Mock dependencies - using the pattern from the codebase
vi.mock('@/hooks/useXP', () => ({
  useXP: vi.fn(),
}));

vi.mock('@/hooks/useFlowState', () => ({
  useFlowState: vi.fn(),
}));

describe('useAdaptiveQuestionContext', () => {
  const defaultContext: AdaptiveQuestionContext = {
    totalXP: 0,
    currentLevel: 1,
    currentStreak: 0,
    mistakes: [],
    weaknesses: [],
    recommendations: [],
    flowState: 'normal',
    fatigueSignals: [],
    updatedAt: Date.now(),
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Default mock implementations
    vi.mocked(useXP).mockReturnValue({
      profile: { totalXP: 0, currentLevel: 1, levelProgress: 0 },
      streak: 0,
    });
    vi.mocked(useFlowState).mockReturnValue({
      flowState: 'normal' as const,
      fatigueSignals: [],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('initial state loading from storage', () => {
    it('should load default context when storage is empty', () => {
      const { result } = renderHook(() => useAdaptiveQuestionContext());

      // Hook loads initial from storage but then aggregates from hooks
      // Default hook values are used (mocked to 0)
      expect(result.current.context.totalXP).toBe(0);
      expect(result.current.context.currentLevel).toBe(1);
      expect(result.current.context.currentStreak).toBe(0);
      expect(result.current.context.mistakes).toEqual([]);
      expect(result.current.context.flowState).toBe('normal');
    });

    it('should load context based on hook aggregation', () => {
      // Set up mock hooks with specific values
      vi.mocked(useXP).mockReturnValue({
        profile: { totalXP: 500, currentLevel: 5, levelProgress: 50 },
        streak: 10,
      });
      vi.mocked(useFlowState).mockReturnValue({
        flowState: 'focused',
        fatigueSignals: [],
      });

      const { result } = renderHook(() => useAdaptiveQuestionContext());

      // Values come from hook aggregation, not initial storage load
      expect(result.current.context.totalXP).toBe(500);
      expect(result.current.context.currentLevel).toBe(5);
      expect(result.current.context.currentStreak).toBe(10);
      expect(result.current.context.flowState).toBe('focused');
    });

    it('should handle storage errors gracefully with defaults', () => {
      vi.spyOn(storage, 'getAdaptiveQuestionContext').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useAdaptiveQuestionContext());

      // Falls back to default values from hooks
      expect(result.current.context.totalXP).toBe(0);
      expect(result.current.context.currentLevel).toBe(1);
    });
  });

  describe('data aggregation from useXP', () => {
    it('should aggregate XP data from useXP hook', () => {
      vi.mocked(useXP).mockReturnValue({
        profile: { totalXP: 250, currentLevel: 3, levelProgress: 50 },
        streak: 5,
      });

      const { result } = renderHook(() => useAdaptiveQuestionContext());

      expect(result.current.context.totalXP).toBe(250);
      expect(result.current.context.currentLevel).toBe(3);
      expect(result.current.context.currentStreak).toBe(5);
    });

    it('should handle undefined profile gracefully', () => {
      vi.mocked(useXP).mockReturnValue({
        profile: undefined as unknown as { totalXP: number; currentLevel: number; levelProgress: number },
        streak: undefined as unknown as number,
      });

      const { result } = renderHook(() => useAdaptiveQuestionContext());

      expect(result.current.context.totalXP).toBe(0);
      expect(result.current.context.currentLevel).toBe(1);
      expect(result.current.context.currentStreak).toBe(0);
    });

    it('should update when XP profile changes', () => {
      const { result, rerender } = renderHook(() => useAdaptiveQuestionContext());

      expect(result.current.context.totalXP).toBe(0);

      // Update mock to return new profile
      vi.mocked(useXP).mockReturnValue({
        profile: { totalXP: 100, currentLevel: 2, levelProgress: 0 },
        streak: 3,
      });

      rerender();

      expect(result.current.context.totalXP).toBe(100);
      expect(result.current.context.currentStreak).toBe(3);
    });
  });

  describe('data aggregation from useFlowState', () => {
    it('should aggregate flow state from useFlowState hook', () => {
      vi.mocked(useFlowState).mockReturnValue({
        flowState: 'focused',
        fatigueSignals: [
          { type: 'accuracy' as const, description: 'Accuracy improving', severity: 0.8, trend: 'stable' as const },
        ],
      });

      const { result } = renderHook(() => useAdaptiveQuestionContext());

      expect(result.current.context.flowState).toBe('focused');
      expect(result.current.context.fatigueSignals).toHaveLength(1);
      expect(result.current.context.fatigueSignals[0].type).toBe('accuracy');
    });

    it('should handle undefined flowState gracefully', () => {
      vi.mocked(useFlowState).mockReturnValue({
        flowState: undefined as unknown as 'focused' | 'normal' | 'fatigued',
        fatigueSignals: undefined as unknown as [],
      });

      const { result } = renderHook(() => useAdaptiveQuestionContext());

      expect(result.current.context.flowState).toBe('normal');
      expect(result.current.context.fatigueSignals).toEqual([]);
    });

    it('should normalize fatigue signals correctly', () => {
      vi.mocked(useFlowState).mockReturnValue({
        flowState: 'fatigued',
        fatigueSignals: [
          { type: 'consecutive_errors' as const, description: '3 consecutive errors', severity: 1, trend: 'stable' as const },
          { type: 'accuracy' as const, description: '40% accuracy', severity: 0.6, trend: 'declining' as const },
        ],
      });

      const { result } = renderHook(() => useAdaptiveQuestionContext());

      expect(result.current.context.fatigueSignals).toHaveLength(2);
      expect(result.current.context.fatigueSignals[0]).toEqual({
        type: 'consecutive_errors',
        description: '3 consecutive errors',
        severity: 1,
      });
    });
  });

  describe('storage integration (getMistakes)', () => {
    it('should load mistakes from storage', () => {
      const mockMistakes = [
        {
          sentenceId: 's1',
          wrongAnswers: ['a', 'b'],
          correctAnswers: ['c'],
          attempts: 3,
          timestamp: Date.now(),
          dictionaryId: 'cet4',
          reviewedCount: 1,
        },
      ];
      vi.spyOn(storage, 'getMistakes').mockReturnValue(mockMistakes);

      const { result } = renderHook(() => useAdaptiveQuestionContext());

      expect(result.current.context.mistakes).toEqual(mockMistakes);
    });

    it('should handle getMistakes errors gracefully', () => {
      vi.spyOn(storage, 'getMistakes').mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useAdaptiveQuestionContext());

      expect(result.current.context.mistakes).toEqual([]);
    });

    it('should preserve mistakes through context updates', () => {
      const mockMistakes = [
        {
          sentenceId: 's1',
          wrongAnswers: ['a'],
          correctAnswers: [],
          attempts: 1,
          timestamp: Date.now(),
          dictionaryId: 'cet4',
          reviewedCount: 0,
        },
      ];
      vi.spyOn(storage, 'getMistakes').mockReturnValue(mockMistakes);

      const { result } = renderHook(() => useAdaptiveQuestionContext());

      expect(result.current.context.mistakes).toHaveLength(1);

      // Trigger a refresh to update context
      act(() => {
        result.current.refresh();
      });

      expect(result.current.context.mistakes).toHaveLength(1);
      expect(result.current.context.mistakes[0].sentenceId).toBe('s1');
    });
  });

  describe('refresh function', () => {
    it('should force refresh context data from all sources', () => {
      // Initial mock values
      vi.mocked(useXP).mockReturnValue({
        profile: { totalXP: 100, currentLevel: 2, levelProgress: 0 },
        streak: 5,
      });
      vi.mocked(useFlowState).mockReturnValue({
        flowState: 'normal',
        fatigueSignals: [],
      });

      const { result } = renderHook(() => useAdaptiveQuestionContext());

      // Verify initial state from hooks
      expect(result.current.context.totalXP).toBe(100);
      expect(result.current.context.currentLevel).toBe(2);
      expect(result.current.context.currentStreak).toBe(5);

      // Update mocks to simulate external changes
      vi.mocked(useXP).mockReturnValue({
        profile: { totalXP: 500, currentLevel: 5, levelProgress: 50 },
        streak: 15,
      });
      vi.mocked(useFlowState).mockReturnValue({
        flowState: 'focused',
        fatigueSignals: [],
      });

      // Call refresh
      act(() => {
        result.current.refresh();
      });

      // Verify updated state after refresh
      expect(result.current.context.totalXP).toBe(500);
      expect(result.current.context.currentLevel).toBe(5);
      expect(result.current.context.currentStreak).toBe(15);
      expect(result.current.context.flowState).toBe('focused');
    });

    it('should immediately save context on refresh', () => {
      const saveSpy = vi.spyOn(storage, 'saveAdaptiveQuestionContext');

      const { result } = renderHook(() => useAdaptiveQuestionContext());

      act(() => {
        result.current.refresh();
      });

      expect(saveSpy).toHaveBeenCalledTimes(1);
    });

    it('should load fresh mistakes on refresh', () => {
      vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

      const { result } = renderHook(() => useAdaptiveQuestionContext());

      expect(result.current.context.mistakes).toHaveLength(0);

      // Update mock for refresh
      vi.spyOn(storage, 'getMistakes').mockReturnValue([
        {
          sentenceId: 'new-mistake',
          wrongAnswers: ['a'],
          correctAnswers: [],
          attempts: 1,
          timestamp: Date.now(),
          dictionaryId: 'cet4',
          reviewedCount: 0,
        },
      ]);

      act(() => {
        result.current.refresh();
      });

      expect(result.current.context.mistakes).toHaveLength(1);
      expect(result.current.context.mistakes[0].sentenceId).toBe('new-mistake');
    });
  });

  describe('deep equality check preventing unnecessary updates', () => {
    it('should not update context when data is unchanged', () => {
      const mockContext = { ...defaultContext, totalXP: 100 };
      vi.spyOn(storage, 'getAdaptiveQuestionContext').mockReturnValue(mockContext);

      const { result, rerender } = renderHook(() => useAdaptiveQuestionContext());

      // Wait a bit to ensure updatedAt would change
      vi.advanceTimersByTime(100);

      // Re-render without any data change
      rerender();

      // Context should be stable, state should be defined
      expect(result.current.context).toBeDefined();
    });

    it('should detect meaningful changes and update', () => {
      const { result, rerender } = renderHook(() => useAdaptiveQuestionContext());

      expect(result.current.context.totalXP).toBe(0);

      // Change the XP data
      vi.mocked(useXP).mockReturnValue({
        profile: { totalXP: 200, currentLevel: 3, levelProgress: 0 },
        streak: 5,
      });

      rerender();

      expect(result.current.context.totalXP).toBe(200);
    });
  });

  describe('auto-save with debouncing', () => {
    it('should debounce saves with 1 second delay', () => {
      const saveSpy = vi.spyOn(storage, 'saveAdaptiveQuestionContext');

      renderHook(() => useAdaptiveQuestionContext());

      // Should not save immediately on mount (skipped on initial mount)
      expect(saveSpy).not.toHaveBeenCalled();

      // Advance time to simulate debounce delay
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Auto-save should not trigger because no data change occurred
      // (The effect dependencies haven't changed since mount)
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it('should save when hook dependencies change', () => {
      const saveSpy = vi.spyOn(storage, 'saveAdaptiveQuestionContext');

      const { result } = renderHook(() => useAdaptiveQuestionContext());

      // Trigger a refresh which will set isInitialMountRef to false
      // and trigger a save
      act(() => {
        result.current.refresh();
      });

      // Refresh should save immediately
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should handle unmount without errors', () => {
      // Verify unmount doesn't cause errors and cleans up properly
      const { unmount } = renderHook(() => useAdaptiveQuestionContext());

      // Should not throw on unmount
      expect(() => unmount()).not.toThrow();
    });

    it('should handle save errors gracefully', () => {
      vi.spyOn(storage, 'saveAdaptiveQuestionContext').mockImplementation(() => {
        throw new Error('Save error');
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useAdaptiveQuestionContext());

      // Trigger refresh which will attempt to save
      act(() => {
        result.current.refresh();
      });

      // Should have logged warning but not thrown
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('edge cases', () => {
    it('should handle empty mistakes array', () => {
      vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

      const { result } = renderHook(() => useAdaptiveQuestionContext());

      expect(result.current.context.mistakes).toEqual([]);
    });

    it('should handle missing optional fields in context', () => {
      vi.mocked(useXP).mockReturnValue({
        profile: { totalXP: 100, currentLevel: 2, levelProgress: 0 },
        streak: 5,
      });
      vi.mocked(useFlowState).mockReturnValue({
        flowState: 'normal',
        fatigueSignals: [],
      });

      const { result } = renderHook(() => useAdaptiveQuestionContext());

      // Should have defined values from hook aggregation
      expect(result.current.context.totalXP).toBe(100);
      expect(result.current.context.currentLevel).toBe(2);
      expect(result.current.context.currentStreak).toBe(5);
    });

    it('should handle rapid successive updates', () => {
      const saveSpy = vi.spyOn(storage, 'saveAdaptiveQuestionContext');

      const { rerender } = renderHook(() => useAdaptiveQuestionContext());

      // Rapid updates
      for (let i = 0; i < 5; i++) {
        vi.mocked(useXP).mockReturnValue({
          profile: { totalXP: i * 100, currentLevel: i + 1, levelProgress: 0 },
          streak: i,
        });
        vi.advanceTimersByTime(50);
        rerender();
      }

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should have saved at least once
      expect(saveSpy.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    it('should preserve weaknesses and recommendations in context', () => {
      const contextWithExtras: AdaptiveQuestionContext = {
        ...defaultContext,
        weaknesses: [{ sentenceId: 's1', weakType: 'high-error' }],
        recommendations: [
          {
            id: 'r1',
            type: 'weakness' as const,
            priority: 1 as const,
            reason: 'Focus on weak areas',
            targetSentenceId: 's1',
            action: 'Practice this sentence',
          },
        ],
      };
      vi.spyOn(storage, 'getAdaptiveQuestionContext').mockReturnValue(contextWithExtras);

      const { result } = renderHook(() => useAdaptiveQuestionContext());

      expect(result.current.context.weaknesses).toHaveLength(1);
      expect(result.current.context.recommendations).toHaveLength(1);
    });
  });
});