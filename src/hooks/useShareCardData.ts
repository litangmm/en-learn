import { useMemo } from 'react';
import { useXP } from './useXP';
import { useBadges } from './useBadges';
import { useLeaderboard } from './useLeaderboard';
import { storage } from '@/services/storage';
import type { ShareCardData } from '@/data/types';

export interface SessionResult {
  score: number;
  accuracy: number;
  streak: number;
}

/**
 * Hook that aggregates data from multiple sources for the share card UI.
 * Combines XP profile, session results, badges, and leaderboard rank.
 */
export function useShareCardData(sessionResult?: SessionResult): ShareCardData {
  // Get XP profile data
  const { profile, streak } = useXP();

  // Get badge data
  const { BADGE_DEFINITIONS } = useBadges();

  // Get leaderboard entries
  const { getLeaderboardEntries } = useLeaderboard();

  // Calculate user's rank from leaderboard
  const userRank = useMemo(() => {
    const entries = getLeaderboardEntries('score', 'all');
    // User is ranked based on their highest score entry
    // If no entries exist, return 0 (not ranked)
    if (entries.length === 0) {
      return 0;
    }
    // Entries are already sorted by score descending with rank assigned
    return entries[0]?.rank ?? 0;
  }, [getLeaderboardEntries]);

  // Get top 3 most recently unlocked badges with their icons
  const topBadges = useMemo(() => {
    // Get badge state directly from storage for unlocked badges
    const badgeState = storage.getBadges();

    // Sort unlocked badges by unlockedAt descending (most recent first)
    const sortedUnlocked = [...badgeState.unlocked].sort(
      (a, b) => b.unlockedAt - a.unlockedAt
    );

    // Take top 3 and map to badge definitions to get icons
    return sortedUnlocked
      .slice(0, 3)
      .map((unlocked) => {
        const definition = BADGE_DEFINITIONS.find((d) => d.id === unlocked.id);
        return definition ? { id: unlocked.id, icon: definition.icon } : null;
      })
      .filter((badge): badge is { id: string; icon: string } => badge !== null);
  }, [BADGE_DEFINITIONS]);

  // Determine session data: use provided result or fall back to streak from useXP
  const sessionData = useMemo(
    () => ({
      score: sessionResult?.score ?? 0,
      accuracy: sessionResult?.accuracy ?? 0,
      streak: sessionResult?.streak ?? streak,
    }),
    [sessionResult, streak]
  );

  // Build and return the aggregated share card data
  return useMemo(
    () => ({
      xp: {
        totalXP: profile.totalXP,
        currentLevel: profile.currentLevel,
        levelProgress: profile.levelProgress,
      },
      session: sessionData,
      badges: topBadges,
      rank: userRank,
      appName: 'en-learn',
    }),
    [profile, sessionData, topBadges, userRank]
  );
}
