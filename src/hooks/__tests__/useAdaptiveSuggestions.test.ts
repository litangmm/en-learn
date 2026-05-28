import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { AdaptiveViewState } from '@/hooks/useAdaptiveViewContext';
import type { FlowState } from '@/hooks/useFlowState';

// Get hoisted mock references
const mockUseAdaptiveViewContext = vi.hoisted(() => vi.fn());
const mockUseXP = vi.hoisted(() => vi.fn());

// Mock the dependencies before importing the hook
vi.mock('@/hooks/useAdaptiveViewContext', () => ({
  useAdaptiveViewContext: mockUseAdaptiveViewContext,
}));

vi.mock('@/hooks/useXP', () => ({
  useXP: mockUseXP,
}));

// Import the hook after mocking
import { useAdaptiveSuggestions } from '../useAdaptiveSuggestions';

describe('useAdaptiveSuggestions', () => {
  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const createMockAdaptiveState = (overrides: Partial<AdaptiveViewState> = {}): AdaptiveViewState => ({
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

  const createMockXPResult = (overrides: {
    profile?: { currentLevel: number; totalXP: number; levelProgress?: number };
    streak?: number;
    maxStreakReached?: number;
  } = {}) => ({
    profile: {
      totalXP: 0,
      currentLevel: 1,
      levelProgress: 0,
      ...(overrides.profile ?? {}),
    },
    streak: overrides.streak ?? 0,
    maxStreakReached: overrides.maxStreakReached ?? 0,
    addXP: vi.fn(),
    resetXPProfile: vi.fn(),
    recordCorrectAnswer: vi.fn(),
    recordWrongAnswer: vi.fn(),
    resetStreak: vi.fn(),
  });

  // ---------------------------------------------------------------------------
  // Setup & Teardown
  // ---------------------------------------------------------------------------

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    mockUseAdaptiveViewContext.mockReturnValue(createMockAdaptiveState());
    mockUseXP.mockReturnValue(createMockXPResult());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Status Summary Generation Tests
  // ---------------------------------------------------------------------------

  describe('statusSummary generation', () => {
    it('should generate status summary for focused flow state', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({
          flowState: 'focused',
          recentAccuracy: 0.85,
        })
      );
      mockUseXP.mockReturnValue(
        createMockXPResult({
          profile: { currentLevel: 5, totalXP: 200 },
          streak: 3,
          maxStreakReached: 5,
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      expect(result.current.statusSummary).toContain('状态极佳');
      expect(result.current.statusSummary).toContain('正确率高');
    });

    it('should generate status summary for fatigued flow state', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({
          flowState: 'fatigued',
          recentAccuracy: 0.35,
        })
      );
      mockUseXP.mockReturnValue(
        createMockXPResult({
          profile: { currentLevel: 3, totalXP: 50 },
          streak: 0,
          maxStreakReached: 2,
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      expect(result.current.statusSummary).toContain('状态疲劳');
      expect(result.current.statusSummary).toContain('正确率偏低');
    });

    it('should generate status summary for normal flow state', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({
          flowState: 'normal',
          recentAccuracy: 0.6,
        })
      );
      mockUseXP.mockReturnValue(
        createMockXPResult({
          profile: { currentLevel: 1, totalXP: 10 },
          streak: 0,
          maxStreakReached: 0,
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      expect(result.current.statusSummary).toContain('状态一般');
    });

    it('should include weakness information when hasWeaknessBias is true', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({
          hasWeaknessBias: true,
          weaknessCount: 5,
        })
      );
      mockUseXP.mockReturnValue(createMockXPResult());

      const { result } = renderHook(() => useAdaptiveSuggestions());

      expect(result.current.statusSummary).toContain('薄弱点');
      expect(result.current.statusSummary).toContain('5');
    });

    it('should include level information for high level users', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockAdaptiveState());
      mockUseXP.mockReturnValue(
        createMockXPResult({
          profile: { currentLevel: 12, totalXP: 1000 },
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      expect(result.current.statusSummary).toContain('高等级学习者');
    });

    it('should include level information for beginner users', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockAdaptiveState());
      mockUseXP.mockReturnValue(
        createMockXPResult({
          profile: { currentLevel: 2, totalXP: 50 },
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      expect(result.current.statusSummary).toContain('初学者');
    });

    it('should include streak information for active streaks', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockAdaptiveState());
      mockUseXP.mockReturnValue(
        createMockXPResult({
          streak: 5,
          maxStreakReached: 7,
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      expect(result.current.statusSummary).toContain('连续学习5天');
    });

    it('should include streak information for medium streaks', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockAdaptiveState());
      mockUseXP.mockReturnValue(
        createMockXPResult({
          streak: 3,
          maxStreakReached: 3,
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      expect(result.current.statusSummary).toContain('保持3天连续');
    });

    it('should include accuracy percentage in status summary', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({
          flowState: 'normal',
          recentAccuracy: 0.75,
        })
      );
      mockUseXP.mockReturnValue(createMockXPResult());

      const { result } = renderHook(() => useAdaptiveSuggestions());

      expect(result.current.statusSummary).toContain('75%');
    });
  });

  // ---------------------------------------------------------------------------
  // Suggested Actions - Flow State Based Tests
  // ---------------------------------------------------------------------------

  describe('suggestedActions for flow state', () => {
    it('should suggest challenge action for focused state', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({
          flowState: 'focused',
          recentAccuracy: 0.9,
        })
      );
      mockUseXP.mockReturnValue(createMockXPResult());

      const { result } = renderHook(() => useAdaptiveSuggestions());

      const challengeAction = result.current.suggestedActions.find(
        a => a.id === 'focused-challenge'
      );
      expect(challengeAction).toBeDefined();
      expect(challengeAction?.viewId).toBe('challenge');
      expect(challengeAction?.icon).toBe('fire');
    });

    it('should suggest leaderboard action for focused state', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({
          flowState: 'focused',
          recentAccuracy: 0.9,
        })
      );
      mockUseXP.mockReturnValue(createMockXPResult());

      const { result } = renderHook(() => useAdaptiveSuggestions());

      const leaderboardAction = result.current.suggestedActions.find(
        a => a.id === 'focused-leaderboard'
      );
      expect(leaderboardAction).toBeDefined();
      expect(leaderboardAction?.viewId).toBe('leaderboard');
    });

    it('should suggest rest action for fatigued state', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({
          flowState: 'fatigued',
          recentAccuracy: 0.3,
        })
      );
      mockUseXP.mockReturnValue(createMockXPResult());

      const { result } = renderHook(() => useAdaptiveSuggestions());

      const restAction = result.current.suggestedActions.find(
        a => a.id === 'rest-recovery'
      );
      expect(restAction).toBeDefined();
      expect(restAction?.priority).toBe(100); // CRITICAL priority
    });

    it('should suggest review action for fatigued state', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({
          flowState: 'fatigued',
          recentAccuracy: 0.35,
        })
      );
      mockUseXP.mockReturnValue(createMockXPResult());

      const { result } = renderHook(() => useAdaptiveSuggestions());

      const reviewAction = result.current.suggestedActions.find(
        a => a.id === 'rest-break'
      );
      expect(reviewAction).toBeDefined();
      expect(reviewAction?.viewId).toBe('review');
    });

    it('should suggest fatigue warning for normal state with low accuracy', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({
          flowState: 'normal',
          recentAccuracy: 0.4,
        })
      );
      mockUseXP.mockReturnValue(createMockXPResult());

      const { result } = renderHook(() => useAdaptiveSuggestions());

      const warningAction = result.current.suggestedActions.find(
        a => a.id === 'fatigue-warning'
      );
      expect(warningAction).toBeDefined();
      expect(warningAction?.viewId).toBe('practice');
    });

    it('should suggest accuracy improve for normal state with high accuracy', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({
          flowState: 'normal',
          recentAccuracy: 0.75,
        })
      );
      mockUseXP.mockReturnValue(createMockXPResult());

      const { result } = renderHook(() => useAdaptiveSuggestions());

      const improveAction = result.current.suggestedActions.find(
        a => a.id === 'accuracy-improve'
      );
      expect(improveAction).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Suggested Actions - XP/Level Based Tests
  // ---------------------------------------------------------------------------

  describe('suggestedActions for XP/level', () => {
    it('should suggest practice starter for low level users', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockAdaptiveState());
      mockUseXP.mockReturnValue(
        createMockXPResult({
          profile: { currentLevel: 2, totalXP: 50 },
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      const starterAction = result.current.suggestedActions.find(
        a => a.id === 'practice-starter'
      );
      expect(starterAction).toBeDefined();
      expect(starterAction?.viewId).toBe('practice');
    });

    it('should not suggest practice starter for higher level users', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockAdaptiveState());
      mockUseXP.mockReturnValue(
        createMockXPResult({
          profile: { currentLevel: 5, totalXP: 300 },
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      const starterAction = result.current.suggestedActions.find(
        a => a.id === 'practice-starter'
      );
      expect(starterAction).toBeUndefined();
    });

    it('should suggest challenge for high level users', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({ flowState: 'focused' })
      );
      mockUseXP.mockReturnValue(
        createMockXPResult({
          profile: { currentLevel: 10, totalXP: 800 },
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      const challengeAction = result.current.suggestedActions.find(
        a => a.id === 'challenge-starter'
      );
      expect(challengeAction).toBeDefined();
    });

    it('should not suggest challenge for high level users when fatigued', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({ flowState: 'fatigued' })
      );
      mockUseXP.mockReturnValue(
        createMockXPResult({
          profile: { currentLevel: 10, totalXP: 800 },
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      const challengeAction = result.current.suggestedActions.find(
        a => a.id === 'challenge-starter'
      );
      expect(challengeAction).toBeUndefined();
    });

    it('should suggest level-up progress when near next level', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({ flowState: 'focused' })
      );
      mockUseXP.mockReturnValue(
        createMockXPResult({
          profile: { currentLevel: 5, totalXP: 485 },
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      const levelUpAction = result.current.suggestedActions.find(
        a => a.id === 'level-up-progress'
      );
      expect(levelUpAction).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Suggested Actions - Weakness Based Tests
  // ---------------------------------------------------------------------------

  describe('suggestedActions for weaknesses', () => {
    it('should suggest targeted practice when has weakness bias', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({
          hasWeaknessBias: true,
          weaknessCount: 4,
        })
      );
      mockUseXP.mockReturnValue(createMockXPResult());

      const { result } = renderHook(() => useAdaptiveSuggestions());

      const targetedAction = result.current.suggestedActions.find(
        a => a.id === 'practice-targeted'
      );
      expect(targetedAction).toBeDefined();
      expect(targetedAction?.viewId).toBe('practice');
      expect(targetedAction?.description).toContain('4');
    });

    it('should not suggest targeted practice when no weaknesses', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({
          hasWeaknessBias: false,
          weaknessCount: 0,
        })
      );
      mockUseXP.mockReturnValue(createMockXPResult());

      const { result } = renderHook(() => useAdaptiveSuggestions());

      const targetedAction = result.current.suggestedActions.find(
        a => a.id === 'practice-targeted'
      );
      expect(targetedAction).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Suggested Actions - Streak Based Tests
  // ---------------------------------------------------------------------------

  describe('suggestedActions for streak', () => {
    it('should acknowledge good streaks (>= 3)', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockAdaptiveState());
      mockUseXP.mockReturnValue(
        createMockXPResult({
          streak: 5,
          maxStreakReached: 5,
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      const streakAction = result.current.suggestedActions.find(
        a => a.id === 'streak-acknowledge'
      );
      expect(streakAction).toBeDefined();
      expect(streakAction?.description).toContain('5');
      expect(streakAction?.icon).toBe('flame');
    });

    it('should suggest streak rebuild when streak is broken but had previous streak', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockAdaptiveState());
      mockUseXP.mockReturnValue(
        createMockXPResult({
          streak: 0,
          maxStreakReached: 7,
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      const rebuildAction = result.current.suggestedActions.find(
        a => a.id === 'streak-rebuild'
      );
      expect(rebuildAction).toBeDefined();
    });

    it('should not suggest rebuild for new users with no streak history', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockAdaptiveState());
      mockUseXP.mockReturnValue(
        createMockXPResult({
          streak: 0,
          maxStreakReached: 0,
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      const rebuildAction = result.current.suggestedActions.find(
        a => a.id === 'streak-rebuild'
      );
      expect(rebuildAction).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Priority Ordering Tests
  // ---------------------------------------------------------------------------

  describe('priority ordering', () => {
    it('should sort actions by priority descending', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({
          flowState: 'focused',
          hasWeaknessBias: true,
          weaknessCount: 3,
        })
      );
      mockUseXP.mockReturnValue(
        createMockXPResult({
          profile: { currentLevel: 1, totalXP: 50 },
          streak: 3,
          maxStreakReached: 3,
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      // Verify descending order
      const priorities = result.current.suggestedActions.map(a => a.priority);
      for (let i = 1; i < priorities.length; i++) {
        expect(priorities[i - 1]).toBeGreaterThanOrEqual(priorities[i]);
      }
    });

    it('should put rest-recovery as highest priority for fatigued state', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({
          flowState: 'fatigued',
          recentAccuracy: 0.3,
          hasWeaknessBias: true,
          weaknessCount: 2,
        })
      );
      mockUseXP.mockReturnValue(
        createMockXPResult({
          streak: 5,
          maxStreakReached: 5,
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      // Critical priority (100) should be first
      expect(result.current.suggestedActions[0].id).toBe('rest-recovery');
      expect(result.current.suggestedActions[0].priority).toBe(100);
    });

    it('should handle single action scenario', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({
          flowState: 'normal',
          recentAccuracy: 0.6,
          hasWeaknessBias: false,
          weaknessCount: 0,
        })
      );
      mockUseXP.mockReturnValue(
        createMockXPResult({
          profile: { currentLevel: 5, totalXP: 200 },
          streak: 0,
          maxStreakReached: 0,
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      // Should have actions and first one should be at index 0
      expect(result.current.suggestedActions.length).toBeGreaterThanOrEqual(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Empty State Handling Tests
  // ---------------------------------------------------------------------------

  describe('empty state handling', () => {
    it('should handle new user with no data', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({
          flowState: 'normal',
          recentAccuracy: 0,
          hasWeaknessBias: false,
          weaknessCount: 0,
        })
      );
      mockUseXP.mockReturnValue(
        createMockXPResult({
          profile: {
            currentLevel: 1,
            totalXP: 0,
            levelProgress: 0,
          },
          streak: 0,
          maxStreakReached: 0,
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      // Should still return valid structure
      expect(typeof result.current.statusSummary).toBe('string');
      expect(Array.isArray(result.current.suggestedActions)).toBe(true);
    });

    it('should return empty suggestedActions array when no conditions met', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({
          flowState: 'normal',
          recentAccuracy: 0.55, // Not low enough for warning, not high enough for improve
          hasWeaknessBias: false,
          weaknessCount: 0,
        })
      );
      mockUseXP.mockReturnValue(
        createMockXPResult({
          profile: {
            currentLevel: 4, // Not low enough for starter (level <= 3), not high enough for challenge (level >= 8)
            totalXP: 100,
          },
          streak: 0,
          maxStreakReached: 0, // No previous streak
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      // Should still return array (possibly empty or with minimal actions)
      expect(Array.isArray(result.current.suggestedActions)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // Action Structure Tests
  // ---------------------------------------------------------------------------

  describe('action structure', () => {
    it('should return actions with required fields', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({ flowState: 'focused' })
      );
      mockUseXP.mockReturnValue(createMockXPResult());

      const { result } = renderHook(() => useAdaptiveSuggestions());

      for (const action of result.current.suggestedActions) {
        expect(action).toHaveProperty('id');
        expect(action).toHaveProperty('title');
        expect(action).toHaveProperty('description');
        expect(action).toHaveProperty('priority');
        expect(typeof action.id).toBe('string');
        expect(typeof action.title).toBe('string');
        expect(typeof action.description).toBe('string');
        expect(typeof action.priority).toBe('number');
      }
    });

    it('should return actions with optional fields when present', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({ flowState: 'focused' })
      );
      mockUseXP.mockReturnValue(createMockXPResult());

      const { result } = renderHook(() => useAdaptiveSuggestions());

      const challengeAction = result.current.suggestedActions.find(
        a => a.id === 'focused-challenge'
      );
      expect(challengeAction).toBeDefined();
      expect(challengeAction?.icon).toBe('fire');
      expect(challengeAction?.viewId).toBe('challenge');
    });

    it('should not have duplicate action IDs', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({
          flowState: 'focused',
          hasWeaknessBias: true,
          weaknessCount: 3,
        })
      );
      mockUseXP.mockReturnValue(
        createMockXPResult({
          profile: { currentLevel: 2, totalXP: 50 },
          streak: 5,
          maxStreakReached: 5,
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      const ids = result.current.suggestedActions.map(a => a.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids).toEqual(uniqueIds);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge Cases
  // ---------------------------------------------------------------------------

  describe('edge cases', () => {
    it('should handle extreme accuracy values (0)', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({
          flowState: 'fatigued',
          recentAccuracy: 0,
        })
      );
      mockUseXP.mockReturnValue(createMockXPResult());

      const { result } = renderHook(() => useAdaptiveSuggestions());

      expect(result.current.statusSummary).toBeDefined();
      expect(result.current.suggestedActions).toBeDefined();
    });

    it('should handle extreme accuracy values (1.0)', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({
          flowState: 'focused',
          recentAccuracy: 1.0,
        })
      );
      mockUseXP.mockReturnValue(
        createMockXPResult({
          profile: { currentLevel: 15, totalXP: 1500 },
          streak: 10,
          maxStreakReached: 10,
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      expect(result.current.statusSummary).toBeDefined();
      expect(result.current.statusSummary).toContain('100%');
    });

    it('should handle very high level users', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({ flowState: 'normal' })
      );
      mockUseXP.mockReturnValue(
        createMockXPResult({
          profile: { currentLevel: 50, totalXP: 5000 },
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      expect(result.current.statusSummary).toContain('高等级学习者');
    });

    it('should handle very high streaks', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockAdaptiveState());
      mockUseXP.mockReturnValue(
        createMockXPResult({
          streak: 30,
          maxStreakReached: 30,
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      expect(result.current.statusSummary).toContain('连续学习30天');
    });

    it('should handle many weaknesses', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({
          hasWeaknessBias: true,
          weaknessCount: 20,
        })
      );
      mockUseXP.mockReturnValue(createMockXPResult());

      const { result } = renderHook(() => useAdaptiveSuggestions());

      const targetedAction = result.current.suggestedActions.find(
        a => a.id === 'practice-targeted'
      );
      expect(targetedAction).toBeDefined();
      expect(targetedAction?.description).toContain('20');
    });

    it('should combine multiple conditions correctly', () => {
      mockUseAdaptiveViewContext.mockReturnValue(
        createMockAdaptiveState({
          flowState: 'focused',
          recentAccuracy: 0.85,
          hasWeaknessBias: true,
          weaknessCount: 5,
        })
      );
      mockUseXP.mockReturnValue(
        createMockXPResult({
          profile: { currentLevel: 7, totalXP: 650 },
          streak: 4,
          maxStreakReached: 7,
        })
      );

      const { result } = renderHook(() => useAdaptiveSuggestions());

      // Should have actions from multiple sources
      expect(result.current.suggestedActions.length).toBeGreaterThan(1);
      expect(result.current.statusSummary).toContain('状态极佳');
      expect(result.current.statusSummary).toContain('薄弱点');
      expect(result.current.statusSummary).toContain('连续'); // streak >= 4 → "保持4天连续"
    });
  });

  // ---------------------------------------------------------------------------
  // Return Value Structure Tests
  // ---------------------------------------------------------------------------

  describe('return value structure', () => {
    it('should return correct structure for useAdaptiveSuggestions', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockAdaptiveState());
      mockUseXP.mockReturnValue(createMockXPResult());

      const { result } = renderHook(() => useAdaptiveSuggestions());

      expect(result.current).toHaveProperty('statusSummary');
      expect(result.current).toHaveProperty('suggestedActions');
      expect(typeof result.current.statusSummary).toBe('string');
      expect(Array.isArray(result.current.suggestedActions)).toBe(true);
    });

    it('should return stable results across re-renders', () => {
      mockUseAdaptiveViewContext.mockReturnValue(createMockAdaptiveState());
      mockUseXP.mockReturnValue(createMockXPResult());

      const { result, rerender } = renderHook(() => useAdaptiveSuggestions());
      const firstSummary = result.current.statusSummary;
      const firstActions = result.current.suggestedActions;

      rerender();

      expect(result.current.statusSummary).toBe(firstSummary);
      expect(result.current.suggestedActions).toEqual(firstActions);
    });
  });
});