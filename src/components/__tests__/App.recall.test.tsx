import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import App from '../../App';

vi.mock('@/hooks/useChurnSignals', () => ({
  useChurnSignals: vi.fn(() => ({
    riskLevel: 'low',
    topRiskFactors: [],
  })),
}));

// --- Mock useRecallReminder ---
let mockRecallStatus: 'idle' | 'due-soon' | 'due-now' | 'streak-at-risk' = 'idle';
let mockRecallDueCount = 0;
let mockDismiss = vi.fn();

vi.mock('@/hooks/useRecallReminder', () => ({
  useRecallReminder: vi.fn(() => ({
    status: mockRecallStatus,
    dueCount: mockRecallDueCount,
    lastDismissed: null,
    dismiss: mockDismiss,
    canShow: true,
  })),
}));

// --- Mock framer-motion globally ---
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// --- Mock usePractice ---
vi.mock('@/hooks/usePractice', () => ({
  usePractice: vi.fn(() => ({
    state: {
      currentIndex: 0,
      userAnswers: [],
      currentInputs: ['test'],
      showResult: false,
      isCorrect: false,
      attempts: 0,
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
    setInput: vi.fn(),
    checkAnswer: vi.fn(),
    nextSentence: vi.fn(),
    retry: vi.fn(),
    reset: vi.fn(),
    initializeInputs: vi.fn(),
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
    speak: vi.fn(),
    isSpeaking: false,
    playbackRate: 1.0,
    setPlaybackRate: vi.fn(),
  })),
}));

vi.mock('@/hooks/useHintLevel', () => ({
  useHintLevel: vi.fn(() => ({
    hintLevel: 'medium',
    shouldShowHint: vi.fn(() => false),
    recordCorrectAnswer: vi.fn(),
    recordWrongAnswer: vi.fn(),
    setHintLevel: vi.fn(),
    reset: vi.fn(),
    config: { level: 'medium', consecutiveCorrect: 0, consecutiveWrong: 0 },
  })),
}));

vi.mock('@/hooks/useXP', () => ({
  useXP: vi.fn(() => ({
    profile: { totalXP: 150, currentLevel: 2, levelProgress: 50 },
    addXP: vi.fn(() => ({ finalXP: 15, multiplier: 1.5, streak: 3, leveledUp: false, newLevel: 2 })),
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
    state: { date: '2026-05-12', challenges: [] },
    unclaimedCount: 0,
    trackActivity: vi.fn(),
    claimReward: vi.fn(),
    resetDailyChallenges: vi.fn(),
  })),
}));

vi.mock('@/hooks/useBadges', () => ({
  useBadges: vi.fn(() => ({
    unlockedIds: new Set(),
    unlockedCount: 0,
    badgeProgress: {
      totalAnswered: 0,
      totalCorrect: 0,
      totalSessions: 0,
      maxStreakEver: 0,
      perfectSessions: 0,
      totalReviews: 0,
      totalChallengesCompleted: 0,
    },
    trackProgress: vi.fn(),
    checkBadges: vi.fn(() => []),
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

vi.mock('@/hooks/useWeaknessStats', () => ({
  useWeaknessStats: vi.fn(() => ({
    stats: { weakWords: [], totalWeakCount: 0, weakByMode: { fillInBlanks: 0, dictation: 0, multipleChoice: 0, sentenceReorder: 0 } },
  })),
}));

vi.mock('@/hooks/useSpacedRepetition', () => ({
  useSpacedRepetition: vi.fn(() => ({
    dueCount: 0,
    dueItems: [],
    refresh: vi.fn(),
    recordReviewResult: vi.fn(),
    getReviewHistory: vi.fn(() => []),
    isDue: vi.fn(() => false),
    getNextReviewDate: vi.fn(() => null),
    getMistakesByDictionary: vi.fn(() => []),
  })),
}));

vi.mock('@/hooks/useReviewStreak', () => ({
  useReviewStreak: vi.fn(() => ({
    data: {
      currentStreak: 0,
      longestStreak: 0,
      lastReviewDate: null,
      totalReviewDays: 0,
      isStreakActive: false,
    },
    recordReview: vi.fn(),
    getTodayReviewedCount: vi.fn(() => 0),
  })),
}));

vi.mock('@/hooks/usePersonalWords', () => ({
  usePersonalWords: vi.fn(() => ({
    isMarked: vi.fn(() => false),
    markFromPractice: vi.fn(),
  })),
}));

vi.mock('@/hooks/useFlowState', () => ({
  useFlowState: vi.fn(() => ({
    flowState: 'neutral',
    fatigueSignals: [],
    consecutiveErrors: 0,
    recentAccuracy: 0,
    recordCorrect: vi.fn(),
    recordWrong: vi.fn(),
    reset: vi.fn(),
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
    exportAllData: vi.fn(() => ({ version: 1, exportedAt: '', data: { session: null, mistakes: [], history: [] } })),
    importAllData: vi.fn(() => ({ success: true, importedCounts: { session: 0, mistakes: 0, history: 0, xpProfile: 0 }, message: '' })),
    getReviewQueue: vi.fn(() => []),
    scheduleNextReview: vi.fn(),
    getXPProfile: vi.fn(() => ({ totalXP: 0, currentLevel: 1, levelProgress: 0 })),
    updateXPProfile: vi.fn(),
    addXP: vi.fn(),
    getPersonalWords: vi.fn(() => []),
    addPersonalWord: vi.fn(),
    removePersonalWord: vi.fn(),
    getPersonalWordCount: vi.fn(() => 0),
    getBadges: vi.fn(() => ({ unlocked: [], progress: { totalAnswered: 0, totalCorrect: 0, totalSessions: 0, maxStreakEver: 0, perfectSessions: 0, totalReviews: 0, totalChallengesCompleted: 0 } })),
    getShareMetrics: vi.fn(() => ({ totalShareCount: 0, formatCounts: { text: 0, image: 0 }, typeCounts: {}, lastShareAt: null, firstShareAt: null })),
    getInviteMetrics: vi.fn(() => ({ inviteCode: null, invitesSent: 0, invitesAccepted: 0, rewardsEarned: 0, createdAt: null, lastSharedAt: null })),
    updateInviteMetrics: vi.fn(),
    generateInviteCode: vi.fn(() => 'TESTCODE1'),
    initInviteMetrics: vi.fn(() => ({ inviteCode: 'TESTCODE1', invitesSent: 0, invitesAccepted: 0, rewardsEarned: 0, createdAt: Date.now(), lastSharedAt: null })),
    getInviteConfig: vi.fn(() => ({ rewardXPPerInvite: 50, maxInvitesAllowed: 0 })),
    getGoals: vi.fn(() => null),
    saveGoals: vi.fn(),
    generateDefaultGoals: vi.fn(() => ({ goals: [], updatedAt: Date.now() })),
    getRecallReminderDismissed: vi.fn(() => null),
    setRecallReminderDismissed: vi.fn(),
  },
}));

vi.mock('@/data/dictionaries', () => ({
  getDictionaryById: vi.fn(() => ({ id: 'cet4', name: 'CET-4', description: '', sentenceCount: 100 })),
  dictionaries: [{ id: 'cet4', name: 'CET-4', description: '', sentenceCount: 100 }],
}));

vi.mock('@/data/loader', () => ({
  loadDictionary: vi.fn(() => Promise.resolve([])),
}));

describe('App recall integration', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Reset mocks
    mockRecallStatus = 'idle';
    mockRecallDueCount = 0;
    mockDismiss = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('does not render recall toast when status is idle', () => {
    mockRecallStatus = 'idle';
    render(<App />);
    expect(screen.queryByTestId('recall-reminder-toast')).not.toBeInTheDocument();
  });

  it('renders recall toast when status is due-now', () => {
    mockRecallStatus = 'due-now';
    mockRecallDueCount = 5;
    render(<App />);
    expect(screen.getByTestId('recall-reminder-toast')).toBeInTheDocument();
    expect(screen.getByText(/复习时间到/)).toBeInTheDocument();
    expect(screen.getByText(/复习时间到！5 道错题等待复习/)).toBeInTheDocument(); // dueCount=5
  });

  it('renders streak-at-risk toast with warning message', () => {
    mockRecallStatus = 'streak-at-risk';
    mockRecallDueCount = 2;
    render(<App />);
    expect(screen.getByTestId('recall-reminder-toast')).toBeInTheDocument();
    expect(screen.getByText(/连续学习 streak 即将中断/)).toBeInTheDocument();
  });

  it('dismisses toast when clicking the toast container', () => {
    mockRecallStatus = 'due-now';
    mockRecallDueCount = 3;
    render(<App />);

    fireEvent.click(screen.getByTestId('recall-reminder-toast'));
    expect(mockDismiss).toHaveBeenCalledTimes(1);
  });

  it('navigates to review view when "开始复习" button is clicked', () => {
    mockRecallStatus = 'due-now';
    mockRecallDueCount = 3;
    render(<App />);

    // Verify toast is visible with the button
    expect(screen.getByTestId('recall-reminder-toast')).toBeInTheDocument();

    // Click the "开始复习" button
    fireEvent.click(screen.getByRole('button', { name: '开始复习' }));

    // After clicking, the review view should be rendered
    // SmartReview component renders "智能复习" as its title
    expect(screen.getByText('智能复习')).toBeInTheDocument();
  });

  it('navigates back when back button is clicked in review view', () => {
    mockRecallStatus = 'due-now';
    mockRecallDueCount = 3;
    render(<App />);

    // Navigate to review view
    fireEvent.click(screen.getByRole('button', { name: '开始复习' }));

    // Verify review view is shown
    expect(screen.getByText('智能复习')).toBeInTheDocument();

    // Click back button
    const backButton = screen.getByTestId('smart-review-back-button'); // SmartReview back button
    fireEvent.click(backButton);

    // Toast should be visible again when returning to practice view
    expect(screen.getByTestId('recall-reminder-toast')).toBeInTheDocument();
  });
});
