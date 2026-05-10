import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useShareCardData, type SessionResult } from '../useShareCardData';
import { useXP } from '../useXP';
import { useBadges } from '../useBadges';
import { useLeaderboard } from '../useLeaderboard';
import { storage } from '@/services/storage';
import type { ShareCardData } from '@/data/types';

// Mock the dependencies
vi.mock('../useXP');
vi.mock('../useBadges');
vi.mock('../useLeaderboard');
vi.mock('@/services/storage');

describe('useShareCardData', () => {
  const mockProfile = {
    totalXP: 500,
    currentLevel: 3,
    levelProgress: 75,
  };

  const mockStreak = 10;

  const mockBADGE_DEFINITIONS = [
    { id: 'badge-1', title: 'Badge 1', description: 'Desc 1', category: 'answer' as const, icon: 'icon-1', conditionType: 'total_answered' as const, conditionValue: 10 },
    { id: 'badge-2', title: 'Badge 2', description: 'Desc 2', category: 'streak' as const, icon: 'icon-2', conditionType: 'max_streak' as const, conditionValue: 5 },
    { id: 'badge-3', title: 'Badge 3', description: 'Desc 3', category: 'level' as const, icon: 'icon-3', conditionType: 'level' as const, conditionValue: 3 },
    { id: 'badge-4', title: 'Badge 4', description: 'Desc 4', category: 'session' as const, icon: 'icon-4', conditionType: 'total_sessions' as const, conditionValue: 10 },
    { id: 'badge-5', title: 'Badge 5', description: 'Desc 5', category: 'review' as const, icon: 'icon-5', conditionType: 'total_reviews' as const, conditionValue: 20 },
  ];

  const mockBadgeState = {
    unlocked: [
      { id: 'badge-1', unlockedAt: 1000 },
      { id: 'badge-2', unlockedAt: 2000 },
      { id: 'badge-3', unlockedAt: 3000 },
    ],
    progress: {
      totalAnswered: 10,
      totalCorrect: 8,
      totalSessions: 5,
      maxStreakEver: 15,
      perfectSessions: 2,
      totalReviews: 3,
      totalChallengesCompleted: 1,
    },
  };

  const mockGetLeaderboardEntries = vi.fn(() => [
    { rank: 1, sessionId: 's1', dictionaryName: 'Test', score: 200, accuracy: 95, speed: 100, timestamp: Date.now() },
    { rank: 2, sessionId: 's2', dictionaryName: 'Test', score: 150, accuracy: 88, speed: 80, timestamp: Date.now() },
  ]);

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Setup default mocks
    vi.mocked(useXP).mockReturnValue({
      profile: mockProfile,
      streak: mockStreak,
      addXP: vi.fn(),
      resetXPProfile: vi.fn(),
      maxStreakReached: mockStreak,
      recordCorrectAnswer: vi.fn(),
      recordWrongAnswer: vi.fn(),
      resetStreak: vi.fn(),
    });

    vi.mocked(useBadges).mockReturnValue({
      BADGE_DEFINITIONS: mockBADGE_DEFINITIONS,
      badgeState: mockBadgeState,
      badgeProgress: mockBadgeState.progress,
      unlockedCount: 3,
      unlockedIds: new Set(['badge-1', 'badge-2', 'badge-3']),
      trackProgress: vi.fn(),
      checkBadges: vi.fn(() => []),
      getBadgeProgressPercent: vi.fn(() => 0),
      resetBadges: vi.fn(),
    });

    vi.mocked(useLeaderboard).mockReturnValue({
      getLeaderboardEntries: mockGetLeaderboardEntries,
    });

    vi.mocked(storage.getBadges).mockReturnValue(mockBadgeState);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('XP data structure', () => {
    it('returns correct XP data from useXP profile', () => {
      const { result } = renderHook(() => useShareCardData());

      expect(result.current.xp).toEqual({
        totalXP: 500,
        currentLevel: 3,
        levelProgress: 75,
      });
    });

    it('uses profile values directly without transformation', () => {
      const customProfile = {
        totalXP: 1000,
        currentLevel: 5,
        levelProgress: 25,
      };

      vi.mocked(useXP).mockReturnValue({
        profile: customProfile,
        streak: 5,
        addXP: vi.fn(),
        resetXPProfile: vi.fn(),
        maxStreakReached: 5,
        recordCorrectAnswer: vi.fn(),
        recordWrongAnswer: vi.fn(),
        resetStreak: vi.fn(),
      });

      const { result } = renderHook(() => useShareCardData());

      expect(result.current.xp.totalXP).toBe(1000);
      expect(result.current.xp.currentLevel).toBe(5);
      expect(result.current.xp.levelProgress).toBe(25);
    });
  });

  describe('session data', () => {
    it('returns correct session data when sessionResult is provided', () => {
      const sessionResult: SessionResult = {
        score: 150,
        accuracy: 92,
        streak: 8,
      };

      const { result } = renderHook(() => useShareCardData(sessionResult));

      expect(result.current.session).toEqual({
        score: 150,
        accuracy: 92,
        streak: 8,
      });
    });

    it('falls back to zero values when sessionResult is not provided', () => {
      const { result } = renderHook(() => useShareCardData());

      expect(result.current.session).toEqual({
        score: 0,
        accuracy: 0,
        streak: mockStreak, // streak falls back to useXP streak
      });
    });

    it('falls back to useXP streak when sessionResult streak is undefined', () => {
      const sessionResult: SessionResult = {
        score: 100,
        accuracy: 85,
        streak: undefined as unknown as number,
      };

      const { result } = renderHook(() => useShareCardData(sessionResult));

      expect(result.current.session.streak).toBe(mockStreak);
    });

    it('uses streak from useXP when no session provided', () => {
      const customStreak = 25;

      vi.mocked(useXP).mockReturnValue({
        profile: mockProfile,
        streak: customStreak,
        addXP: vi.fn(),
        resetXPProfile: vi.fn(),
        maxStreakReached: customStreak,
        recordCorrectAnswer: vi.fn(),
        recordWrongAnswer: vi.fn(),
        resetStreak: vi.fn(),
      });

      const { result } = renderHook(() => useShareCardData());

      expect(result.current.session.streak).toBe(customStreak);
    });
  });

  describe('badge structure', () => {
    it('returns badges with id and icon from definitions', () => {
      const { result } = renderHook(() => useShareCardData());

      // Badges should be sorted by unlockedAt descending (most recent first)
      expect(result.current.badges).toHaveLength(3);
      expect(result.current.badges[0]).toEqual({ id: 'badge-3', icon: 'icon-3' }); // unlockedAt: 3000
      expect(result.current.badges[1]).toEqual({ id: 'badge-2', icon: 'icon-2' }); // unlockedAt: 2000
      expect(result.current.badges[2]).toEqual({ id: 'badge-1', icon: 'icon-1' }); // unlockedAt: 1000
    });

    it('returns empty badges array when no badges unlocked', () => {
      vi.mocked(storage.getBadges).mockReturnValue({
        unlocked: [],
        progress: mockBadgeState.progress,
      });

      const { result } = renderHook(() => useShareCardData());

      expect(result.current.badges).toEqual([]);
      expect(result.current.badges).toHaveLength(0);
    });

    it('correctly limits badges to top 3', () => {
      const manyBadges = {
        unlocked: [
          { id: 'badge-1', unlockedAt: 1000 },
          { id: 'badge-2', unlockedAt: 2000 },
          { id: 'badge-3', unlockedAt: 3000 },
          { id: 'badge-4', unlockedAt: 4000 },
          { id: 'badge-5', unlockedAt: 5000 },
        ],
        progress: mockBadgeState.progress,
      };

      vi.mocked(storage.getBadges).mockReturnValue(manyBadges);

      const { result } = renderHook(() => useShareCardData());

      expect(result.current.badges).toHaveLength(3);
      // Should be top 3 by unlockedAt descending
      expect(result.current.badges[0]).toEqual({ id: 'badge-5', icon: 'icon-5' });
      expect(result.current.badges[1]).toEqual({ id: 'badge-4', icon: 'icon-4' });
      expect(result.current.badges[2]).toEqual({ id: 'badge-3', icon: 'icon-3' });
    });

    it('excludes badges with missing definitions', () => {
      vi.mocked(storage.getBadges).mockReturnValue({
        unlocked: [
          { id: 'badge-1', unlockedAt: 1000 },
          { id: 'unknown-badge', unlockedAt: 2000 }, // This one has no definition
        ],
        progress: mockBadgeState.progress,
      });

      const { result } = renderHook(() => useShareCardData());

      // Should only include badge-1, unknown-badge should be filtered out
      expect(result.current.badges).toHaveLength(1);
      expect(result.current.badges[0]).toEqual({ id: 'badge-1', icon: 'icon-1' });
    });
  });

  describe('leaderboard rank', () => {
    it('returns rank from top leaderboard entry', () => {
      const { result } = renderHook(() => useShareCardData());

      expect(result.current.rank).toBe(1);
    });

    it('returns 0 when no leaderboard entries', () => {
      mockGetLeaderboardEntries.mockReturnValueOnce([]);

      const { result } = renderHook(() => useShareCardData());

      expect(result.current.rank).toBe(0);
    });

    it('returns rank 0 when entries have rank 0', () => {
      mockGetLeaderboardEntries.mockReturnValueOnce([
        { rank: 0, sessionId: 's1', dictionaryName: 'Test', score: 100, accuracy: 80, speed: 50, timestamp: Date.now() },
      ]);

      const { result } = renderHook(() => useShareCardData());

      expect(result.current.rank).toBe(0);
    });

    it('uses first entry rank regardless of sort order', () => {
      mockGetLeaderboardEntries.mockReturnValueOnce([
        { rank: 5, sessionId: 's1', dictionaryName: 'Test', score: 100, accuracy: 80, speed: 50, timestamp: Date.now() },
        { rank: 1, sessionId: 's2', dictionaryName: 'Test', score: 200, accuracy: 90, speed: 100, timestamp: Date.now() },
      ]);

      const { result } = renderHook(() => useShareCardData());

      // User's rank is based on their highest score entry (first in sorted list)
      expect(result.current.rank).toBe(5);
    });
  });

  describe('app name', () => {
    it('returns appName as en-learn', () => {
      const { result } = renderHook(() => useShareCardData());

      expect(result.current.appName).toBe('en-learn');
    });
  });

  describe('complete share card data structure', () => {
    it('returns complete ShareCardData structure', () => {
      const sessionResult: SessionResult = {
        score: 120,
        accuracy: 88,
        streak: 7,
      };

      const { result } = renderHook(() => useShareCardData(sessionResult));

      const expected: ShareCardData = {
        xp: {
          totalXP: 500,
          currentLevel: 3,
          levelProgress: 75,
        },
        session: {
          score: 120,
          accuracy: 88,
          streak: 7,
        },
        badges: [
          { id: 'badge-3', icon: 'icon-3' },
          { id: 'badge-2', icon: 'icon-2' },
          { id: 'badge-1', icon: 'icon-1' },
        ],
        rank: 1,
        appName: 'en-learn',
      };

      expect(result.current).toEqual(expected);
    });
  });

  describe('dependency updates', () => {
    it('updates when session result changes', () => {
      const { result, rerender } = renderHook(
        ({ session }: { session?: SessionResult }) => useShareCardData(session),
        { initialProps: { session: undefined as SessionResult | undefined } }
      );

      expect(result.current.session.score).toBe(0);

      const newSession: SessionResult = { score: 100, accuracy: 90, streak: 5 };
      rerender({ session: newSession });

      expect(result.current.session.score).toBe(100);
      expect(result.current.session.accuracy).toBe(90);
      expect(result.current.session.streak).toBe(5);
    });

    it('updates when profile changes', () => {
      const { result, rerender } = renderHook(
        ({ profile }: { profile: typeof mockProfile }) => {
          vi.mocked(useXP).mockReturnValue({
            profile,
            streak: mockStreak,
            addXP: vi.fn(),
            resetXPProfile: vi.fn(),
            maxStreakReached: mockStreak,
            recordCorrectAnswer: vi.fn(),
            recordWrongAnswer: vi.fn(),
            resetStreak: vi.fn(),
          });
          return useShareCardData();
        },
        { initialProps: { profile: mockProfile } }
      );

      expect(result.current.xp.totalXP).toBe(500);

      const newProfile = { ...mockProfile, totalXP: 750, currentLevel: 4 };
      rerender({ profile: newProfile });

      expect(result.current.xp.totalXP).toBe(750);
      expect(result.current.xp.currentLevel).toBe(4);
    });
  });
});