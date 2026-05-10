import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act, within } from '@testing-library/react';
import App from '../../App';

const { mockHasOnboardingComplete, mockSetOnboardingComplete } = vi.hoisted(() => ({
  mockHasOnboardingComplete: vi.fn(),
  mockSetOnboardingComplete: vi.fn(),
}));

// Mock storage functions - hoisted to avoid initialization order issues
const { mockHasActiveSession, mockLoadSession, mockClearSession, mockGetStoredDictionaryId } = vi.hoisted(() => ({
  mockHasActiveSession: vi.fn(),
  mockLoadSession: vi.fn(),
  mockClearSession: vi.fn(),
  mockGetStoredDictionaryId: vi.fn(),
}));

// Use object to hold state so mock captures reference
const mockState = {
  showResult: false,
  isCorrect: false,
  attempts: 0,
};

const mockInitializeInputs = vi.fn();
const mockSetInput = vi.fn();
const mockCheckAnswer = vi.fn();
const mockNextSentence = vi.fn();
const mockRetry = vi.fn();
const mockReset = vi.fn();
const mockAddXP = vi.fn(() => ({ finalXP: 15, multiplier: 1.0, streak: 0 }));
const mockSpeak = vi.fn();

vi.mock('@/hooks/usePractice', () => ({
  usePractice: vi.fn(() => ({
    state: {
      currentIndex: 0,
      userAnswers: [],
      currentInputs: ['test-value'],
      showResult: mockState.showResult,
      isCorrect: mockState.isCorrect,
      attempts: mockState.attempts,
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
    addXP: mockAddXP,
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

vi.mock('@/services/storage', () => ({
  storage: {
    hasOnboardingComplete: mockHasOnboardingComplete,
    setOnboardingComplete: mockSetOnboardingComplete,
    hasActiveSession: mockHasActiveSession,
    getMistakeCount: vi.fn(() => 0),
    getHistoryCount: vi.fn(() => 0),
    getReviewQueueCount: vi.fn(() => 0),
    clearSession: mockClearSession,
    getStoredDictionaryId: mockGetStoredDictionaryId,
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
    loadSession: mockLoadSession,
  },
}));

vi.mock('@/data/dictionaries', () => ({
  getDictionaryById: vi.fn((id: string) => {
    const dicts: Record<string, { id: string; name: string; description: string; sentenceCount: number }> = {
      cet4: { id: 'cet4', name: 'CET-4', description: '', sentenceCount: 100 },
      cet6: { id: 'cet6', name: 'CET-6', description: '', sentenceCount: 200 },
      ielts: { id: 'ielts', name: 'IELTS', description: '', sentenceCount: 300 },
      toefl: { id: 'toefl', name: 'TOEFL', description: '', sentenceCount: 400 },
    };
    return dicts[id] || { id, name: '未知词典', description: '', sentenceCount: 0 };
  }),
  dictionaries: [
    { id: 'cet4', name: 'CET-4', description: '', sentenceCount: 100 },
    { id: 'cet6', name: 'CET-6', description: '', sentenceCount: 200 },
    { id: 'ielts', name: 'IELTS', description: '', sentenceCount: 300 },
    { id: 'toefl', name: 'TOEFL', description: '', sentenceCount: 400 },
  ],
}));

vi.mock('@/data/loader', () => ({
  loadDictionary: vi.fn(() => Promise.resolve([])),
}));

describe('App recovery dialog', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockState.showResult = false;
    mockState.isCorrect = false;
    mockState.attempts = 0;

    // Default: user has completed onboarding (no onboarding dialog shown)
    mockHasOnboardingComplete.mockReturnValue(true);

    // Use fake timers to handle setTimeout in recovery dialog effect
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const createSession = (overrides: {
    dictionaryId?: string;
    minutesAgo?: number;
    currentIndex?: number;
    userAnswersCount?: number;
  }) => {
    const now = Date.now();
    return {
      version: 2,
      dictionaryId: overrides.dictionaryId || 'cet4',
      timestamp: now - (overrides.minutesAgo || 10) * 60 * 1000,
      mistakes: [],
      session: {
        currentIndex: overrides.currentIndex || 5,
        userAnswers: Array(overrides.userAnswersCount || 4).fill(null),
        currentInputs: [],
        showResult: false,
        isCorrect: false,
        attempts: 0,
        isComplete: false,
        score: 0,
        selectedChoiceId: null,
        orderedTokenIds: [],
      },
    };
  };

  const renderAndWaitForRecovery = () => {
    const result = render(<App />);
    // Advance timers to flush the setTimeout in recovery dialog effect
    act(() => {
      vi.advanceTimersByTime(0);
    });
    return result;
  };

  it('shows recovery dialog when active session exists', () => {
    const session = createSession({
      dictionaryId: 'cet4',
      minutesAgo: 10,
      currentIndex: 5,
      userAnswersCount: 4,
    });
    mockHasActiveSession.mockReturnValue(true);
    mockLoadSession.mockReturnValue(session);

    renderAndWaitForRecovery();

    // Dialog should be visible
    expect(screen.getByText('继续上次练习？')).toBeInTheDocument();

    // Check dictionary name is displayed
    const dialog = screen.getByRole('dialog');
    const dialogContent = within(dialog);
    expect(dialogContent.getByText('CET-4')).toBeInTheDocument();

    // Check elapsed time is displayed (10 minutes ago)
    expect(dialogContent.getByText(/10分钟前/)).toBeInTheDocument();
  });

  it('shows progress in recovery dialog', () => {
    const session = createSession({
      dictionaryId: 'cet4',
      minutesAgo: 15,
      currentIndex: 10,
      userAnswersCount: 9,
    });
    mockHasActiveSession.mockReturnValue(true);
    mockLoadSession.mockReturnValue(session);

    renderAndWaitForRecovery();

    const dialog = screen.getByRole('dialog');
    const dialogContent = within(dialog);

    // Check progress is displayed
    expect(dialogContent.getByText(/已答 9\/10 题/)).toBeInTheDocument();
  });

  it('continue button restores session', () => {
    const session = createSession({
      dictionaryId: 'cet6',
      minutesAgo: 20,
      currentIndex: 3,
      userAnswersCount: 2,
    });
    mockHasActiveSession.mockReturnValue(true);
    mockLoadSession.mockReturnValue(session);
    mockGetStoredDictionaryId.mockReturnValue('cet6');

    renderAndWaitForRecovery();

    // Dialog should be visible
    expect(screen.getByText('继续上次练习？')).toBeInTheDocument();

    // Click "继续练习" button
    const continueButton = screen.getByRole('button', { name: '继续练习' });
    fireEvent.click(continueButton);

    // Dialog should be closed
    expect(screen.queryByText('继续上次练习？')).not.toBeInTheDocument();
  });

  it('discard button clears session', () => {
    const session = createSession({
      dictionaryId: 'cet4',
      minutesAgo: 30,
      currentIndex: 7,
      userAnswersCount: 6,
    });
    mockHasActiveSession.mockReturnValue(true);
    mockLoadSession.mockReturnValue(session);

    renderAndWaitForRecovery();

    // Dialog should be visible
    expect(screen.getByText('继续上次练习？')).toBeInTheDocument();

    // Click "放弃进度，重新开始" button
    const discardButton = screen.getByRole('button', { name: '放弃进度，重新开始' });
    fireEvent.click(discardButton);

    // clearSession should be called
    expect(mockClearSession).toHaveBeenCalled();

    // Dialog should be closed
    expect(screen.queryByText('继续上次练习？')).not.toBeInTheDocument();
  });

  describe('elapsed time formats', () => {
    it('shows minutes format when < 60 minutes', () => {
      const session = createSession({ dictionaryId: 'cet4', minutesAgo: 45, currentIndex: 3, userAnswersCount: 2 });
      mockHasActiveSession.mockReturnValue(true);
      mockLoadSession.mockReturnValue(session);

      renderAndWaitForRecovery();

      expect(screen.getByText(/45分钟前/)).toBeInTheDocument();
    });

    it('shows hours format when < 24 hours', () => {
      const session = createSession({ dictionaryId: 'cet4', minutesAgo: 120, currentIndex: 3, userAnswersCount: 2 });
      mockHasActiveSession.mockReturnValue(true);
      mockLoadSession.mockReturnValue(session);

      renderAndWaitForRecovery();

      expect(screen.getByText(/2小时前/)).toBeInTheDocument();
    });

    it('shows yesterday for 1 day ago', () => {
      const session = createSession({ dictionaryId: 'cet4', minutesAgo: 24 * 60, currentIndex: 3, userAnswersCount: 2 });
      mockHasActiveSession.mockReturnValue(true);
      mockLoadSession.mockReturnValue(session);

      renderAndWaitForRecovery();

      expect(screen.getByText('昨天')).toBeInTheDocument();
    });

    it('shows days format when > 1 day', () => {
      const session = createSession({ dictionaryId: 'cet4', minutesAgo: 3 * 24 * 60, currentIndex: 3, userAnswersCount: 2 });
      mockHasActiveSession.mockReturnValue(true);
      mockLoadSession.mockReturnValue(session);

      renderAndWaitForRecovery();

      expect(screen.getByText(/3天前/)).toBeInTheDocument();
    });
  });

  it('no recovery dialog when no active session', () => {
    mockHasActiveSession.mockReturnValue(false);

    renderAndWaitForRecovery();

    // Recovery dialog should NOT be visible
    expect(screen.queryByText('继续上次练习？')).not.toBeInTheDocument();
  });
});