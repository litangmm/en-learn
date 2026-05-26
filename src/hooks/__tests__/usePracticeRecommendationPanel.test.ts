import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePracticeRecommendationPanel } from '../usePracticeRecommendationPanel';
import type { PracticeRecommendation } from '@/data/types';

describe('usePracticeRecommendationPanel', () => {
  const mockRecommendations: PracticeRecommendation[] = [
    {
      id: 'rec-1',
      type: 'high-error',
      priority: 1,
      reason: '这道题您已答错3次',
      targetSentenceId: 'sent-1',
      action: '重点练习',
    },
    {
      id: 'rec-2',
      type: 'neglected-review',
      priority: 2,
      reason: '这道题已经7天没有复习了',
      targetSentenceId: 'sent-2',
      action: '巩固复习',
    },
    {
      id: 'rec-3',
      type: 'new-word',
      priority: 3,
      reason: '新单词未练习',
      targetSentenceId: 'sent-3',
      action: '学习新单词',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('returns all recommendations when none are dismissed', () => {
      const { result } = renderHook(() =>
        usePracticeRecommendationPanel(mockRecommendations)
      );

      expect(result.current.visibleRecommendations).toHaveLength(3);
      expect(result.current.visibleRecommendations).toEqual(mockRecommendations);
    });

    it('returns empty array when no recommendations provided', () => {
      const { result } = renderHook(() =>
        usePracticeRecommendationPanel([])
      );

      expect(result.current.visibleRecommendations).toHaveLength(0);
      expect(result.current.visibleRecommendations).toEqual([]);
    });

    it('starts with empty dismissedIds Set', () => {
      const { result } = renderHook(() =>
        usePracticeRecommendationPanel(mockRecommendations)
      );

      expect(result.current.dismissedIds.size).toBe(0);
    });
  });

  describe('onDismissRecommendation', () => {
    it('removes recommendation from visible list when dismissed', () => {
      const { result } = renderHook(() =>
        usePracticeRecommendationPanel(mockRecommendations)
      );

      act(() => {
        result.current.onDismissRecommendation('rec-1');
      });

      expect(result.current.visibleRecommendations).toHaveLength(2);
      expect(result.current.visibleRecommendations.find(r => r.id === 'rec-1')).toBeUndefined();
    });

    it('adds id to dismissedIds when dismissed', () => {
      const { result } = renderHook(() =>
        usePracticeRecommendationPanel(mockRecommendations)
      );

      act(() => {
        result.current.onDismissRecommendation('rec-1');
      });

      expect(result.current.dismissedIds.has('rec-1')).toBe(true);
      expect(result.current.dismissedIds.has('rec-2')).toBe(false);
    });

    it('can dismiss multiple recommendations', () => {
      const { result } = renderHook(() =>
        usePracticeRecommendationPanel(mockRecommendations)
      );

      act(() => {
        result.current.onDismissRecommendation('rec-1');
        result.current.onDismissRecommendation('rec-3');
      });

      expect(result.current.visibleRecommendations).toHaveLength(1);
      expect(result.current.visibleRecommendations[0].id).toBe('rec-2');
      expect(result.current.dismissedIds.size).toBe(2);
    });

    it('dismissing same id twice is idempotent', () => {
      const { result } = renderHook(() =>
        usePracticeRecommendationPanel(mockRecommendations)
      );

      act(() => {
        result.current.onDismissRecommendation('rec-1');
        result.current.onDismissRecommendation('rec-1');
      });

      expect(result.current.visibleRecommendations).toHaveLength(2);
      expect(result.current.dismissedIds.size).toBe(1);
    });
  });

  describe('resetDismissed', () => {
    it('restores all recommendations after reset', () => {
      const { result } = renderHook(() =>
        usePracticeRecommendationPanel(mockRecommendations)
      );

      act(() => {
        result.current.onDismissRecommendation('rec-1');
        result.current.onDismissRecommendation('rec-2');
      });

      expect(result.current.visibleRecommendations).toHaveLength(1);

      act(() => {
        result.current.resetDismissed();
      });

      expect(result.current.visibleRecommendations).toHaveLength(3);
      expect(result.current.visibleRecommendations).toEqual(mockRecommendations);
    });

    it('clears dismissedIds after reset', () => {
      const { result } = renderHook(() =>
        usePracticeRecommendationPanel(mockRecommendations)
      );

      act(() => {
        result.current.onDismissRecommendation('rec-1');
        result.current.onDismissRecommendation('rec-2');
      });

      expect(result.current.dismissedIds.size).toBe(2);

      act(() => {
        result.current.resetDismissed();
      });

      expect(result.current.dismissedIds.size).toBe(0);
    });
  });

  describe('re-render behavior', () => {
    it('updates visibleRecommendations when recommendations prop changes', () => {
      const { result, rerender } = renderHook(
        ({ recs }: { recs: PracticeRecommendation[] }) =>
          usePracticeRecommendationPanel(recs),
        { initialProps: { recs: mockRecommendations } }
      );

      expect(result.current.visibleRecommendations).toHaveLength(3);

      const newRecommendations = mockRecommendations.slice(0, 2);
      rerender({ recs: newRecommendations });

      expect(result.current.visibleRecommendations).toHaveLength(2);
    });

    it('preserves dismiss state across re-renders', () => {
      const { result, rerender } = renderHook(
        ({ recs }: { recs: PracticeRecommendation[] }) =>
          usePracticeRecommendationPanel(recs),
        { initialProps: { recs: mockRecommendations } }
      );

      act(() => {
        result.current.onDismissRecommendation('rec-1');
      });

      expect(result.current.visibleRecommendations).toHaveLength(2);

      // Re-render with same recommendations should maintain dismiss state
      rerender({ recs: mockRecommendations });

      expect(result.current.visibleRecommendations).toHaveLength(2);
      expect(result.current.dismissedIds.has('rec-1')).toBe(true);
    });
  });
});