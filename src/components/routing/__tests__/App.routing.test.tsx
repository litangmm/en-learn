import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { ViewRegistryProvider, useViewRegistry } from '@/components/routing/useViewRegistry';
import type { ViewConfig, View } from '@/components/routing';
import { VIEW_CONFIGS } from '@/components/routing/viewConfigs';

// =============================================================================
// Test helper utilities
// =============================================================================

/**
 * Type-safe view ID cast for testing with non-production view IDs.
 * Only use in tests - production code should use actual View union members.
 */
function toTestView(id: string): View {
  return id as View;
}

// =============================================================================
// Mock dependencies - must be at module top level
// =============================================================================

// Mock storage service
vi.mock('@/services/storage', () => ({
  storage: {
    getMistakeCount: vi.fn(() => 5),
    getHistoryCount: vi.fn(() => 10),
    getReviewQueueCount: vi.fn(() => 3),
    getHistory: vi.fn(() => []),
    scheduleNextReview: vi.fn(),
    clearSession: vi.fn(() => ({})),
    hasActiveSession: vi.fn(() => false),
    getStoredDictionaryId: vi.fn(() => 'cet4'),
  },
}));

// Mock components that ViewRouter renders
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
vi.mock('@/components/WeaknessPanel', () => ({
  WeaknessPanel: vi.fn(() => <div data-testid="weakness-panel">WeaknessPanel</div>),
}));
vi.mock('@/components/LearningEfficiencyPanel', () => ({
  LearningEfficiencyPanel: vi.fn(() => <div data-testid="learning-efficiency-panel">LearningEfficiencyPanel</div>),
}));
vi.mock('@/components/InviteFriendsPanel', () => ({
  InviteFriendsPanel: vi.fn(() => <div data-testid="invite-friends-panel">InviteFriendsPanel</div>),
}));
vi.mock('@/components/GoalSettingPanel', () => ({
  GoalSettingPanel: vi.fn(() => <div data-testid="goal-setting-panel">GoalSettingPanel</div>),
}));
vi.mock('@/components/ChurnWarningDashboard', () => ({
  ChurnWarningDashboard: vi.fn(() => <div data-testid="churn-warning-dashboard">ChurnWarningDashboard</div>),
}));
vi.mock('@/components/LearnInsightPanel', () => ({
  LearnInsightPanel: vi.fn(() => <div data-testid="learn-insight-panel">LearnInsightPanel</div>),
}));
vi.mock('@/components/LearnInsightDashboard', () => ({
  LearnInsightDashboard: vi.fn(() => <div data-testid="learn-insight-dashboard">LearnInsightDashboard</div>),
}));
vi.mock('@/components/LearningReportPanel', () => ({
  LearningReportPanel: vi.fn(() => <div data-testid="learning-report-panel">LearningReportPanel</div>),
}));
vi.mock('@/components/DictionaryBrowser', () => ({
  DictionaryBrowser: vi.fn(() => <div data-testid="dictionary-browser">DictionaryBrowser</div>),
}));

// Mock hooks
vi.mock('@/hooks/usePractice', () => ({
  usePractice: vi.fn(() => ({
    state: {
      currentInputs: [],
      showResult: false,
      isCorrect: false,
      isComplete: false,
      attempts: 0,
      score: 0,
      selectedChoiceId: null,
      orderedTokenIds: [],
    },
    currentSentence: null,
    progress: 0,
    totalQuestions: 0,
    currentQuestion: 0,
    options: [],
    sentenceTokens: [],
    setInput: vi.fn(),
    checkAnswer: vi.fn(),
    nextSentence: vi.fn(),
    retry: vi.fn(),
    reset: vi.fn(),
    initializeInputs: vi.fn(),
    isLoading: false,
    error: null,
    selectChoice: vi.fn(),
    selectToken: vi.fn(),
    deselectToken: vi.fn(),
    resetTokens: vi.fn(),
  })),
}));

vi.mock('@/hooks/useSpeech', () => ({
  useSpeech: vi.fn(() => ({
    speak: vi.fn(),
    isSpeaking: false,
    playbackRate: 1,
    setPlaybackRate: vi.fn(),
  })),
}));

vi.mock('@/hooks/useXP', () => ({
  useXP: vi.fn(() => ({
    profile: { currentLevel: 1, levelProgress: 0.5, totalXP: 100 },
    addXP: vi.fn(() => ({ finalXP: 10, multiplier: 1, leveledUp: false, newLevel: 1 })),
    streak: 0,
    recordCorrectAnswer: vi.fn(),
    recordWrongAnswer: vi.fn(),
    resetStreak: vi.fn(),
  })),
}));

vi.mock('@/hooks/useFlowState', () => ({
  useFlowState: vi.fn(() => ({
    flowState: 'normal',
    fatigueSignals: [],
    recordCorrect: vi.fn(),
    recordWrong: vi.fn(),
    reset: vi.fn(),
  })),
}));

vi.mock('@/hooks/useDailyChallenges', () => ({
  useDailyChallenges: vi.fn(() => ({
    state: { challenges: [] },
    unclaimedCount: 0,
    trackActivity: vi.fn(),
    claimReward: vi.fn(),
  })),
}));

vi.mock('@/hooks/useBadges', () => ({
  useBadges: vi.fn(() => ({
    unlockedIds: [],
    unlockedCount: 0,
    trackProgress: vi.fn(),
    checkBadges: vi.fn(() => []),
    getBadgeProgressPercent: vi.fn(() => 0),
  })),
}));

vi.mock('@/hooks/useLeaderboard', () => ({
  useLeaderboard: vi.fn(() => ({
    getLeaderboardEntries: vi.fn(() => []),
  })),
}));

vi.mock('@/hooks/useWeaknessStats', () => ({
  useWeaknessStats: vi.fn(() => ({
    stats: { totalWeakCount: 0 },
  })),
}));

vi.mock('@/hooks/useSpacedRepetition', () => ({
  useSpacedRepetition: vi.fn(() => ({
    dueCount: 0,
  })),
}));

vi.mock('@/hooks/useReviewStreak', () => ({
  useReviewStreak: vi.fn(() => ({
    data: { currentStreak: 0, lastReviewDate: null },
  })),
}));

vi.mock('@/hooks/useRecallReminder', () => ({
  useRecallReminder: vi.fn(() => ({
    status: 'idle',
    dueCount: 0,
    dismiss: vi.fn(),
  })),
}));

vi.mock('@/hooks/useHintLevel', () => ({
  useHintLevel: vi.fn(() => ({
    hintLevel: 0,
    shouldShowHint: false,
  })),
}));

vi.mock('@/hooks/useGoals', () => ({
  useGoals: vi.fn(() => ({
    state: { goals: [] },
    updateGoals: vi.fn(),
    trackProgressRef: { current: vi.fn() },
    dailyGoals: [],
    weeklyGoals: [],
  })),
}));

vi.mock('@/hooks/usePersonalWords', () => ({
  usePersonalWords: vi.fn(() => ({
    isMarked: vi.fn(() => false),
    markFromPractice: vi.fn(),
  })),
}));

vi.mock('@/hooks/useAchievementMoment', () => ({
  useAchievementMoment: vi.fn(() => ({
    acknowledgeMoment: vi.fn(),
    checkLevelUp: vi.fn(),
    checkBadgeUnlock: vi.fn(),
    checkStreakMilestone: vi.fn(),
    checkXPMilestone: vi.fn(),
    checkPerfectSession: vi.fn(),
  })),
}));

vi.mock('@/hooks/useWeeklyReport', () => ({
  useWeeklyReport: vi.fn(() => ({
    report: null,
    shouldShow: false,
    dismiss: vi.fn(),
    markShown: vi.fn(),
  })),
}));

vi.mock('@/hooks/useChurnSignals', () => ({
  useChurnSignals: vi.fn(() => ({
    riskLevel: 'low',
    signals: [],
    topRiskFactors: [],
  })),
}));

vi.mock('@/hooks/useChurnIntervention', () => ({
  useChurnIntervention: vi.fn(() => ({
    intervention: null,
    shouldShowPanel: false,
    shouldShowBanner: false,
    snooze: vi.fn(),
  })),
}));

vi.mock('@/hooks/useGoalCompletionNotifier', () => ({
  useGoalCompletionNotifier: vi.fn(() => ({
    completedGoal: null,
    triggerKey: 0,
    dismiss: vi.fn(),
  })),
}));

// Mock UI components
vi.mock('@/components/ui/sonner', () => ({
  Toaster: vi.fn(() => <div data-testid="toaster">Toaster</div>),
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  AnimatePresence: vi.fn(({ children }) => children),
}));

// =============================================================================
// Test configuration
// =============================================================================

// =============================================================================
// Test components
// =============================================================================

/** Displays registry size for testing */
function RegistrySizeDisplay() {
  const { registry } = useViewRegistry();
  return <span data-testid="registry-size">{Object.keys(registry).length}</span>;
}

/** Displays a specific view's config title */
function ViewConfigDisplay({ viewId }: { viewId: string }) {
  const { getViewConfig } = useViewRegistry();
  const config = getViewConfig(viewId);
  return <span data-testid={`config-title-${viewId}`}>{config?.title || 'NOT_FOUND'}</span>;
}

/** Displays if a view is registered */
function ViewRegistrationStatus({ viewId }: { viewId: string }) {
  const { isViewRegistered } = useViewRegistry();
  return <span data-testid={`is-registered-${viewId}`}>{String(isViewRegistered(viewId))}</span>;
}

// =============================================================================
// Tests
// =============================================================================

describe('App Routing with Registry Pattern', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('VIEW_CONFIGS Initialization', () => {
    it('should have 19 view configs defined', () => {
      expect(VIEW_CONFIGS).toHaveLength(19);
    });

    it('should include all required view IDs', () => {
      const expectedIds = [
        'practice', 'progress', 'profile', 'efficiency', 'mistake-book',
        'history', 'data', 'review', 'weakness', 'challenges',
        'badges', 'leaderboard', 'invite', 'dictionary-browser', 'goals',
        'churn-dashboard', 'learn-insight', 'learn-insight-dashboard', 'learning-report'
      ];

      const actualIds = VIEW_CONFIGS.map(c => c.id);
      expectedIds.forEach(id => {
        expect(actualIds).toContain(id);
      });
    });

    it('should have practice view marked as primary', () => {
      const practiceConfig = VIEW_CONFIGS.find(c => c.id === 'practice');
      expect(practiceConfig?.metadata?.primary).toBe(true);
    });

    it('should have all views with proper titles', () => {
      VIEW_CONFIGS.forEach(config => {
        expect(config.title).toBeTruthy();
        expect(typeof config.title).toBe('string');
        expect(config.title.length).toBeGreaterThan(0);
      });
    });

    it('should have all views with icon identifiers', () => {
      VIEW_CONFIGS.forEach(config => {
        expect(config.icon).toBeTruthy();
        expect(typeof config.icon).toBe('string');
      });
    });
  });

  describe('ViewRegistryProvider Integration', () => {
    it('should register all VIEW_CONFIGS when used as initialConfigs', () => {
      render(
        <ViewRegistryProvider initialConfigs={VIEW_CONFIGS}>
          <RegistrySizeDisplay />
        </ViewRegistryProvider>
      );

      expect(screen.getByTestId('registry-size')).toHaveTextContent('19');
    });

    it('should make view configs accessible via getViewConfig', () => {
      render(
        <ViewRegistryProvider initialConfigs={VIEW_CONFIGS}>
          <ViewConfigDisplay viewId="practice" />
        </ViewRegistryProvider>
      );

      expect(screen.getByTestId('config-title-practice')).toHaveTextContent('练习');
    });

    it('should make view configs accessible for complex views', () => {
      render(
        <ViewRegistryProvider initialConfigs={VIEW_CONFIGS}>
          <ViewConfigDisplay viewId="mistake-book" />
        </ViewRegistryProvider>
      );

      expect(screen.getByTestId('config-title-mistake-book')).toHaveTextContent('错题本');
    });

    it('should report correct registration status for registered views', () => {
      render(
        <ViewRegistryProvider initialConfigs={VIEW_CONFIGS}>
          <ViewRegistrationStatus viewId="practice" />
          <ViewRegistrationStatus viewId="review" />
          <ViewRegistrationStatus viewId="challenges" />
        </ViewRegistryProvider>
      );

      expect(screen.getByTestId('is-registered-practice')).toHaveTextContent('true');
      expect(screen.getByTestId('is-registered-review')).toHaveTextContent('true');
      expect(screen.getByTestId('is-registered-challenges')).toHaveTextContent('true');
    });

    it('should report correct registration status for non-existent views', () => {
      render(
        <ViewRegistryProvider initialConfigs={VIEW_CONFIGS}>
          <ViewRegistrationStatus viewId="non-existent-view" />
        </ViewRegistryProvider>
      );

      expect(screen.getByTestId('is-registered-non-existent-view')).toHaveTextContent('false');
    });

    it('should allow dynamic registration of additional views', () => {
      function DynamicRegistrationComponent() {
        const { registry, registerView } = useViewRegistry();

        return (
          <div>
            <button
              data-testid="register-extra"
              onClick={() => registerView({ id: toTestView('extra'), title: '额外视图', icon: 'extra' })}
            >
              Register Extra
            </button>
            <span data-testid="registry-size">{Object.keys(registry).length}</span>
          </div>
        );
      }

      render(
        <ViewRegistryProvider initialConfigs={VIEW_CONFIGS}>
          <DynamicRegistrationComponent />
        </ViewRegistryProvider>
      );

      // Initial count
      expect(screen.getByTestId('registry-size')).toHaveTextContent('19');

      // Add one more
      act(() => {
        screen.getByTestId('register-extra').click();
      });

      expect(screen.getByTestId('registry-size')).toHaveTextContent('20');
    });
  });

  describe('Navigation with Registry Metadata', () => {
    it('should have metadata for primary views', () => {
      const practiceConfig = VIEW_CONFIGS.find(c => c.id === 'practice');
      expect(practiceConfig).toBeDefined();
      expect(practiceConfig?.metadata).toBeDefined();
    });

    it('should have views with standardized metadata', () => {
      const progressConfig = VIEW_CONFIGS.find(c => c.id === 'progress');
      expect(progressConfig?.metadata).toBeDefined();
      // All views now have requiresAuth metadata
      expect(progressConfig?.metadata?.requiresAuth).toBe(false);
    });

    it('should provide registry access through NavigationProvider pattern', () => {
      function NavigationProviderTest() {
        const { registry } = useViewRegistry();
        const practiceConfig = registry['practice'];

        return (
          <div>
            <span data-testid="practice-title">{practiceConfig?.title || 'NOT_FOUND'}</span>
            <span data-testid="practice-icon">{practiceConfig?.icon || 'NOT_FOUND'}</span>
          </div>
        );
      }

      render(
        <ViewRegistryProvider initialConfigs={VIEW_CONFIGS}>
          <NavigationProviderTest />
        </ViewRegistryProvider>
      );

      expect(screen.getByTestId('practice-title')).toHaveTextContent('练习');
      expect(screen.getByTestId('practice-icon')).toHaveTextContent('practice');
    });
  });

  describe('Complex Handlers Preservation', () => {
    it('should have all complex handler views in VIEW_CONFIGS', () => {
      const complexViews = ['mistake-book', 'history', 'review', 'challenges', 'learning-report'];

      complexViews.forEach(viewId => {
        const config = VIEW_CONFIGS.find(c => c.id === viewId);
        expect(config).toBeDefined();
        expect(config?.title).toBeTruthy();
        expect(config?.icon).toBeTruthy();
      });
    });

    it('should have all simple handler views in VIEW_CONFIGS', () => {
      const simpleViews = [
        'practice', 'progress', 'profile', 'efficiency', 'data',
        'weakness', 'badges', 'leaderboard', 'invite',
        'dictionary-browser', 'goals', 'churn-dashboard',
        'learn-insight', 'learn-insight-dashboard'
      ];

      simpleViews.forEach(viewId => {
        const config = VIEW_CONFIGS.find(c => c.id === viewId);
        expect(config).toBeDefined();
        expect(config?.title).toBeTruthy();
      });
    });

    it('should have unique IDs across all VIEW_CONFIGS', () => {
      const ids = VIEW_CONFIGS.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have no duplicate titles', () => {
      const titles = VIEW_CONFIGS.map(c => c.title);
      const uniqueTitles = new Set(titles);
      expect(uniqueTitles.size).toBe(titles.length);
    });
  });

  describe('Registry Provider Nested Scenarios', () => {
    it('should allow nested registry providers with independent state', () => {
      function NestedDisplay({ label }: { label: string }) {
        const { registry } = useViewRegistry();
        return (
          <span data-testid={`nested-${label}`}>{Object.keys(registry).length}</span>
        );
      }

      render(
        <ViewRegistryProvider initialConfigs={VIEW_CONFIGS.slice(0, 5)}>
          <NestedDisplay label="outer" />
          <ViewRegistryProvider initialConfigs={VIEW_CONFIGS.slice(5, 10)}>
            <NestedDisplay label="inner" />
          </ViewRegistryProvider>
        </ViewRegistryProvider>
      );

      // Outer has 5 views, inner has 5 views (total 10 from sliced VIEW_CONFIGS)
      expect(screen.getByTestId('nested-outer')).toHaveTextContent('5');
      expect(screen.getByTestId('nested-inner')).toHaveTextContent('5');
    });

    it('should provide empty registry when no configs provided', () => {
      render(
        <ViewRegistryProvider>
          <RegistrySizeDisplay />
        </ViewRegistryProvider>
      );

      expect(screen.getByTestId('registry-size')).toHaveTextContent('0');
    });

    it('should handle empty configs array', () => {
      render(
        <ViewRegistryProvider initialConfigs={[]}>
          <RegistrySizeDisplay />
        </ViewRegistryProvider>
      );

      expect(screen.getByTestId('registry-size')).toHaveTextContent('0');
    });
  });

  describe('View Registry Edge Cases', () => {
    it('should handle config with only required fields', () => {
      function MinimalConfigTest() {
        const { registerView, getViewConfig } = useViewRegistry();

        return (
          <div>
            <button
              data-testid="register-minimal"
              onClick={() => registerView({ id: toTestView('minimal'), title: 'Minimal' } as ViewConfig)}
            >
              Register Minimal
            </button>
            <span data-testid="minimal-title">{getViewConfig('minimal')?.title || 'NOT_FOUND'}</span>
          </div>
        );
      }

      render(
        <ViewRegistryProvider>
          <MinimalConfigTest />
        </ViewRegistryProvider>
      );

      act(() => {
        screen.getByTestId('register-minimal').click();
      });

      expect(screen.getByTestId('minimal-title')).toHaveTextContent('Minimal');
    });

    it('should handle config with full metadata', () => {
      function FullMetadataTest() {
        const { registerView, getViewConfig } = useViewRegistry();

        return (
          <div>
            <button
              data-testid="register-full"
              onClick={() =>
                registerView({
                  id: toTestView('full'),
                  title: 'Full Config',
                  i18n: 'nav.full',
                  icon: 'full-icon',
                  a11yRole: 'button',
                  metadata: { priority: 1, requiresAuth: true },
                })
              }
            >
              Register Full
            </button>
            <span data-testid="full-i18n">{getViewConfig('full')?.i18n || 'NOT_FOUND'}</span>
            <span data-testid="full-a11y">{getViewConfig('full')?.a11yRole || 'NOT_FOUND'}</span>
            <span data-testid="full-priority">{String(getViewConfig('full')?.metadata?.priority || 'NOT_FOUND')}</span>
          </div>
        );
      }

      render(
        <ViewRegistryProvider>
          <FullMetadataTest />
        </ViewRegistryProvider>
      );

      act(() => {
        screen.getByTestId('register-full').click();
      });

      expect(screen.getByTestId('full-i18n')).toHaveTextContent('nav.full');
      expect(screen.getByTestId('full-a11y')).toHaveTextContent('button');
      expect(screen.getByTestId('full-priority')).toHaveTextContent('1');
    });

    it('should allow unregistering views', () => {
      function UnregisterTest() {
        const { registry, registerView, unregisterView } = useViewRegistry();

        return (
          <div>
            <button
              data-testid="register-temp"
              onClick={() => registerView({ id: toTestView('temp'), title: 'Temp' })}
            >
              Register
            </button>
            <button
              data-testid="unregister-temp"
              onClick={() => unregisterView('temp')}
            >
              Unregister
            </button>
            <span data-testid="registry-size">{Object.keys(registry).length}</span>
          </div>
        );
      }

      render(
        <ViewRegistryProvider initialConfigs={VIEW_CONFIGS.slice(0, 3)}>
          <UnregisterTest />
        </ViewRegistryProvider>
      );

      // Initial: 3 configs
      expect(screen.getByTestId('registry-size')).toHaveTextContent('3');

      // Add temp view
      act(() => {
        screen.getByTestId('register-temp').click();
      });
      expect(screen.getByTestId('registry-size')).toHaveTextContent('4');

      // Remove temp view
      act(() => {
        screen.getByTestId('unregister-temp').click();
      });
      expect(screen.getByTestId('registry-size')).toHaveTextContent('3');
    });
  });
});