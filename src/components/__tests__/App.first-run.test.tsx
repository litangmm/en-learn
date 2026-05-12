import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act, within } from '@testing-library/react';
import App from '../../App';

vi.mock('@/hooks/useChurnSignals', () => ({
  useChurnSignals: vi.fn(() => ({
    riskLevel: 'low',
    topRiskFactors: [],
  })),
}));

const { mockHasOnboardingComplete, mockSetOnboardingComplete } = vi.hoisted(() => ({
  mockHasOnboardingComplete: vi.fn(),
  mockSetOnboardingComplete: vi.fn(),
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
    hasActiveSession: vi.fn(() => false),
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
    getGoals: vi.fn(() => null),
    saveGoals: vi.fn(),
    generateDefaultGoals: vi.fn(() => ({ goals: [], updatedAt: Date.now() })),

    loadSession: vi.fn(() => null),
  },
}));

vi.mock('@/data/dictionaries', () => ({
  getDictionaryById: vi.fn(() => ({ id: 'cet4', name: 'CET-4', description: '', sentenceCount: 100 })),
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

describe('App first-run onboarding', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockState.showResult = false;
    mockState.isCorrect = false;
    mockState.attempts = 0;
    // Use fake timers to handle setTimeout in onboarding effect
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const renderAndWaitForOnboarding = () => {
    const result = render(<App />);
    // Advance timers to flush the setTimeout in onboarding effect
    act(() => {
      vi.advanceTimersByTime(0);
    });
    return result;
  };

  it('shows onboarding dialog for first-time user', () => {
    mockHasOnboardingComplete.mockReturnValue(false);

    renderAndWaitForOnboarding();

    expect(screen.getByText('欢迎使用 en-learn')).toBeInTheDocument();
  });

  it('shows 5 feature items in onboarding dialog', () => {
    mockHasOnboardingComplete.mockReturnValue(false);

    renderAndWaitForOnboarding();

    // Get the dialog content to scope queries
    const dialog = screen.getByRole('dialog');
    const dialogContent = within(dialog);

    // Check for the 5 feature items within the dialog
    expect(dialogContent.getByText('词典练习')).toBeInTheDocument();
    expect(dialogContent.getByText('多种模式')).toBeInTheDocument();
    expect(dialogContent.getByText('XP 等级')).toBeInTheDocument();
    expect(dialogContent.getByText('每日挑战')).toBeInTheDocument();
    expect(dialogContent.getByText('智能复习')).toBeInTheDocument();
  });

  it('skips onboarding dialog for returning user', () => {
    mockHasOnboardingComplete.mockReturnValue(true);

    renderAndWaitForOnboarding();

    // Onboarding dialog should NOT be visible
    expect(screen.queryByText('欢迎使用 en-learn')).not.toBeInTheDocument();
  });

  it('shows 4 dictionary options in onboarding', () => {
    mockHasOnboardingComplete.mockReturnValue(false);

    renderAndWaitForOnboarding();

    // Get the dialog content to scope queries
    const dialog = screen.getByRole('dialog');
    const dialogContent = within(dialog);

    // Check for dictionary options within the dialog
    expect(dialogContent.getByText('CET-4')).toBeInTheDocument();
    expect(dialogContent.getByText('CET-6')).toBeInTheDocument();
    expect(dialogContent.getByText('IELTS')).toBeInTheDocument();
    expect(dialogContent.getByText('TOEFL')).toBeInTheDocument();
  });

  it('allows selecting IELTS dictionary in onboarding', () => {
    mockHasOnboardingComplete.mockReturnValue(false);

    renderAndWaitForOnboarding();

    // Find the IELTS option button within the dialog
    const dialog = screen.getByRole('dialog');
    const dialogContent = within(dialog);
    const ieltsOption = dialogContent.getByText('雅思词汇').closest('button');
    expect(ieltsOption).toBeTruthy();
    fireEvent.click(ieltsOption!);

    // Click "开始学习"
    const startButton = screen.getByRole('button', { name: '开始学习' });
    fireEvent.click(startButton);

    // Verify setOnboardingComplete was called
    expect(mockSetOnboardingComplete).toHaveBeenCalled();
  });

  it('marks onboarding as complete after clicking start', () => {
    mockHasOnboardingComplete.mockReturnValue(false);

    renderAndWaitForOnboarding();

    // Click "开始学习" without changing selection (default is cet4)
    const startButton = screen.getByRole('button', { name: '开始学习' });
    fireEvent.click(startButton);

    // Verify onboarding completion was set
    expect(mockSetOnboardingComplete).toHaveBeenCalled();
  });

  it('has CET-4 as default dictionary selection', () => {
    mockHasOnboardingComplete.mockReturnValue(false);

    renderAndWaitForOnboarding();

    // Get the dialog content to scope queries
    const dialog = screen.getByRole('dialog');
    const dialogContent = within(dialog);

    // Check that CET-4 is the default selection by finding its button
    const cet4Button = dialogContent.getByText('大学英语四级').closest('button');
    expect(cet4Button).toBeTruthy();
    // Selected item should have border-primary class
    expect(cet4Button!.className).toContain('border-primary');
  });

  it('closes onboarding dialog and starts practice after selection', () => {
    mockHasOnboardingComplete.mockReturnValue(false);

    renderAndWaitForOnboarding();

    // Verify onboarding dialog is visible
    expect(screen.getByText('欢迎使用 en-learn')).toBeInTheDocument();

    // Click "开始学习"
    const startButton = screen.getByRole('button', { name: '开始学习' });
    fireEvent.click(startButton);

    // Verify dialog is closed - title should not be visible
    expect(screen.queryByText('欢迎使用 en-learn')).not.toBeInTheDocument();

    // Verify onboarding was marked complete
    expect(mockSetOnboardingComplete).toHaveBeenCalled();
  });
});