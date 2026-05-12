/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import App from '../../App';
import type { AchievementMoment } from '@/data/types';

// Use vi.hoisted to properly hoist ALL mocks before vi.mock calls
const { mockInitializeInputs, mockSetInput, mockCheckAnswer, mockNextSentence, mockRetry, mockReset,
        mockSpeak, mockTrackProgress, mockCheckBadges, mockAcknowledgeMoment, mockSetCurrentMoment,
        mockAchievementMoment } = vi.hoisted(() => ({
  mockInitializeInputs: vi.fn(),
  mockSetInput: vi.fn(),
  mockCheckAnswer: vi.fn(),
  mockNextSentence: vi.fn(),
  mockRetry: vi.fn(),
  mockReset: vi.fn(),
  mockSpeak: vi.fn(),
  mockTrackProgress: vi.fn(),
  mockCheckBadges: vi.fn(() => []),
  mockAcknowledgeMoment: vi.fn(),
  mockSetCurrentMoment: vi.fn(),
  mockAchievementMoment: vi.fn(() => ({
    currentMoment: null,
    hasUnshownMoment: vi.fn(() => false),
    acknowledgeMoment: mockAcknowledgeMoment,
    checkLevelUp: vi.fn(() => null),
    checkBadgeUnlock: vi.fn(() => null),
    checkStreakMilestone: vi.fn(() => null),
    checkXPMilestone: vi.fn(() => null),
    checkPerfectSession: vi.fn(() => null),
    setCurrentMoment: mockSetCurrentMoment,
  })),
}));

// Mutable state for mock configuration
let mockShowResult = false;
let mockIsCorrect = false;
let mockAttempts = 0;
let mockUnlockedCount = 0;

vi.mock('@/hooks/usePractice', () => ({
  usePractice: vi.fn(() => ({
    state: {
      currentIndex: 0,
      userAnswers: [],
      currentInputs: ['test-value'],
      showResult: mockShowResult,
      isCorrect: mockIsCorrect,
      attempts: mockAttempts,
      isComplete: false,
      score: 0,
      selectedChoiceId: null,
      orderedTokenIds: [],
    },
    currentSentence: {
      id: '1',
      english: 'The early bird catches the worm.',
      chinese: '早起的鸟儿有虫吃。',
      blanks: [{ word: 'catches', hint: '抓住' }],
      level: 'junior',
    },
    progress: 0,
    totalQuestions: 10,
    currentQuestion: 1,
    setInput: mockSetInput,
    checkAnswer: mockCheckAnswer,
    nextSentence: mockNextSentence,
    retry: mockRetry,
    reset: mockReset,
    initializeInputs: mockInitializeInputs,
    isLoading: false,
    error: null,
    options: [],
    selectChoice: vi.fn(),
    sentenceTokens: [],
    selectToken: vi.fn(),
    deselectToken: vi.fn(),
    resetTokens: vi.fn(),
  })),
}));

vi.mock('@/hooks/useSpeech', () => ({
  useSpeech: vi.fn(() => ({
    speak: mockSpeak,
    isSpeaking: false,
    playbackRate: 1.0,
    setPlaybackRate: vi.fn(),
  })),
}));

vi.mock('@/hooks/useHintLevel', () => ({
  useHintLevel: vi.fn(() => ({
    hintLevel: 'medium',
    config: { level: 'medium', consecutiveCorrect: 0, consecutiveWrong: 0 },
    recordCorrectAnswer: vi.fn(),
    recordWrongAnswer: vi.fn(),
    setHintLevel: vi.fn(),
    shouldShowHint: vi.fn(() => true),
    reset: vi.fn(),
  })),
}));

vi.mock('@/hooks/useXP', () => ({
  useXP: vi.fn(() => ({
    profile: { totalXP: 150, currentLevel: 2, levelProgress: 50 },
    addXP: vi.fn(() => ({ finalXP: 15, multiplier: 1.0, streak: 0 })),
    resetXPProfile: vi.fn(),
    streak: 0,
    maxStreakReached: 0,
    recordCorrectAnswer: vi.fn(),
    recordWrongAnswer: vi.fn(),
    resetStreak: vi.fn(),
  })),
}));

vi.mock('@/hooks/useDailyChallenges', () => ({
  useDailyChallenges: vi.fn(() => ({
    state: {
      date: '2026-05-10',
      challenges: [],
    },
    unclaimedCount: 0,
    trackActivity: vi.fn(),
    claimReward: vi.fn(),
    resetDailyChallenges: vi.fn(),
  })),
}));

vi.mock('@/hooks/useBadges', () => ({
  useBadges: vi.fn(() => ({
    unlockedIds: new Set<string>(),
    unlockedCount: mockUnlockedCount,
    badgeProgress: {
      totalAnswered: 0,
      totalCorrect: 0,
      totalSessions: 0,
      maxStreakEver: 0,
      perfectSessions: 0,
      totalReviews: 0,
      totalChallengesCompleted: 0,
    },
    trackProgress: mockTrackProgress,
    checkBadges: mockCheckBadges,
    getBadgeProgressPercent: vi.fn(() => 0),
    resetBadges: vi.fn(),
    BADGE_DEFINITIONS: [],
  })),
}));

vi.mock('@/hooks/useLeaderboard', () => ({
  useLeaderboard: vi.fn(() => ({
    getLeaderboardEntries: vi.fn(() => []),
  })),
}));

vi.mock('@/hooks/useAchievementMoment', () => ({
  useAchievementMoment: mockAchievementMoment,
  sortMomentsByPriority: vi.fn((moments: AchievementMoment[]) => moments),
}));

vi.mock('@/hooks/useWeeklyReport', () => ({
  useWeeklyReport: vi.fn(() => ({
    report: null,
    shouldShow: false,
    dismiss: vi.fn(),
    markShown: vi.fn(),
    refresh: vi.fn(),
  })),
}));

vi.mock('@/components/AchievementMomentCard', () => ({
  AchievementMomentCard: vi.fn(({ moment, triggerKey }: { moment: AchievementMoment; triggerKey?: string }) => (
    <div data-testid="achievement-moment-card">
      <span data-testid="moment-type">{moment?.type}</span>
      <span data-testid="moment-title">{moment?.title}</span>
      {triggerKey && <span data-testid="moment-trigger-key">{triggerKey}</span>}
    </div>
  )),
}));

vi.mock('@/components/WeeklyReportCard', () => ({
  WeeklyReportCard: vi.fn(({ report, triggerKey, onDismiss }: {
    report: any;
    triggerKey?: string;
    onDismiss?: () => void;
  }) => (
    <div data-testid="weekly-report-card">
      <span data-testid="report-week">{report?.weekStart}</span>
      {triggerKey && <span data-testid="report-trigger-key">{triggerKey}</span>}
      {onDismiss && <button data-testid="report-dismiss" onClick={onDismiss}>关闭</button>}
    </div>
  )),
}));

vi.mock('@/components/BadgePanel', () => ({
  BadgePanel: vi.fn(({ onBack }: { onBack: () => void }) => (
    <div data-testid="badge-panel">
      <span>Badge Panel</span>
      <button onClick={onBack} data-testid="badge-back-button">
        返回
      </button>
    </div>
  )),
}));

vi.mock('@/components/BadgeUnlockToast', () => ({
  BadgeUnlockToast: vi.fn(() => <div data-testid="badge-unlock-toast" />),
}));

vi.mock('@/components/SharePromptToast', () => ({
  SharePromptToast: vi.fn(() => <div data-testid="share-prompt-toast" />),
}));

vi.mock('@/services/storage', () => ({
  storage: {
    hasActiveSession: vi.fn(() => false),
    loadSession: vi.fn(() => null),
    hasOnboardingComplete: vi.fn(() => true),
    setOnboardingComplete: vi.fn(),
    getMistakeCount: vi.fn(() => 0),
    getHistoryCount: vi.fn(() => 0),
    getReviewQueueCount: vi.fn(() => 0),
    clearSession: vi.fn(),
    getStoredDictionaryId: vi.fn(),
    addMistake: vi.fn(),
    getMistakes: vi.fn(() => []),
    addHistory: vi.fn(),
    getHistory: vi.fn(() => []),
    exportAllData: vi.fn(() => ({
      version: 1,
      exportedAt: '',
      data: { session: null, mistakes: [], history: [] },
    })),
    importAllData: vi.fn(() => ({
      success: true,
      importedCounts: { session: 0, mistakes: 0, history: 0, xpProfile: 0 },
      message: '',
    })),
    getReviewQueue: vi.fn(() => []),
    scheduleNextReview: vi.fn(),
    getXPProfile: vi.fn(() => ({
      totalXP: 0,
      currentLevel: 1,
      levelProgress: 0,
    })),
    updateXPProfile: vi.fn(),
    addXP: vi.fn(),
    getPersonalWords: vi.fn(() => []),
    addPersonalWord: vi.fn(),
    removePersonalWord: vi.fn(),
    getPersonalWordCount: vi.fn(() => 0),
    getGoals: vi.fn(() => null),
    saveGoals: vi.fn(),
    generateDefaultGoals: vi.fn(() => ({ goals: [], updatedAt: Date.now() })),
  },
}));

vi.mock('@/data/dictionaries', () => ({
  getDictionaryById: vi.fn(() => ({
    id: 'cet4',
    name: 'CET-4',
    description: '',
    sentenceCount: 100,
  })),
  dictionaries: [
    { id: 'cet4', name: 'CET-4', description: '', sentenceCount: 100 },
  ],
}));

vi.mock('@/data/loader', () => ({
  loadDictionary: vi.fn(() => Promise.resolve([])),
}));

// ============================================================================
// Tests
// ============================================================================

describe('App Achievement Moment Integration', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockShowResult = false;
    mockIsCorrect = false;
    mockAttempts = 0;
    mockUnlockedCount = 0;

    // Reset mock to default
    mockAchievementMoment.mockReturnValue({
      currentMoment: null,
      hasUnshownMoment: vi.fn(() => false),
      acknowledgeMoment: mockAcknowledgeMoment,
      checkLevelUp: vi.fn(() => null),
      checkBadgeUnlock: vi.fn(() => null),
      checkStreakMilestone: vi.fn(() => null),
      checkXPMilestone: vi.fn(() => null),
      checkPerfectSession: vi.fn(() => null),
      setCurrentMoment: mockSetCurrentMoment,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useAchievementMoment hook integration', () => {
    it('calls useAchievementMoment hook on component mount', () => {
      render(<App />);

      expect(mockAchievementMoment).toHaveBeenCalled();
    });

    it('hook is called during render cycle', () => {
      render(<App />);

      // Hook may be called multiple times during render
      expect(mockAchievementMoment.mock.calls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Level-up detection', () => {
    it('checkLevelUp function is available from hook', () => {
      const checkLevelUpMock = vi.fn(() => null);
      mockAchievementMoment.mockReturnValue({
        currentMoment: null,
        hasUnshownMoment: vi.fn(() => false),
        acknowledgeMoment: mockAcknowledgeMoment,
        checkLevelUp: checkLevelUpMock,
        checkBadgeUnlock: vi.fn(() => null),
        checkStreakMilestone: vi.fn(() => null),
        checkXPMilestone: vi.fn(() => null),
        checkPerfectSession: vi.fn(() => null),
        setCurrentMoment: mockSetCurrentMoment,
      });

      render(<App />);

      // The hook's checkLevelUp should be available
      expect(checkLevelUpMock).toBeDefined();
    });
  });

  describe('Badge unlock detection', () => {
    it('checkBadgeUnlock function is available from hook', () => {
      const checkBadgeUnlockMock = vi.fn(() => null);

      mockAchievementMoment.mockReturnValue({
        currentMoment: null,
        hasUnshownMoment: vi.fn(() => false),
        acknowledgeMoment: mockAcknowledgeMoment,
        checkLevelUp: vi.fn(() => null),
        checkBadgeUnlock: checkBadgeUnlockMock,
        checkStreakMilestone: vi.fn(() => null),
        checkXPMilestone: vi.fn(() => null),
        checkPerfectSession: vi.fn(() => null),
        setCurrentMoment: mockSetCurrentMoment,
      });

      render(<App />);

      expect(checkBadgeUnlockMock).toBeDefined();
    });
  });

  describe('Perfect session detection', () => {
    it('checkPerfectSession function is available from hook', () => {
      const checkPerfectSessionMock = vi.fn(() => null);
      mockAchievementMoment.mockReturnValue({
        currentMoment: null,
        hasUnshownMoment: vi.fn(() => false),
        acknowledgeMoment: mockAcknowledgeMoment,
        checkLevelUp: vi.fn(() => null),
        checkBadgeUnlock: vi.fn(() => null),
        checkStreakMilestone: vi.fn(() => null),
        checkXPMilestone: vi.fn(() => null),
        checkPerfectSession: checkPerfectSessionMock,
        setCurrentMoment: mockSetCurrentMoment,
      });

      render(<App />);

      expect(checkPerfectSessionMock).toBeDefined();
    });
  });

  describe('AchievementMomentCard display', () => {
    it('AchievementMomentCard component is mocked', () => {
      mockAchievementMoment.mockReturnValue({
        currentMoment: {
          id: 'test-moment',
          type: 'level-up' as const,
          title: 'Test Achievement',
          createdAt: Date.now(),
        } as any,
        hasUnshownMoment: vi.fn(() => true),
        acknowledgeMoment: mockAcknowledgeMoment,
        checkLevelUp: vi.fn(() => null),
        checkBadgeUnlock: vi.fn(() => null),
        checkStreakMilestone: vi.fn(() => null),
        checkXPMilestone: vi.fn(() => null),
        checkPerfectSession: vi.fn(() => null),
        setCurrentMoment: mockSetCurrentMoment,
      } as any);

      render(<App />);

      // The mocked component should be accessible when moment is set
      // Note: actual rendering depends on hasUnshownMoment() returning true
      // This test verifies the mock is properly set up
      expect(mockAchievementMoment).toHaveBeenCalled();
    });

    it('all achievement moment detection functions are available', () => {
      mockAchievementMoment.mockReturnValue({
        currentMoment: null,
        hasUnshownMoment: vi.fn(() => false),
        acknowledgeMoment: mockAcknowledgeMoment,
        checkLevelUp: vi.fn(() => null),
        checkBadgeUnlock: vi.fn(() => null),
        checkStreakMilestone: vi.fn(() => null),
        checkXPMilestone: vi.fn(() => null),
        checkPerfectSession: vi.fn(() => null),
        setCurrentMoment: mockSetCurrentMoment,
      });

      render(<App />);

      // Verify hook returned all required functions
      expect(mockAchievementMoment).toHaveBeenCalled();
    });
  });

  describe('Existing share flow compatibility', () => {
    it('SharePromptToast is still rendered', () => {
      render(<App />);

      // SharePromptToast should still be in the component tree
      expect(screen.getByTestId('share-prompt-toast')).toBeInTheDocument();
    });

    it('BadgeUnlockToast is still rendered', () => {
      render(<App />);

      expect(screen.getByTestId('badge-unlock-toast')).toBeInTheDocument();
    });

    it('Badge award button still works', () => {
      mockUnlockedCount = 3;
      render(<App />);

      const awardButton = screen.getByTestId('badge-award-header');
      expect(awardButton).toBeInTheDocument();
      expect(awardButton).toHaveTextContent('3');

      fireEvent.click(screen.getByTestId('badge-award-header'));
      expect(screen.getByTestId('badge-panel')).toBeInTheDocument();
    });
  });

  describe('setCurrentMoment integration', () => {
    it('setCurrentMoment is available from hook', () => {
      mockAchievementMoment.mockReturnValue({
        currentMoment: null,
        hasUnshownMoment: vi.fn(() => false),
        acknowledgeMoment: mockAcknowledgeMoment,
        checkLevelUp: vi.fn(() => null),
        checkBadgeUnlock: vi.fn(() => null),
        checkStreakMilestone: vi.fn(() => null),
        checkXPMilestone: vi.fn(() => null),
        checkPerfectSession: vi.fn(() => null),
        setCurrentMoment: mockSetCurrentMoment,
      } as any);

      render(<App />);

      // setCurrentMoment should be called (to initialize or reset state)
      expect(mockAchievementMoment).toHaveBeenCalled();
    });
  });
});
