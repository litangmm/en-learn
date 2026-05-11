import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { ViewRouter } from '../ViewRouter';
import { MistakeBook } from '@/components/MistakeBook';
import { HistoryView } from '@/components/HistoryView';
import { DataManager } from '@/components/DataManager';
import { SmartReview } from '@/components/SmartReview';
import { DailyChallengePanel } from '@/components/DailyChallengePanel';
import { BadgePanel } from '@/components/BadgePanel';
import { Leaderboard } from '@/components/Leaderboard';
import { ProgressHub } from '@/components/ProgressHub';
import type { DailyChallenge, LeaderboardEntry, LeaderboardCategory, LeaderboardTimeFilter } from '@/data/types';

// Mock child components
vi.mock('@/components/MistakeBook', () => ({
  MistakeBook: vi.fn(() => <div data-testid="mistake-book">MistakeBook</div>),
}));

vi.mock('@/components/HistoryView', () => ({
  HistoryView: vi.fn(() => <div data-testid="history-view">HistoryView</div>),
}));

vi.mock('@/components/DataManager', () => ({
  DataManager: vi.fn(() => <div data-testid="data-manager">DataManager</div>),
}));

vi.mock('@/components/SmartReview', () => ({
  SmartReview: vi.fn(() => <div data-testid="smart-review">SmartReview</div>),
}));

vi.mock('@/components/DailyChallengePanel', () => ({
  DailyChallengePanel: vi.fn(() => <div data-testid="daily-challenge-panel">DailyChallengePanel</div>),
}));

vi.mock('@/components/BadgePanel', () => ({
  BadgePanel: vi.fn(() => <div data-testid="badge-panel">BadgePanel</div>),
}));

vi.mock('@/components/Leaderboard', () => ({
  Leaderboard: vi.fn(() => <div data-testid="leaderboard">Leaderboard</div>),
}));

vi.mock('@/components/ProgressHub', () => ({
  ProgressHub: vi.fn(() => <div data-testid="progress-hub">ProgressHub</div>),
}));

function createMockChallenges(): DailyChallenge[] {
  return [
    {
      id: 'challenge-1',
      title: '完成5道填空题',
      description: '正确完成5道填空题练习',
      type: 'correct',
      target: 5,
      current: 3,
      completed: false,
      claimed: false,
      rewardXP: 20,
    },
  ];
}

function createMockLeaderboardEntries(): LeaderboardEntry[] {
  return [
    {
      rank: 1,
      sessionId: 'session-1',
      dictionaryName: 'CET-4',
      score: 1000,
      accuracy: 85,
      speed: 50,
      timestamp: Date.now(),
    },
    {
      rank: 2,
      sessionId: 'session-2',
      dictionaryName: 'CET-6',
      score: 900,
      accuracy: 78,
      speed: 45,
      timestamp: Date.now() - 86400000,
    },
  ];
}

function createDefaultProps() {
  return {
    view: 'practice' as const,
    onNavigate: vi.fn(),
    onPracticeMistakes: vi.fn(),
    onBackFromMistakeBook: vi.fn(),
    onBackFromHistory: vi.fn(),
    onBackFromDataManager: vi.fn(),
    onNavigateDataManager: vi.fn(),
    onPracticeReview: vi.fn(),
    onBackFromSmartReview: vi.fn(),
    challenges: createMockChallenges(),
    onClaimReward: vi.fn(),
    onBackFromChallenges: vi.fn(),
    unlockedBadgeIds: new Set<string>(),
    getBadgeProgress: vi.fn(() => 0),
    onBackFromBadges: vi.fn(),
    leaderboardEntries: createMockLeaderboardEntries(),
    leaderboardCategory: 'accuracy' as LeaderboardCategory,
    leaderboardTimeFilter: 'today' as LeaderboardTimeFilter,
    onLeaderboardCategoryChange: vi.fn(),
    onLeaderboardTimeFilterChange: vi.fn(),
    onBackFromLeaderboard: vi.fn(),
  };
}

describe('ViewRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('View mapping', () => {
    it('renders MistakeBook when view is mistake-book', () => {
      const props = createDefaultProps();
      render(<ViewRouter {...props} view="mistake-book" />);

      const mockCalls = (MistakeBook as ReturnType<typeof vi.fn>).mock.calls;
      expect(mockCalls.length).toBe(1);
      expect(mockCalls[0][0]).toMatchObject({
        onPracticeMistakes: props.onPracticeMistakes,
        onBack: props.onBackFromMistakeBook,
      });
    });

    it('renders HistoryView when view is history', () => {
      const props = createDefaultProps();
      render(<ViewRouter {...props} view="history" />);

      const mockCalls = (HistoryView as ReturnType<typeof vi.fn>).mock.calls;
      expect(mockCalls.length).toBe(1);
      expect(mockCalls[0][0]).toMatchObject({
        onBack: props.onBackFromHistory,
      });
    });

    it('renders DataManager when view is data', () => {
      const props = createDefaultProps();
      render(<ViewRouter {...props} view="data" />);

      const mockCalls = (DataManager as ReturnType<typeof vi.fn>).mock.calls;
      expect(mockCalls.length).toBe(1);
      expect(mockCalls[0][0]).toMatchObject({
        onBack: props.onBackFromDataManager,
      });
    });

    it('renders SmartReview when view is review', () => {
      const props = createDefaultProps();
      render(<ViewRouter {...props} view="review" />);

      const mockCalls = (SmartReview as ReturnType<typeof vi.fn>).mock.calls;
      expect(mockCalls.length).toBe(1);
      expect(mockCalls[0][0]).toMatchObject({
        onPracticeReview: props.onPracticeReview,
        onBack: props.onBackFromSmartReview,
      });
    });

    it('renders DailyChallengePanel when view is challenges', () => {
      const props = createDefaultProps();
      render(<ViewRouter {...props} view="challenges" />);

      const mockCalls = (DailyChallengePanel as ReturnType<typeof vi.fn>).mock.calls;
      expect(mockCalls.length).toBe(1);
      expect(mockCalls[0][0]).toMatchObject({
        challenges: props.challenges,
        onClaim: props.onClaimReward,
        onBack: props.onBackFromChallenges,
      });
    });

    it('renders BadgePanel when view is badges', () => {
      const props = createDefaultProps();
      render(<ViewRouter {...props} view="badges" />);

      const mockCalls = (BadgePanel as ReturnType<typeof vi.fn>).mock.calls;
      expect(mockCalls.length).toBe(1);
      expect(mockCalls[0][0]).toMatchObject({
        unlockedIds: props.unlockedBadgeIds,
        getProgress: props.getBadgeProgress,
        onBack: props.onBackFromBadges,
      });
    });

    it('renders Leaderboard when view is leaderboard', () => {
      const props = createDefaultProps();
      render(<ViewRouter {...props} view="leaderboard" />);

      const mockCalls = (Leaderboard as ReturnType<typeof vi.fn>).mock.calls;
      expect(mockCalls.length).toBe(1);
      expect(mockCalls[0][0]).toMatchObject({
        entries: props.leaderboardEntries,
        category: props.leaderboardCategory,
        timeFilter: props.leaderboardTimeFilter,
        onCategoryChange: props.onLeaderboardCategoryChange,
        onTimeFilterChange: props.onLeaderboardTimeFilterChange,
        onBack: props.onBackFromLeaderboard,
      });
    });

    it('returns null when view is practice', () => {
      const props = createDefaultProps();
      const { container } = render(<ViewRouter {...props} view="practice" />);

      expect(container.firstChild).toBeNull();
    });

    it('renders ProgressHub when view is progress', () => {
      const props = createDefaultProps();
      render(<ViewRouter {...props} view="progress" />);

      const mockCalls = (ProgressHub as ReturnType<typeof vi.fn>).mock.calls;
      expect(mockCalls.length).toBe(1);
      expect(mockCalls[0][0]).toMatchObject({
        onNavigate: props.onNavigate,
      });
    });

    it('returns null for unknown views (default case)', () => {
      const props = createDefaultProps();
      // @ts-expect-error - testing with invalid view
      const { container } = render(<ViewRouter {...props} view="unknown-view" />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Props passing', () => {
    it('passes correct props to MistakeBook', () => {
      const props = createDefaultProps();
      render(<ViewRouter {...props} view="mistake-book" />);

      const mockCalls = (MistakeBook as ReturnType<typeof vi.fn>).mock.calls;
      expect(mockCalls.length).toBe(1);
      expect(mockCalls[0][0]).toHaveProperty('onPracticeMistakes', props.onPracticeMistakes);
      expect(mockCalls[0][0]).toHaveProperty('onBack', props.onBackFromMistakeBook);
    });

    it('passes correct props to HistoryView', () => {
      const props = createDefaultProps();
      render(<ViewRouter {...props} view="history" />);

      const mockCalls = (HistoryView as ReturnType<typeof vi.fn>).mock.calls;
      expect(mockCalls.length).toBe(1);
      expect(mockCalls[0][0]).toHaveProperty('onBack', props.onBackFromHistory);
    });

    it('passes correct props to DataManager', () => {
      const props = createDefaultProps();
      render(<ViewRouter {...props} view="data" />);

      const mockCalls = (DataManager as ReturnType<typeof vi.fn>).mock.calls;
      expect(mockCalls.length).toBe(1);
      expect(mockCalls[0][0]).toHaveProperty('onBack', props.onBackFromDataManager);
    });

    it('passes correct props to SmartReview', () => {
      const props = createDefaultProps();
      render(<ViewRouter {...props} view="review" />);

      const mockCalls = (SmartReview as ReturnType<typeof vi.fn>).mock.calls;
      expect(mockCalls.length).toBe(1);
      expect(mockCalls[0][0]).toHaveProperty('onPracticeReview', props.onPracticeReview);
      expect(mockCalls[0][0]).toHaveProperty('onBack', props.onBackFromSmartReview);
    });

    it('passes correct props to DailyChallengePanel', () => {
      const props = createDefaultProps();
      const customChallenges = [{ ...createMockChallenges()[0], id: 'custom-challenge' }];
      render(<ViewRouter {...props} view="challenges" challenges={customChallenges} />);

      const mockCalls = (DailyChallengePanel as ReturnType<typeof vi.fn>).mock.calls;
      expect(mockCalls.length).toBe(1);
      expect(mockCalls[0][0]).toHaveProperty('challenges', customChallenges);
      expect(mockCalls[0][0]).toHaveProperty('onClaim', props.onClaimReward);
      expect(mockCalls[0][0]).toHaveProperty('onBack', props.onBackFromChallenges);
    });

    it('passes correct props to BadgePanel', () => {
      const props = createDefaultProps();
      const customBadgeIds = new Set(['badge-1', 'badge-2']);
      render(<ViewRouter {...props} view="badges" unlockedBadgeIds={customBadgeIds} />);

      const mockCalls = (BadgePanel as ReturnType<typeof vi.fn>).mock.calls;
      expect(mockCalls.length).toBe(1);
      expect(mockCalls[0][0]).toHaveProperty('unlockedIds', customBadgeIds);
      expect(mockCalls[0][0]).toHaveProperty('getProgress', props.getBadgeProgress);
      expect(mockCalls[0][0]).toHaveProperty('onBack', props.onBackFromBadges);
    });

    it('passes correct props to Leaderboard', () => {
      const props = createDefaultProps();
      const customEntries = [
        {
          rank: 1,
          sessionId: 'custom-session',
          dictionaryName: 'Custom',
          score: 500,
          accuracy: 90,
          speed: 40,
          timestamp: Date.now(),
        },
      ];
      const customCategory: LeaderboardCategory = 'speed';
      const customFilter: LeaderboardTimeFilter = 'week';

      render(
        <ViewRouter
          {...props}
          view="leaderboard"
          leaderboardEntries={customEntries}
          leaderboardCategory={customCategory}
          leaderboardTimeFilter={customFilter}
        />,
      );

      const mockCalls = (Leaderboard as ReturnType<typeof vi.fn>).mock.calls;
      expect(mockCalls.length).toBe(1);
      expect(mockCalls[0][0]).toHaveProperty('entries', customEntries);
      expect(mockCalls[0][0]).toHaveProperty('category', customCategory);
      expect(mockCalls[0][0]).toHaveProperty('timeFilter', customFilter);
      expect(mockCalls[0][0]).toHaveProperty('onCategoryChange', props.onLeaderboardCategoryChange);
      expect(mockCalls[0][0]).toHaveProperty('onTimeFilterChange', props.onLeaderboardTimeFilterChange);
      expect(mockCalls[0][0]).toHaveProperty('onBack', props.onBackFromLeaderboard);
    });
  });
});