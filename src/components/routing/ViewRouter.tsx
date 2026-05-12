import type { LeaderboardEntry, LeaderboardCategory, LeaderboardTimeFilter, DailyChallenge, Goal } from '@/data/types';
import { MistakeBook } from '@/components/MistakeBook';
import { HistoryView } from '@/components/HistoryView';
import { DataManager } from '@/components/DataManager';
import { SmartReview } from '@/components/SmartReview';
import { DailyChallengePanel } from '@/components/DailyChallengePanel';
import { BadgePanel } from '@/components/BadgePanel';
import { Leaderboard } from '@/components/Leaderboard';
import { DictionaryBrowser } from '@/components/DictionaryBrowser';
import { ProgressHub } from '@/components/ProgressHub';
import { LearningProfile } from '@/components/LearningProfile';
import { WeaknessPanel } from '@/components/WeaknessPanel';
import { LearningEfficiencyPanel } from '@/components/LearningEfficiencyPanel';
import { InviteFriendsPanel } from '@/components/InviteFriendsPanel';
import { GoalSettingPanel } from '@/components/GoalSettingPanel';

export type View =
  | 'practice'
  | 'progress'
  | 'profile'
  | 'efficiency'
  | 'mistake-book'
  | 'history'
  | 'data'
  | 'review'
  | 'weakness'
  | 'challenges'
  | 'badges'
  | 'leaderboard'
  | 'dictionary-browser'
  | 'invite'
  | 'goals';

export interface ViewRouterProps {
  view: View;
  // ProgressHub
  onNavigate: (view: View) => void;
  // LearningProfile
  onBackFromProfile?: () => void;
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
  // WeaknessPanel
  onPracticeWeaknesses: (sentenceIds: string[], dictionaryId: string) => void;
  onBackFromWeakness: () => void;
  // LearningEfficiencyPanel
  onBackFromEfficiency?: () => void;
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
  onBackFromInvite?: () => void;
  // GoalSettingPanel
  goals: Goal[];
  onSaveGoals: (goals: Goal[]) => void;
  onBackFromGoals: () => void;
}

export function ViewRouter(props: ViewRouterProps) {
  const {
    view,
    onNavigate,
    onBackFromProfile = () => {},
    onPracticeMistakes,
    onBackFromMistakeBook,
    onBackFromHistory,
    onBackFromDataManager,
    onNavigateDataManager,
    onPracticeReview,
    onBackFromSmartReview,
    onPracticeWeaknesses,
    onBackFromWeakness,
    onBackFromEfficiency = () => {},
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
    onBackFromInvite = () => {},
    goals,
    onSaveGoals,
    onBackFromGoals,
  } = props;

  switch (view) {
    case 'progress':
      return <ProgressHub onNavigate={onNavigate} goals={goals} />;

    case 'profile':
      return <LearningProfile onNavigate={onNavigate} onBack={onBackFromProfile} />;

    case 'efficiency':
      return <LearningEfficiencyPanel onBack={onBackFromEfficiency} />;

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

    case 'weakness':
      return (
        <WeaknessPanel
          onPracticeWeaknesses={onPracticeWeaknesses}
          onBack={onBackFromWeakness}
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

    case 'invite':
      return <InviteFriendsPanel onBack={onBackFromInvite} />;

    case 'goals':
      return (
        <GoalSettingPanel
          goals={goals}
          onSave={onSaveGoals}
          onBack={onBackFromGoals}
        />
      );

    case 'practice':
    default:
      return null;
  }
}