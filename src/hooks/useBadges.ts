import { useState, useCallback, useMemo } from 'react';
import type { BadgeDefinition, BadgeState, BadgeProgress } from '@/data/types';
import { storage, BADGE_DEFINITIONS } from '@/services/storage';

export type TrackProgressType =
  | 'correct'
  | 'wrong'
  | 'session_complete'
  | 'perfect_session'
  | 'streak'
  | 'review'
  | 'challenge';

export function useBadges() {
  const [badgeState, setBadgeState] = useState<BadgeState>(() => storage.getBadges());
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress>(() => storage.getBadgeProgress());

  const trackProgress = useCallback((type: TrackProgressType, value?: number) => {
    const updated = storage.updateBadgeProgress((prev) => {
      switch (type) {
        case 'correct':
          return {
            totalCorrect: prev.totalCorrect + 1,
            totalAnswered: prev.totalAnswered + 1,
          };
        case 'wrong':
          return {
            totalAnswered: prev.totalAnswered + 1,
          };
        case 'session_complete':
          return {
            totalSessions: prev.totalSessions + 1,
          };
        case 'perfect_session':
          return {
            perfectSessions: prev.perfectSessions + 1,
          };
        case 'streak':
          return {
            maxStreakEver: value !== undefined ? Math.max(prev.maxStreakEver, value) : prev.maxStreakEver,
          };
        case 'review':
          return {
            totalReviews: prev.totalReviews + 1,
          };
        case 'challenge':
          return {
            totalChallengesCompleted: prev.totalChallengesCompleted + 1,
          };
        default:
          return {};
      }
    });
    setBadgeProgress(updated);
  }, []);

  const checkBadges = useCallback((level?: number) => {
    const currentProgress = storage.getBadgeProgress();
    const currentState = storage.getBadges();
    const unlockedIds = new Set(currentState.unlocked.map((b) => b.id));

    const newlyUnlocked: BadgeDefinition[] = [];

    for (const definition of BADGE_DEFINITIONS) {
      if (unlockedIds.has(definition.id)) {
        continue;
      }

      let meetsCondition = false;

      switch (definition.conditionType) {
        case 'total_answered':
          meetsCondition = currentProgress.totalAnswered >= definition.conditionValue;
          break;
        case 'total_correct':
          meetsCondition = currentProgress.totalCorrect >= definition.conditionValue;
          break;
        case 'max_streak':
          meetsCondition = currentProgress.maxStreakEver >= definition.conditionValue;
          break;
        case 'level':
          meetsCondition = level !== undefined && level >= definition.conditionValue;
          break;
        case 'total_sessions':
          meetsCondition = currentProgress.totalSessions >= definition.conditionValue;
          break;
        case 'perfect_sessions':
          meetsCondition = currentProgress.perfectSessions >= definition.conditionValue;
          break;
        case 'total_reviews':
          meetsCondition = currentProgress.totalReviews >= definition.conditionValue;
          break;
        case 'total_challenges':
          meetsCondition = currentProgress.totalChallengesCompleted >= definition.conditionValue;
          break;
      }

      if (meetsCondition) {
        newlyUnlocked.push(definition);
      }
    }

    if (newlyUnlocked.length > 0) {
      const newEntries = newlyUnlocked.map((def) => ({
        id: def.id,
        unlockedAt: Date.now(),
      }));

      const updatedState: BadgeState = {
        unlocked: [...currentState.unlocked, ...newEntries],
        progress: currentProgress,
      };

      storage.saveBadges(updatedState);
      setBadgeState(updatedState);
    }

    return newlyUnlocked;
  }, []);

  const getBadgeProgressPercent = useCallback((badgeId: string): number => {
    const definition = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
    if (!definition) return 0;

    const currentProgress = storage.getBadgeProgress();
    let current = 0;

    switch (definition.conditionType) {
      case 'total_answered':
        current = currentProgress.totalAnswered;
        break;
      case 'total_correct':
        current = currentProgress.totalCorrect;
        break;
      case 'max_streak':
        current = currentProgress.maxStreakEver;
        break;
      case 'level':
        // Level progress is computed externally; return 0 here
        current = 0;
        break;
      case 'total_sessions':
        current = currentProgress.totalSessions;
        break;
      case 'perfect_sessions':
        current = currentProgress.perfectSessions;
        break;
      case 'total_reviews':
        current = currentProgress.totalReviews;
        break;
      case 'total_challenges':
        current = currentProgress.totalChallengesCompleted;
        break;
    }

    return Math.min(1, current / definition.conditionValue);
  }, []);

  const resetBadges = useCallback(() => {
    localStorage.removeItem('en-learn-badges');
    localStorage.removeItem('en-learn-badge-progress');
    const defaultState: BadgeState = {
      unlocked: [],
      progress: {
        totalAnswered: 0,
        totalCorrect: 0,
        totalSessions: 0,
        maxStreakEver: 0,
        perfectSessions: 0,
        totalReviews: 0,
        totalChallengesCompleted: 0,
      },
    };
    setBadgeState(defaultState);
    setBadgeProgress(defaultState.progress);
  }, []);

  const unlockedIds = useMemo(
    () => new Set(badgeState.unlocked.map((b) => b.id)),
    [badgeState.unlocked]
  );

  return {
    unlockedIds,
    unlockedCount: badgeState.unlocked.length,
    badgeState,
    badgeProgress,
    trackProgress,
    checkBadges,
    getBadgeProgressPercent,
    resetBadges,
    BADGE_DEFINITIONS,
  };
}
