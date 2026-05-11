import type { LeaderboardEntry, LeaderboardCategory, LeaderboardTimeFilter, DailyChallenge } from '@/data/types';
import { MistakeBook } from '@/components/MistakeBook';
import { HistoryView } from '@/components/HistoryView';
import { DataManager } from '@/components/DataManager';
import { SmartReview } from '@/components/SmartReview';
import { DailyChallengePanel } from '@/components/DailyChallengePanel';
import { BadgePanel } from '@/components/BadgePanel';
import { Leaderboard } from '@/components/Leaderboard';
import { DictionaryBrowser } from '@/components/DictionaryBrowser';
import { ProgressHub } from '@/components/ProgressHub';

export type View =
  | 'practice'
  | 'progress'
  | 'mistake-book'
  | 'history'
  | 'data'
  | 'review'
  | 'challenges'
  | 'badges'
  | 'leaderboard'
  | 'dictionary-browser';

export interface ViewRouterProps {
  view: View;
  // ProgressHub
  onNavigate: (view: View) => void;
  // MistakeBook
  onPracticeMistakes: (sentenceIds: string[], dictionaryId: string) => void;
  onBackFromMistakeBook: () => void;
  // HistoryView
  onBackFromHistory: () => void;
  // DataManager
  onBackFromDataManager: () => void;
  onNavigateDataManager: (view: View) => void;
  // SmartReview
  onPracticeReview: (sentenceIds: string[], dictionaryId: string) => void;
  onBackFromSmartReview: () => void;
  // DailyChallengePanel
  challenges: DailyChallenge[];
  onClaimReward: (id: string) => void;
  onBackFromChallenges: () => void;
  // BadgePanel
  unlockedBadgeIds: Set<string>;
  getBadgeProgress: (id: string) => number;
  onBackFromBadges: () => void;
  // Leaderboard
  leaderboardEntries: LeaderboardEntry[];
  leaderboardCategory: LeaderboardCategory;
  leaderboardTimeFilter: LeaderboardTimeFilter;
  onLeaderboardCategoryChange: (category: LeaderboardCategory) => void;
  onLeaderboardTimeFilterChange: (filter: LeaderboardTimeFilter) => void;
  onBackFromLeaderboard: () => void;
}

export function ViewRouter(props: ViewRouterProps) {
  const {
    view,
    onNavigate,
    onPracticeMistakes,
    onBackFromMistakeBook,
    onBackFromHistory,
    onBackFromDataManager,
    onNavigateDataManager,
    onPracticeReview,
    onBackFromSmartReview,
    challenges,
    onClaimReward,
    onBackFromChallenges,
    unlockedBadgeIds,
    getBadgeProgress,
    onBackFromBadges,
    leaderboardEntries,
    leaderboardCategory,
    leaderboardTimeFilter,
    onLeaderboardCategoryChange,
    onLeaderboardTimeFilterChange,
    onBackFromLeaderboard,
  } = props;

  switch (view) {
    case 'progress':
      return <ProgressHub onNavigate={onNavigate} />;

    case 'mistake-book':
      return (
        <MistakeBook
          onPracticeMistakes={onPracticeMistakes}
          onBack={onBackFromMistakeBook}
        />
      );

    case 'history':
      return <HistoryView onBack={onBackFromHistory} />;

    case 'data':
      return <DataManager onBack={onBackFromDataManager} onNavigate={onNavigateDataManager} />;

    case 'review':
      return (
        <SmartReview
          onPracticeReview={onPracticeReview}
          onBack={onBackFromSmartReview}
        />
      );

    case 'challenges':
      return (
        <DailyChallengePanel
          challenges={challenges}
          onClaim={onClaimReward}
          onBack={onBackFromChallenges}
        />
      );

    case 'badges':
      return (
        <BadgePanel
          unlockedIds={unlockedBadgeIds}
          getProgress={getBadgeProgress}
          onBack={onBackFromBadges}
        />
      );

    case 'leaderboard':
      return (
        <Leaderboard
          entries={leaderboardEntries}
          category={leaderboardCategory}
          timeFilter={leaderboardTimeFilter}
          onCategoryChange={onLeaderboardCategoryChange}
          onTimeFilterChange={onLeaderboardTimeFilterChange}
          onBack={onBackFromLeaderboard}
        />
      );

    case 'dictionary-browser':
      return <DictionaryBrowser onBack={onBackFromDataManager} />;

    case 'practice':
    default:
      return null;
  }
}