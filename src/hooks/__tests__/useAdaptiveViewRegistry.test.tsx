import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ViewRegistryProvider } from '@/components/routing/useViewRegistry';
import { useAdaptiveViewRegistry } from '../useAdaptiveViewRegistry';
import type { View } from '@/components/routing/ViewRouter';
import type { ViewConfig } from '@/components/routing';
import type { AdaptiveViewState } from '@/hooks/useAdaptiveViewContext';
import type { FlowState } from '@/hooks/useAdaptiveQuestionSelector';
import React from 'react';

// Mock useAdaptiveViewContext to control adaptiveState in tests
vi.mock('@/hooks/useAdaptiveViewContext', () => ({
  useAdaptiveViewContext: vi.fn(),
}));

import { useAdaptiveViewContext } from '@/hooks/useAdaptiveViewContext';

function createAdaptiveState(overrides: Partial<AdaptiveViewState> = {}): AdaptiveViewState {
  return {
    difficultyLevel: 'normal',
    priorityAdjustment: 1.0,
    recommendedViews: [],
    flowState: 'normal' as FlowState,
    fatigueSignals: [],
    hasWeaknessBias: false,
    weaknessCount: 0,
    recentAccuracy: 0.6,
    ...overrides,
  };
}

// Helper to create wrapper with ViewRegistryProvider and mock adaptive state
function createWrapper(initialConfigs: ViewConfig[] = [], mockAdaptiveState?: AdaptiveViewState) {
  const defaultState = createAdaptiveState();
  (useAdaptiveViewContext as ReturnType<typeof vi.fn>).mockReturnValue(mockAdaptiveState ?? defaultState);

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ViewRegistryProvider initialConfigs={initialConfigs}>
        {children}
      </ViewRegistryProvider>
    );
  };
}

describe('useAdaptiveViewRegistry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('adaptiveState exposure', () => {
    it('should expose the raw adaptiveState from useAdaptiveViewContext', () => {
      const mockState = createAdaptiveState();
      const wrapper = createWrapper([], mockState);
      const { result } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      // Should have all expected adaptive state properties
      expect(result.current.adaptiveState).toBeDefined();
      expect(typeof result.current.adaptiveState).toBe('object');
      expect(result.current.adaptiveState).toHaveProperty('difficultyLevel');
      expect(result.current.adaptiveState).toHaveProperty('flowState');
      expect(result.current.adaptiveState).toHaveProperty('hasWeaknessBias');
      expect(result.current.adaptiveState).toHaveProperty('weaknessCount');
      expect(result.current.adaptiveState).toHaveProperty('priorityAdjustment');
      expect(result.current.adaptiveState).toHaveProperty('recommendedViews');
      expect(result.current.adaptiveState).toHaveProperty('fatigueSignals');
      expect(result.current.adaptiveState).toHaveProperty('recentAccuracy');
    });

    it('should expose difficultyLevel from adaptiveState', () => {
      const mockState = createAdaptiveState({ difficultyLevel: 'hard' });
      const wrapper = createWrapper([], mockState);
      const { result } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      expect(result.current.adaptiveState.difficultyLevel).toBe('hard');
    });

    it('should expose flowState from adaptiveState', () => {
      const mockState = createAdaptiveState({ flowState: 'focused' });
      const wrapper = createWrapper([], mockState);
      const { result } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      expect(result.current.adaptiveState.flowState).toBe('focused');
    });

    it('should expose hasWeaknessBias from adaptiveState', () => {
      const mockState = createAdaptiveState({ hasWeaknessBias: true, weaknessCount: 5 });
      const wrapper = createWrapper([], mockState);
      const { result } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      expect(result.current.adaptiveState.hasWeaknessBias).toBe(true);
      expect(result.current.adaptiveState.weaknessCount).toBe(5);
    });

    it('should expose weaknessCount from adaptiveState', () => {
      const mockState = createAdaptiveState({ weaknessCount: 3 });
      const wrapper = createWrapper([], mockState);
      const { result } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      expect(result.current.adaptiveState.weaknessCount).toBe(3);
    });

    it('should expose recentAccuracy from adaptiveState', () => {
      const mockState = createAdaptiveState({ recentAccuracy: 0.85 });
      const wrapper = createWrapper([], mockState);
      const { result } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      expect(result.current.adaptiveState.recentAccuracy).toBe(0.85);
    });

    it('should expose priorityAdjustment from adaptiveState', () => {
      const mockState = createAdaptiveState({ priorityAdjustment: 1.2 });
      const wrapper = createWrapper([], mockState);
      const { result } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      expect(result.current.adaptiveState.priorityAdjustment).toBe(1.2);
    });

    it('should expose recommendedViews from adaptiveState', () => {
      const mockState = createAdaptiveState({ recommendedViews: ['practice', 'learning'] });
      const wrapper = createWrapper([], mockState);
      const { result } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      expect(result.current.adaptiveState.recommendedViews).toEqual(['practice', 'learning']);
    });
  });

  describe('empty registeredViews handling', () => {
    it('should return empty viewsByPriority when registeredViews is empty', () => {
      const wrapper = createWrapper([]);
      const { result } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      expect(result.current.viewsByPriority).toEqual([]);
      expect(Array.isArray(result.current.viewsByPriority)).toBe(true);
    });

    it('should return empty topViews when registeredViews is empty', () => {
      const wrapper = createWrapper([]);
      const { result } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      expect(result.current.topViews).toEqual([]);
      expect(Array.isArray(result.current.topViews)).toBe(true);
    });

    it('should return totalViewCount of 0 when registeredViews is empty', () => {
      const wrapper = createWrapper([]);
      const { result } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      expect(result.current.totalViewCount).toBe(0);
    });

    it('should not crash when registeredViews is empty', () => {
      const wrapper = createWrapper([]);
      const render = () =>
        renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      expect(render).not.toThrow();
    });

    it('should still expose adaptiveState when registeredViews is empty', () => {
      const mockState = createAdaptiveState({ flowState: 'fatigued' });
      const wrapper = createWrapper([], mockState);
      const { result } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      expect(result.current.adaptiveState).toBeDefined();
      expect(result.current.adaptiveState.flowState).toBe('fatigued');
    });
  });

  describe('viewsByPriority sorting', () => {
    it('should sort views by priority in descending order', () => {
      const configs: ViewConfig[] = [
        { id: 'low' as View, title: '低优先级', adaptiveState: { priority: 10 } },
        { id: 'high' as View, title: '高优先级', adaptiveState: { priority: 50 } },
        { id: 'medium' as View, title: '中优先级', adaptiveState: { priority: 30 } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      expect(result.current.viewsByPriority.length).toBe(3);
      expect(result.current.viewsByPriority[0].id).toBe('high');
      expect(result.current.viewsByPriority[1].id).toBe('medium');
      expect(result.current.viewsByPriority[2].id).toBe('low');
    });

    it('should include priority scores in viewsByPriority', () => {
      const configs: ViewConfig[] = [
        { id: 'test' as View, title: '测试', adaptiveState: { priority: 25 } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      expect(result.current.viewsByPriority[0].priority).toBe(25);
    });

    it('should include config in viewsByPriority entries', () => {
      const configs: ViewConfig[] = [
        { id: 'test' as View, title: '测试', adaptiveState: { priority: 25 } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      expect(result.current.viewsByPriority[0].config).toBeDefined();
      expect(result.current.viewsByPriority[0].config.id).toBe('test');
    });

    it('should handle views without explicit priority', () => {
      const configs: ViewConfig[] = [
        { id: 'no-priority' as View, title: '无优先级' },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      expect(result.current.viewsByPriority.length).toBe(1);
      expect(result.current.viewsByPriority[0].priority).toBeGreaterThanOrEqual(0);
    });

    it('should apply difficulty match bonus from adaptive state', () => {
      const configs: ViewConfig[] = [
        { id: 'practice' as View, title: '练习', adaptiveState: { difficulty: 'normal' as const } },
        { id: 'challenge' as View, title: '挑战', adaptiveState: { difficulty: 'hard' as const } },
      ];
      const mockState = createAdaptiveState({ difficultyLevel: 'normal' as const });
      const wrapper = createWrapper(configs, mockState);
      const { result } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      // 'practice' should have higher priority due to difficulty match (+10)
      const practiceView = result.current.viewsByPriority.find(v => v.id === 'practice');
      const challengeView = result.current.viewsByPriority.find(v => v.id === 'challenge');

      expect(practiceView!.priority).toBeGreaterThan(challengeView!.priority);
    });

    it('should apply recommended view bonus from adaptive state', () => {
      const configs: ViewConfig[] = [
        { id: 'practice' as View, title: '练习' },
        { id: 'learning' as View, title: '学习' },
      ];
      const mockState = createAdaptiveState({ recommendedViews: ['practice'] });
      const wrapper = createWrapper(configs, mockState);
      const { result } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      const practiceView = result.current.viewsByPriority.find(v => v.id === 'practice');
      const learningView = result.current.viewsByPriority.find(v => v.id === 'learning');

      expect(practiceView!.priority).toBeGreaterThan(learningView!.priority);
    });
  });

  describe('topViews limiting', () => {
    it('should return default top 3 views', () => {
      const configs: ViewConfig[] = [
        { id: 'v1' as View, title: '视图1', adaptiveState: { priority: 10 } },
        { id: 'v2' as View, title: '视图2', adaptiveState: { priority: 20 } },
        { id: 'v3' as View, title: '视图3', adaptiveState: { priority: 30 } },
        { id: 'v4' as View, title: '视图4', adaptiveState: { priority: 40 } },
        { id: 'v5' as View, title: '视图5', adaptiveState: { priority: 50 } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      expect(result.current.topViews.length).toBe(3);
      expect(result.current.topViews[0].id).toBe('v5');
      expect(result.current.topViews[1].id).toBe('v4');
      expect(result.current.topViews[2].id).toBe('v3');
    });

    it('should return configurable top N views', () => {
      const configs: ViewConfig[] = [
        { id: 'v1' as View, title: '视图1', adaptiveState: { priority: 10 } },
        { id: 'v2' as View, title: '视图2', adaptiveState: { priority: 20 } },
        { id: 'v3' as View, title: '视图3', adaptiveState: { priority: 30 } },
        { id: 'v4' as View, title: '视图4', adaptiveState: { priority: 40 } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useAdaptiveViewRegistry(2), { wrapper });

      expect(result.current.topViews.length).toBe(2);
      expect(result.current.topViews[0].id).toBe('v4');
      expect(result.current.topViews[1].id).toBe('v3');
    });

    it('should return all views if fewer than topN', () => {
      const configs: ViewConfig[] = [
        { id: 'v1' as View, title: '视图1', adaptiveState: { priority: 10 } },
        { id: 'v2' as View, title: '视图2', adaptiveState: { priority: 20 } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useAdaptiveViewRegistry(5), { wrapper });

      expect(result.current.topViews.length).toBe(2);
    });

    it('should return empty topViews when topN is 0', () => {
      const configs: ViewConfig[] = [
        { id: 'v1' as View, title: '视图1', adaptiveState: { priority: 10 } },
        { id: 'v2' as View, title: '视图2', adaptiveState: { priority: 20 } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useAdaptiveViewRegistry(0), { wrapper });

      expect(result.current.topViews.length).toBe(0);
    });

    it('should return empty topViews when registeredViews is empty regardless of topN', () => {
      const wrapper = createWrapper([]);
      const { result } = renderHook(() => useAdaptiveViewRegistry(10), { wrapper });

      expect(result.current.topViews.length).toBe(0);
    });
  });

  describe('totalViewCount', () => {
    it('should return correct count of registered views', () => {
      const configs: ViewConfig[] = [
        { id: 'v1' as View, title: '视图1' },
        { id: 'v2' as View, title: '视图2' },
        { id: 'v3' as View, title: '视图3' },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      expect(result.current.totalViewCount).toBe(3);
    });

    it('should return 0 for empty registry', () => {
      const wrapper = createWrapper([]);
      const { result } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      expect(result.current.totalViewCount).toBe(0);
    });
  });

  describe('PriorityView type structure', () => {
    it('should return proper PriorityView entries', () => {
      const configs: ViewConfig[] = [
        { id: 'practice' as View, title: '练习', adaptiveState: { priority: 25 } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      const entry = result.current.viewsByPriority[0];

      // Check required fields
      expect(entry).toHaveProperty('id');
      expect(entry).toHaveProperty('priority');
      expect(entry).toHaveProperty('config');

      // Check types
      expect(typeof entry.id).toBe('string');
      expect(typeof entry.priority).toBe('number');
      expect(typeof entry.config).toBe('object');
    });
  });

  describe('priority calculation integration', () => {
    it('should apply flow state optimization bonus', () => {
      const configs: ViewConfig[] = [
        { id: 'progress' as View, title: '进度', adaptiveState: { flowStates: ['fatigued'] as const } },
        { id: 'challenge' as View, title: '挑战', adaptiveState: { flowStates: ['focused'] as const } },
      ];
      const mockState = createAdaptiveState({ flowState: 'fatigued' as FlowState, priorityAdjustment: 0.8 });
      const wrapper = createWrapper(configs, mockState);
      const { result } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      // Both views exist
      expect(result.current.viewsByPriority.length).toBe(2);

      // Views have non-negative priorities
      result.current.viewsByPriority.forEach(view => {
        expect(view.priority).toBeGreaterThanOrEqual(0);
      });

      // Progress should have higher priority when user is fatigued
      const progressView = result.current.viewsByPriority.find(v => v.id === 'progress');
      const challengeView = result.current.viewsByPriority.find(v => v.id === 'challenge');
      expect(progressView!.priority).toBeGreaterThan(challengeView!.priority);
    });

    it('should apply priority adjustment multiplier', () => {
      const configs: ViewConfig[] = [
        { id: 'high-priority' as View, title: '高优先级', adaptiveState: { priority: 10, difficulty: 'normal' as const } },
      ];
      // Priority adjustment of 1.2 should boost the difficulty bonus
      const mockState = createAdaptiveState({
        difficultyLevel: 'normal' as const,
        priorityAdjustment: 1.2,
      });
      const wrapper = createWrapper(configs, mockState);
      const { result } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      // Priority should be: base 10 + difficulty bonus (10 * 1.2) = 22
      expect(result.current.viewsByPriority[0].priority).toBe(22);
    });
  });

  describe('stability', () => {
    it('should return stable results on multiple renders', () => {
      const configs: ViewConfig[] = [
        { id: 'v1' as View, title: '视图1', adaptiveState: { priority: 10 } },
        { id: 'v2' as View, title: '视图2', adaptiveState: { priority: 20 } },
      ];
      const wrapper = createWrapper(configs);
      const { result, rerender } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      // Results should be stable (same object references on re-render with same state)
      expect(firstResult.viewsByPriority).toEqual(secondResult.viewsByPriority);
      expect(firstResult.topViews).toEqual(secondResult.topViews);
      expect(firstResult.totalViewCount).toEqual(secondResult.totalViewCount);
    });

    it('should return same adaptiveState reference on re-render', () => {
      const mockState = createAdaptiveState();
      const wrapper = createWrapper([], mockState);
      const { result, rerender } = renderHook(() => useAdaptiveViewRegistry(), { wrapper });

      const firstState = result.current.adaptiveState;
      rerender();
      const secondState = result.current.adaptiveState;

      expect(firstState).toBe(secondState);
    });
  });
});