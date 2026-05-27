import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { ViewRegistryProvider, useViewRegistry } from '../useViewRegistry';
import type { AdaptiveViewState } from '@/hooks/useAdaptiveViewContext';
import type { FlowState } from '@/hooks/useAdaptiveQuestionSelector';
import type { View } from '../ViewRouter';
import type { ViewDifficultyLevel } from '../schema';
import React from 'react';

// Wrapper component to provide context
function createWrapper(initialConfigs: Parameters<typeof ViewRegistryProvider>[0]['initialConfigs'] = []) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ViewRegistryProvider initialConfigs={initialConfigs}>
        {children}
      </ViewRegistryProvider>
    );
  };
}

describe('useViewRegistry - getAdaptivePriority', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create mock adaptive state
  const createAdaptiveState = (overrides: Partial<AdaptiveViewState> = {}): AdaptiveViewState => ({
    difficultyLevel: 'normal',
    priorityAdjustment: 1.0,
    recommendedViews: [],
    flowState: 'normal' as FlowState,
    fatigueSignals: [],
    hasWeaknessBias: false,
    weaknessCount: 0,
    recentAccuracy: 0.6,
    ...overrides,
  });

  describe('base priority calculation', () => {
    it('should return 0 for unregistered view', () => {
      const wrapper = createWrapper([]);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority('unregistered-view', createAdaptiveState());
      expect(priority).toBe(0);
    });

    it('should return base priority when no adaptiveState config', () => {
      const configs = [
        { id: 'practice' as View, title: '练习', adaptiveState: undefined },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority('practice', createAdaptiveState());
      expect(priority).toBe(0);
    });

    it('should use configured base priority from adaptiveState', () => {
      const configs = [
        { id: 'practice' as View, title: '练习', adaptiveState: { priority: 50 } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority('practice', createAdaptiveState());
      expect(priority).toBe(50);
    });

    it('should handle negative base priority', () => {
      const configs = [
        { id: 'practice' as View, title: '练习', adaptiveState: { priority: -20 } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority('practice', createAdaptiveState());
      expect(priority).toBe(-20);
    });
  });

  describe('difficulty match bonus', () => {
    it('should add +10 bonus when view difficulty matches current level', () => {
      const configs = [
        { id: 'practice' as View, title: '练习', adaptiveState: { difficulty: 'normal' as ViewDifficultyLevel } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority(
        'practice',
        createAdaptiveState({ difficultyLevel: 'normal' })
      );
      expect(priority).toBe(10); // 0 base + 10 difficulty match
    });

    it('should not add bonus when difficulty does not match', () => {
      const configs = [
        { id: 'practice' as View, title: '练习', adaptiveState: { difficulty: 'hard' as ViewDifficultyLevel } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority(
        'practice',
        createAdaptiveState({ difficultyLevel: 'normal' })
      );
      expect(priority).toBe(0); // No bonus for non-matching difficulty
    });

    it('should add bonus for easy difficulty match', () => {
      const configs = [
        { id: 'progress' as View, title: '进度', adaptiveState: { difficulty: 'easy' as ViewDifficultyLevel } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority(
        'progress',
        createAdaptiveState({ difficultyLevel: 'easy' })
      );
      expect(priority).toBe(10);
    });

    it('should add bonus for hard difficulty match', () => {
      const configs = [
        { id: 'challenge' as View, title: '挑战', adaptiveState: { difficulty: 'hard' as ViewDifficultyLevel } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority(
        'challenge',
        createAdaptiveState({ difficultyLevel: 'hard' })
      );
      expect(priority).toBe(10);
    });
  });

  describe('flow state optimization bonus', () => {
    it('should add +15 bonus when view is optimized for current flow state', () => {
      const configs = [
        { id: 'challenge' as View, title: '挑战', adaptiveState: { flowStates: ['focused'] as FlowState[] } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority(
        'challenge',
        createAdaptiveState({ flowState: 'focused' })
      );
      expect(priority).toBe(15);
    });

    it('should add +15 for fatigued flow state match', () => {
      const configs = [
        { id: 'progress' as View, title: '进度', adaptiveState: { flowStates: ['fatigued'] as FlowState[] } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority(
        'progress',
        createAdaptiveState({ flowState: 'fatigued' })
      );
      expect(priority).toBe(15);
    });

    it('should add +15 for normal flow state match', () => {
      const configs = [
        { id: 'practice' as View, title: '练习', adaptiveState: { flowStates: ['normal'] as FlowState[] } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority(
        'practice',
        createAdaptiveState({ flowState: 'normal' })
      );
      expect(priority).toBe(15);
    });

    it('should not add bonus when flow state does not match', () => {
      const configs = [
        { id: 'challenge' as View, title: '挑战', adaptiveState: { flowStates: ['focused'] as FlowState[] } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority(
        'challenge',
        createAdaptiveState({ flowState: 'normal' })
      );
      expect(priority).toBe(0);
    });

    it('should add bonus when view matches any of multiple flow states', () => {
      const configs = [
        { id: 'practice' as View, title: '练习', adaptiveState: { flowStates: ['normal', 'focused'] as FlowState[] } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      // Should match 'normal'
      const priority1 = result.current.getAdaptivePriority(
        'practice',
        createAdaptiveState({ flowState: 'normal' })
      );
      expect(priority1).toBe(15);

      // Should match 'focused'
      const priority2 = result.current.getAdaptivePriority(
        'practice',
        createAdaptiveState({ flowState: 'focused' })
      );
      expect(priority2).toBe(15);

      // Should not match 'fatigued'
      const priority3 = result.current.getAdaptivePriority(
        'practice',
        createAdaptiveState({ flowState: 'fatigued' })
      );
      expect(priority3).toBe(0);
    });

    it('should handle empty flow states array (no bonus)', () => {
      const configs = [
        { id: 'practice' as View, title: '练习', adaptiveState: { flowStates: [] as FlowState[] } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority(
        'practice',
        createAdaptiveState({ flowState: 'focused' })
      );
      expect(priority).toBe(0);
    });

    it('should handle undefined flow states (no bonus)', () => {
      const configs = [
        { id: 'practice' as View, title: '练习', adaptiveState: {} },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority(
        'practice',
        createAdaptiveState({ flowState: 'focused' })
      );
      expect(priority).toBe(0);
    });
  });

  describe('recommended view bonus', () => {
    it('should add +20 bonus when view is in recommended views', () => {
      const configs = [
        { id: 'practice' as View, title: '练习' },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority(
        'practice',
        createAdaptiveState({ recommendedViews: ['practice', 'learning'] })
      );
      expect(priority).toBe(20);
    });

    it('should not add bonus when view is not in recommended views', () => {
      const configs = [
        { id: 'practice' as View, title: '练习' },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority(
        'practice',
        createAdaptiveState({ recommendedViews: ['challenge', 'leaderboard'] })
      );
      expect(priority).toBe(0);
    });

    it('should handle empty recommended views', () => {
      const configs = [
        { id: 'practice' as View, title: '练习' },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority(
        'practice',
        createAdaptiveState({ recommendedViews: [] })
      );
      expect(priority).toBe(0);
    });
  });

  describe('priority adjustment multiplier', () => {
    it('should multiply bonuses by 1.2 when priorityAdjustment is 1.2 (focused)', () => {
      const configs = [
        { id: 'practice' as View, title: '练习', adaptiveState: { difficulty: 'normal' as ViewDifficultyLevel, flowStates: ['normal'] as FlowState[] } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority(
        'practice',
        createAdaptiveState({ difficultyLevel: 'normal', flowState: 'normal', priorityAdjustment: 1.2 })
      );
      // (10 difficulty + 15 flow) * 1.2 = 25 * 1.2 = 30
      expect(priority).toBe(30);
    });

    it('should multiply bonuses by 1.0 when priorityAdjustment is 1.0 (normal)', () => {
      const configs = [
        { id: 'practice' as View, title: '练习', adaptiveState: { difficulty: 'normal' as ViewDifficultyLevel } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority(
        'practice',
        createAdaptiveState({ difficultyLevel: 'normal', priorityAdjustment: 1.0 })
      );
      // 10 difficulty * 1.0 = 10
      expect(priority).toBe(10);
    });

    it('should multiply bonuses by 0.8 when priorityAdjustment is 0.8 (fatigued)', () => {
      const configs = [
        { id: 'progress' as View, title: '进度', adaptiveState: { difficulty: 'easy' as ViewDifficultyLevel, flowStates: ['fatigued'] as FlowState[] } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority(
        'progress',
        createAdaptiveState({ difficultyLevel: 'easy', flowState: 'fatigued', priorityAdjustment: 0.8 })
      );
      // (10 difficulty + 15 flow) * 0.8 = 25 * 0.8 = 20
      expect(priority).toBe(20);
    });
  });

  describe('combined bonuses calculation', () => {
    it('should sum all bonuses with base priority', () => {
      const configs = [
        {
          id: 'challenges' as View,
          title: '挑战',
          adaptiveState: { difficulty: 'hard' as ViewDifficultyLevel, priority: 25, flowStates: ['focused'] as FlowState[] },
        },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority(
        'challenges',
        createAdaptiveState({
          difficultyLevel: 'hard',
          flowState: 'focused',
          recommendedViews: ['challenges'],
          priorityAdjustment: 1.2,
        })
      );
      // Base: 25 + (10 difficulty + 15 flow + 20 recommended) * 1.2 = 25 + 54 = 79
      expect(priority).toBe(79);
    });

    it('should handle view with no matching bonuses', () => {
      const configs = [
        {
          id: 'modes' as View,
          title: '模式',
          adaptiveState: { difficulty: 'easy' as ViewDifficultyLevel, priority: 5, flowStates: ['fatigued'] as FlowState[] },
        },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority(
        'modes',
        createAdaptiveState({
          difficultyLevel: 'hard', // Doesn't match 'easy'
          flowState: 'focused', // Doesn't match 'fatigued'
          recommendedViews: ['practice'], // Doesn't include 'modes'
          priorityAdjustment: 1.2,
        })
      );
      // Only base priority, no bonuses
      expect(priority).toBe(5);
    });

    it('should handle view with all bonuses', () => {
      const configs = [
        {
          id: 'practice' as View,
          title: '练习',
          adaptiveState: { difficulty: 'normal' as ViewDifficultyLevel, priority: 30, flowStates: ['normal'] as FlowState[] },
        },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority(
        'practice',
        createAdaptiveState({
          difficultyLevel: 'normal',
          flowState: 'normal',
          recommendedViews: ['practice'],
          priorityAdjustment: 1.0,
        })
      );
      // Base: 30 + (10 + 15 + 20) * 1.0 = 30 + 45 = 75
      expect(priority).toBe(75);
    });

    it('should correctly prioritize focused state views', () => {
      const configs = [
        { id: 'practice' as View, title: '练习', adaptiveState: { difficulty: 'normal' as ViewDifficultyLevel, priority: 10 } },
        { id: 'challenges' as View, title: '挑战', adaptiveState: { difficulty: 'hard' as ViewDifficultyLevel, priority: 10, flowStates: ['focused'] as FlowState[] } },
        { id: 'leaderboard' as View, title: '排行榜', adaptiveState: { priority: 5, flowStates: ['focused'] as FlowState[] } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const focusedState = createAdaptiveState({
        difficultyLevel: 'hard',
        flowState: 'focused',
        recommendedViews: ['challenges', 'leaderboard'],
        priorityAdjustment: 1.2,
      });

      const practicePriority = result.current.getAdaptivePriority('practice', focusedState);
      const challengePriority = result.current.getAdaptivePriority('challenges', focusedState);
      const leaderboardPriority = result.current.getAdaptivePriority('leaderboard', focusedState);

      // Challenges should have highest priority (base 10 + difficulty 10 + flow 15 + recommended 20 = 55 * 1.2 = 66)
      expect(challengePriority).toBeGreaterThan(practicePriority);
      expect(challengePriority).toBeGreaterThan(leaderboardPriority);

      // Leaderboard has no difficulty match but has flow + recommended (5 + 15 + 20 = 40 * 1.2 = 48)
      expect(leaderboardPriority).toBeGreaterThan(practicePriority);
    });

    it('should correctly prioritize fatigued state views', () => {
      const configs = [
        { id: 'practice' as View, title: '练习', adaptiveState: { difficulty: 'normal' as ViewDifficultyLevel, priority: 10 } },
        { id: 'progress' as View, title: '进度', adaptiveState: { difficulty: 'easy' as ViewDifficultyLevel, priority: 10, flowStates: ['fatigued'] as FlowState[] } },
        { id: 'achievement' as View, title: '成就', adaptiveState: { priority: 5, flowStates: ['fatigued'] as FlowState[] } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const fatiguedState = createAdaptiveState({
        difficultyLevel: 'easy',
        flowState: 'fatigued',
        recommendedViews: ['progress', 'achievement'],
        priorityAdjustment: 0.8,
      });

      const practicePriority = result.current.getAdaptivePriority('practice', fatiguedState);
      const progressPriority = result.current.getAdaptivePriority('progress', fatiguedState);
      const achievementPriority = result.current.getAdaptivePriority('achievement', fatiguedState);

      // Progress should have highest priority (base 10 + difficulty 10 + flow 15 + recommended 20 = 55 * 0.8 = 44)
      expect(progressPriority).toBeGreaterThan(practicePriority);
      expect(progressPriority).toBeGreaterThan(achievementPriority);

      // Achievement has flow + recommended but no difficulty match (5 + 15 + 20 = 40 * 0.8 = 32)
      expect(achievementPriority).toBeGreaterThan(practicePriority);

      // Practice has no bonuses (base 10 only)
      expect(practicePriority).toBe(10);
    });
  });

  describe('edge cases', () => {
    it('should handle view with undefined adaptiveState but may still get recommended bonus', () => {
      const configs = [
        { id: 'practice' as View, title: '练习' }, // No adaptiveState at all
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority(
        'practice',
        createAdaptiveState({
          difficultyLevel: 'normal',
          flowState: 'normal',
          recommendedViews: ['practice'],
        })
      );
      // 'practice' is in recommendedViews, so gets +20 bonus even without adaptiveState
      expect(priority).toBe(20);
    });

    it('should return 0 for view without adaptiveState and not in recommendedViews', () => {
      const configs = [
        { id: 'mystery' as View, title: '神秘' }, // No adaptiveState
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority(
        'mystery',
        createAdaptiveState({
          difficultyLevel: 'normal',
          flowState: 'normal',
          recommendedViews: ['practice'], // 'mystery' not in recommendedViews
        })
      );
      // No base priority, no bonuses = 0
      expect(priority).toBe(0);
    });

    it('should handle zero priority adjustment', () => {
      const configs = [
        { id: 'practice' as View, title: '练习', adaptiveState: { difficulty: 'normal' as ViewDifficultyLevel, flowStates: ['normal'] as FlowState[] } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority(
        'practice',
        createAdaptiveState({
          difficultyLevel: 'normal',
          flowState: 'normal',
          priorityAdjustment: 0,
        })
      );
      // (10 + 15) * 0 = 0
      expect(priority).toBe(0);
    });

    it('should handle very large priority adjustment', () => {
      const configs = [
        { id: 'challenges' as View, title: '挑战', adaptiveState: { difficulty: 'hard' as ViewDifficultyLevel, flowStates: ['focused'] as FlowState[] } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const priority = result.current.getAdaptivePriority(
        'challenges',
        createAdaptiveState({
          difficultyLevel: 'hard',
          flowState: 'focused',
          priorityAdjustment: 2.0, // 2x multiplier
        })
      );
      // (10 + 15) * 2.0 = 50
      expect(priority).toBe(50);
    });

    it('should maintain stable results across multiple calls', () => {
      const configs = [
        { id: 'practice' as View, title: '练习', adaptiveState: { priority: 25, difficulty: 'normal' as ViewDifficultyLevel } },
      ];
      const wrapper = createWrapper(configs);
      const { result } = renderHook(() => useViewRegistry(), { wrapper });

      const state = createAdaptiveState({
        difficultyLevel: 'normal',
        priorityAdjustment: 1.0,
      });

      const priority1 = result.current.getAdaptivePriority('practice', state);
      const priority2 = result.current.getAdaptivePriority('practice', state);
      const priority3 = result.current.getAdaptivePriority('practice', state);

      expect(priority1).toBe(priority2);
      expect(priority2).toBe(priority3);
    });
  });
});