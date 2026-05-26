import type {
  Goal,
  DailyChallenge,
  LeaderboardEntry,
  LeaderboardCategory,
  LeaderboardTimeFilter,
} from '@/data/types';
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
import { ChurnWarningDashboard } from '@/components/ChurnWarningDashboard';
import { LearnInsightPanel } from '@/components/LearnInsightPanel';
import { LearnInsightDashboard } from '@/components/LearnInsightDashboard';
import { LearningReportPanel } from '@/components/LearningReportPanel';
import { LearnProfilePanel } from '@/components/LearnProfilePanel';

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
  | 'goals'
  | 'churn-dashboard'
  | 'learn-insight'
  | 'learn-insight-dashboard'
  | 'learning-report'
  | 'learn-profile';

export interface ViewRouterProps {
  view: unknown;
  // Optional unified navigation method
  setView?: (_view: View) => void;
  // ProgressHub
  onNavigate: (_view: View) => void;
  // LearningProfile
  onBackFromProfile?: () => void;
  // MistakeBook
  onPracticeMistakes: (_sentenceIds: string[], _dictionaryId: string) => void;
  onBackFromMistakeBook: () => void;
  // HistoryView
  onBackFromHistory: () => void;
  // DataManager
  onBackFromDataManager: () => void;
  onNavigateDataManager: (_view: View) => void;
  // SmartReview
  onPracticeReview: (_sentenceIds: string[], _dictionaryId: string) => void;
  onBackFromSmartReview: () => void;
  // WeaknessPanel
  onPracticeWeaknesses: (_sentenceIds: string[], _dictionaryId: string) => void;
  onBackFromWeakness: () => void;
  // LearningEfficiencyPanel
  onBackFromEfficiency?: () => void;
  // DailyChallengePanel
  challenges: DailyChallenge[];
  onClaimReward: (_id: string) => void;
  onBackFromChallenges: () => void;
  // BadgePanel
  unlockedBadgeIds: Set<string>;
  getBadgeProgress: (_id: string) => number;
  onBackFromBadges: () => void;
  // Leaderboard
  leaderboardEntries: LeaderboardEntry[];
  leaderboardCategory: LeaderboardCategory;
  leaderboardTimeFilter: LeaderboardTimeFilter;
  onLeaderboardCategoryChange: (_category: LeaderboardCategory) => void;
  onLeaderboardTimeFilterChange: (_filter: LeaderboardTimeFilter) => void;
  onBackFromLeaderboard: () => void;
  onBackFromInvite?: () => void;
  // GoalSettingPanel
  goals?: Goal[];
  onSaveGoals: (_goals: Goal[]) => void;
  onBackFromGoals: () => void;
  // ChurnWarningDashboard
  onBackFromChurnDashboard?: () => void;
  // LearnInsightPanel
  onBackFromLearnInsight?: () => void;
  // LearnInsightDashboard
  onBackFromLearnInsightDashboard?: () => void;
  // LearningReportPanel props
  isLearningReportOpen?: boolean;
  onCloseLearningReport?: () => void;
  // LearnProfilePanel props
  onBackFromLearnProfile?: () => void;
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
    onBackFromChurnDashboard = () => {},
    onBackFromLearnInsight = () => {},
    onBackFromLearnInsightDashboard = () => {},
    isLearningReportOpen = false,
    onCloseLearningReport,
    onBackFromLearnProfile = () => {},
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

    case 'churn-dashboard':
      return <ChurnWarningDashboard onBack={onBackFromChurnDashboard} />;

    case 'learn-insight':
      return <LearnInsightPanel onBack={onBackFromLearnInsight} onNavigate={onNavigate} />;

    case 'learn-insight-dashboard':
      return <LearnInsightDashboard onBack={onBackFromLearnInsightDashboard} />;

    case 'learning-report':
      return (
        <LearningReportPanel
          isOpen={isLearningReportOpen}
          onClose={onCloseLearningReport || (() => {})}
        />
      );

    case 'learn-profile':
      return <LearnProfilePanel onBack={onBackFromLearnProfile} />;

    case 'practice':
    default:
      return null;
  }
}

/**
 * ViewNavigator provides a unified navigation interface for view transitions.
 * It accepts a setView method and optional registry metadata for logging/debugging.
 */
export class ViewNavigator {
  private readonly _setView: (_view: View) => void;
  private readonly _registry?: Record<string, { title?: string; icon?: string }>;

  constructor(setView: (_view: View) => void, registry?: Record<string, { title?: string; icon?: string }>) {
    if (typeof setView !== 'function') {
      throw new Error('ViewNavigator requires a setView function');
    }
    this._setView = setView;
    this._registry = registry;
  }

  /**
   * Navigate to the specified view
   * @param view - The target view to navigate to
   */
  navigate(view: View): void {
    // Use registry metadata for development logging and analytics hooks
    const config = this._registry?.[view];
    if (import.meta.env.DEV && config) {
      console.debug(`[ViewNavigator] Navigating to: ${view} (${config.title || 'no title'})`);
    } else if (import.meta.env.DEV) {
      console.debug(`[ViewNavigator] Navigating to: ${view} (no registry config)`);
    }
    this._setView(view);
  }

  /**
   * Navigate back to the practice view
   */
  goBack(): void {
    this._setView('practice');
  }
}