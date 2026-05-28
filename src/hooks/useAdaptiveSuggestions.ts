/**
 * useAdaptiveSuggestions Hook
 *
 * Generates contextual suggestions for the user based on their learning state,
 * combining data from useAdaptiveViewContext and useXP hooks.
 *
 * Output:
 * - statusSummary: A human-readable description of the current learning state
 * - suggestedActions: Prioritized list of recommended actions
 *
 * This hook is pure/derived — it does not mutate any state.
 */

import { useMemo } from 'react';
import { useAdaptiveViewContext } from '@/hooks/useAdaptiveViewContext';
import { useXP } from '@/hooks/useXP';
import type { FlowState } from '@/hooks/useFlowState';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A suggested action for the user.
 */
export interface SuggestedAction {
  /** Unique identifier for the action */
  id: string;
  /** Short title for the action */
  title: string;
  /** Detailed description explaining the action */
  description: string;
  /** Priority score (higher = more important) */
  priority: number;
  /** Optional icon identifier */
  icon?: string;
  /** Optional associated view ID to navigate to */
  viewId?: string;
}

/**
 * Return type for useAdaptiveSuggestions hook.
 */
export interface UseAdaptiveSuggestionsResult {
  /** Human-readable description of current learning state */
  statusSummary: string;
  /** Sorted list of suggested actions (descending priority) */
  suggestedActions: SuggestedAction[];
}

// ---------------------------------------------------------------------------
// Priority Constants
// ---------------------------------------------------------------------------

/** Action IDs for deduplication and identification */
const ACTION_ID = {
  FOCUS_CHALLENGE: 'focused-challenge',
  FOCUS_LEADERBOARD: 'focused-leaderboard',
  REST_RECOVERY: 'rest-recovery',
  REST_BREAK: 'rest-break',
  PRACTICE_TARGETED: 'practice-targeted',
  PRACTICE_STARTER: 'practice-starter',
  CHALLENGE_STARTER: 'challenge-starter',
  STREAK_ACKNOWLEDGE: 'streak-acknowledge',
  STREAK_REBUILD: 'streak-rebuild',
  LEVEL_UP_PROGRESS: 'level-up-progress',
  FATIGUE_WARNING: 'fatigue-warning',
  ACCURACY_IMPROVE: 'accuracy-improve',
} as const;

/** Priority tiers for categorization */
const PriorityTier = {
  CRITICAL: 100,  // Immediate attention needed
  HIGH: 80,       // Strong recommendation
  MEDIUM: 50,     // Helpful suggestion
  LOW: 30,        // Nice to have
} as const;

// ---------------------------------------------------------------------------
// Status Summary Generation
// ---------------------------------------------------------------------------

/**
 * Generates a human-readable status summary based on the current learning state.
 */
function generateStatusSummary(
  flowState: FlowState,
  recentAccuracy: number,
  hasWeaknessBias: boolean,
  weaknessCount: number,
  level: number,
  streak: number,
  _maxStreakReached: number
): string {
  const parts: string[] = [];

  // Flow state description
  switch (flowState) {
    case 'focused':
      parts.push('状态极佳');
      break;
    case 'fatigued':
      parts.push('状态疲劳');
      break;
    case 'normal':
    default:
      parts.push('状态一般');
      break;
  }

  // Accuracy description
  const accuracyPercent = Math.round(recentAccuracy * 100);
  if (recentAccuracy >= 0.8) {
    parts.push(`正确率高 (${accuracyPercent}%)`);
  } else if (recentAccuracy >= 0.5) {
    parts.push(`正确率中等 (${accuracyPercent}%)`);
  } else if (recentAccuracy > 0) {
    parts.push(`正确率偏低 (${accuracyPercent}%)`);
  }

  // Weakness description
  if (hasWeaknessBias && weaknessCount > 0) {
    parts.push(`${weaknessCount}个薄弱点待提升`);
  }

  // Level description
  if (level >= 10) {
    parts.push('高等级学习者');
  } else if (level >= 5) {
    parts.push('进阶学习者');
  } else {
    parts.push('初学者');
  }

  // Streak description
  if (streak >= 5) {
    parts.push(`连续学习${streak}天`);
  } else if (streak >= 3) {
    parts.push(`保持${streak}天连续`);
  }

  return parts.join(' | ');
}

// ---------------------------------------------------------------------------
// Action Generation
// ---------------------------------------------------------------------------

/**
 * Generates suggested actions based on flow state.
 */
function generateFlowStateActions(
  flowState: FlowState,
  recentAccuracy: number
): SuggestedAction[] {
  const actions: SuggestedAction[] = [];

  switch (flowState) {
    case 'focused':
      // High accuracy, good momentum — encourage challenges
      actions.push({
        id: ACTION_ID.FOCUS_CHALLENGE,
        title: '挑战高难度',
        description: '状态极佳，适合挑战更高难度内容',
        priority: PriorityTier.HIGH,
        icon: 'fire',
        viewId: 'challenge',
      });
      actions.push({
        id: ACTION_ID.FOCUS_LEADERBOARD,
        title: '查看排行榜',
        description: '与好友竞争，激发学习动力',
        priority: PriorityTier.MEDIUM,
        icon: 'trophy',
        viewId: 'leaderboard',
      });
      break;

    case 'fatigued':
      // Low energy — suggest rest and recovery
      actions.push({
        id: ACTION_ID.REST_RECOVERY,
        title: '建议休息',
        description: '疲劳状态可能影响学习效果，建议休息片刻',
        priority: PriorityTier.CRITICAL,
        icon: 'moon',
      });
      actions.push({
        id: ACTION_ID.REST_BREAK,
        title: '轻松复习',
        description: '可以选择轻松的复习模式，避免过度疲劳',
        priority: PriorityTier.HIGH,
        icon: 'book',
        viewId: 'review',
      });
      break;

    case 'normal':
    default:
      // Regular state — moderate suggestions based on accuracy
      if (recentAccuracy < 0.5) {
        actions.push({
          id: ACTION_ID.FATIGUE_WARNING,
          title: '注意调整节奏',
          description: '正确率偏低，建议从基础内容开始',
          priority: PriorityTier.HIGH,
          icon: 'alert',
          viewId: 'practice',
        });
      } else if (recentAccuracy >= 0.7) {
        actions.push({
          id: ACTION_ID.ACCURACY_IMPROVE,
          title: '稳步提升',
          description: '状态良好，可以适当提高难度',
          priority: PriorityTier.MEDIUM,
          icon: 'trending-up',
          viewId: 'challenge',
        });
      }
      break;
  }

  return actions;
}

/**
 * Generates suggested actions based on XP and level.
 */
function generateXPActions(
  level: number,
  totalXP: number,
  flowState: FlowState
): SuggestedAction[] {
  const actions: SuggestedAction[] = [];

  // Low level users — encourage practice
  if (level <= 3) {
    actions.push({
      id: ACTION_ID.PRACTICE_STARTER,
      title: '打好基础',
      description: '当前等级较低，建议多练习巩固基础',
      priority: PriorityTier.MEDIUM,
      icon: 'book-open',
      viewId: 'practice',
    });
  }

  // High level users — suggest challenges
  if (level >= 8 && flowState !== 'fatigued') {
    actions.push({
      id: ACTION_ID.CHALLENGE_STARTER,
      title: '挑战自我',
      description: '等级较高，可以尝试更具挑战性的内容',
      priority: PriorityTier.MEDIUM,
      icon: 'target',
      viewId: 'challenge',
    });
  }

  // Level-up progress indicator
  // Calculate XP progress within current level (each level requires level * 100 XP)
  const xpAtLevelStart = (level - 1) * 100;
  const xpAtLevelEnd = level * 100;
  const xpInCurrentLevel = totalXP - xpAtLevelStart;
  const xpNeededForLevel = xpAtLevelEnd - xpAtLevelStart;
  const progressPercent = Math.round((xpInCurrentLevel / xpNeededForLevel) * 100);
  if (progressPercent >= 70 && flowState !== 'fatigued') {
    const xpToNextLevel = xpAtLevelEnd - totalXP;
    actions.push({
      id: ACTION_ID.LEVEL_UP_PROGRESS,
      title: '即将升级',
      description: `距离下一级只差${xpToNextLevel}XP，继续加油`,
      priority: PriorityTier.LOW,
      icon: 'star',
    });
  }

  return actions;
}

/**
 * Generates suggested actions based on weaknesses.
 */
function generateWeaknessActions(
  hasWeaknessBias: boolean,
  weaknessCount: number
): SuggestedAction[] {
  const actions: SuggestedAction[] = [];

  if (hasWeaknessBias && weaknessCount > 0) {
    actions.push({
      id: ACTION_ID.PRACTICE_TARGETED,
      title: '针对性练习',
      description: `检测到${weaknessCount}个薄弱点，建议进行针对性练习`,
      priority: PriorityTier.HIGH,
      icon: 'crosshair',
      viewId: 'practice',
    });
  }

  return actions;
}

/**
 * Generates suggested actions based on streak.
 */
function generateStreakActions(
  streak: number,
  maxStreakReached: number
): SuggestedAction[] {
  const actions: SuggestedAction[] = [];

  if (streak >= 3) {
    // Acknowledge good streak
    actions.push({
      id: ACTION_ID.STREAK_ACKNOWLEDGE,
      title: '保持连续',
      description: `已连续学习${streak}天，继续保持`,
      priority: PriorityTier.LOW,
      icon: 'flame',
    });
  } else if (streak === 0 && maxStreakReached > 0) {
    // Encouraging message to rebuild streak
    actions.push({
      id: ACTION_ID.STREAK_REBUILD,
      title: '重新开始',
      description: '连续已中断，但你可以重新开始',
      priority: PriorityTier.MEDIUM,
      icon: 'refresh-cw',
    });
  }

  return actions;
}

// ---------------------------------------------------------------------------
// Main Hook
// ---------------------------------------------------------------------------

/**
 * Custom hook that generates adaptive suggestions based on the user's
 * learning state from multiple sources.
 *
 * @returns UseAdaptiveSuggestionsResult with statusSummary and suggestedActions
 */
export function useAdaptiveSuggestions(): UseAdaptiveSuggestionsResult {
  // Source 1: Adaptive view context
  const adaptiveState = useAdaptiveViewContext();

  // Source 2: XP and level data
  const { profile, streak, maxStreakReached } = useXP();

  const result = useMemo<UseAdaptiveSuggestionsResult>(() => {
    const {
      flowState,
      recentAccuracy,
      hasWeaknessBias,
      weaknessCount,
    } = adaptiveState;

    const { currentLevel, totalXP } = profile;

    // Generate status summary
    const statusSummary = generateStatusSummary(
      flowState,
      recentAccuracy,
      hasWeaknessBias,
      weaknessCount,
      currentLevel,
      streak,
      maxStreakReached
    );

    // Generate all actions
    const flowActions = generateFlowStateActions(flowState, recentAccuracy);
    const xpActions = generateXPActions(currentLevel, totalXP, flowState);
    const weaknessActions = generateWeaknessActions(hasWeaknessBias, weaknessCount);
    const streakActions = generateStreakActions(streak, maxStreakReached);

    // Merge and deduplicate by action id
    const actionMap = new Map<string, SuggestedAction>();
    for (const action of [...flowActions, ...xpActions, ...weaknessActions, ...streakActions]) {
      // Keep the higher priority action if duplicate ids
      const existing = actionMap.get(action.id);
      if (!existing || action.priority > existing.priority) {
        actionMap.set(action.id, action);
      }
    }

    // Sort by priority descending
    const suggestedActions = Array.from(actionMap.values()).sort(
      (a, b) => b.priority - a.priority
    );

    return {
      statusSummary,
      suggestedActions,
    };
  }, [adaptiveState, profile, streak, maxStreakReached]);

  return result;
}

export default useAdaptiveSuggestions;