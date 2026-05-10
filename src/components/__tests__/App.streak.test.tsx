import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import App from '../../App';

const mockInitializeInputs = vi.fn();
const mockSetInput = vi.fn();
const mockCheckAnswer = vi.fn();
const mockNextSentence = vi.fn();
const mockRetry = vi.fn();
const mockReset = vi.fn();
const mockAddXP = vi.fn(() => ({ finalXP: 15, multiplier: 1.5, streak: 3 }));
const mockRecordCorrectAnswer = vi.fn();
const mockRecordWrongAnswer = vi.fn();
const mockResetStreak = vi.fn();

const mockTrackActivity = vi.fn();

let mockShowResult = false;
let mockIsCorrect = false;
let mockAttempts = 0;
let mockStreak = 0;

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
    speak: vi.fn(),
    isSpeaking: false,
    playbackRate: 1.0,
    setPlaybackRate: vi.fn(),
  })),
}));

vi.mock('@/hooks/useXP', () => ({
  useXP: vi.fn(() => ({
    profile: { totalXP: 150, currentLevel: 2, levelProgress: 50 },
    addXP: mockAddXP,
    resetXPProfile: vi.fn(),
    streak: mockStreak,
    maxStreakReached: 0,
    recordCorrectAnswer: mockRecordCorrectAnswer,
    recordWrongAnswer: mockRecordWrongAnswer,
    resetStreak: mockResetStreak,
  })),
}));

vi.mock('@/hooks/useDailyChallenges', () => ({
  useDailyChallenges: vi.fn(() => ({
    state: {
      date: '2026-05-10',
      challenges: [],
    },
    unclaimedCount: 0,
    trackActivity: mockTrackActivity,
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
  },
}));

vi.mock('@/data/dictionaries', () => ({
  getDictionaryById: vi.fn(() => ({ id: 'cet4', name: 'CET-4', description: '', sentenceCount: 100 })),
  dictionaries: [{ id: 'cet4', name: 'CET-4', description: '', sentenceCount: 100 }],
}));

vi.mock('@/data/loader', () => ({
  loadDictionary: vi.fn(() => Promise.resolve([])),
}));

describe('App streak integration', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockShowResult = false;
    mockIsCorrect = false;
    mockAttempts = 0;
    mockStreak = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('streak badge appears in header when streak >= 2', () => {
    mockStreak = 3;

    render(<App />);

    expect(screen.getByTestId('streak-feedback')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('streak badge does not appear when streak < 2', () => {
    mockStreak = 0;

    render(<App />);

    expect(screen.queryByTestId('streak-feedback')).not.toBeInTheDocument();
  });

  it('calls recordCorrectAnswer on correct answer', () => {
    mockShowResult = true;
    mockIsCorrect = true;
    mockAttempts = 1;

    const { rerender } = render(<App />);
    rerender(<App />);

    expect(mockRecordCorrectAnswer).toHaveBeenCalledTimes(1);
  });

  it('calls recordWrongAnswer on wrong answer', () => {
    mockShowResult = true;
    mockIsCorrect = false;
    mockAttempts = 1;

    const { rerender } = render(<App />);
    rerender(<App />);

    expect(mockRecordWrongAnswer).toHaveBeenCalledTimes(1);
  });

  it('calls addXP with multiplier and triggers XP popup', async () => {
    mockShowResult = true;
    mockIsCorrect = true;
    mockAttempts = 1;

    const { rerender } = render(<App />);
    rerender(<App />);

    expect(mockAddXP).toHaveBeenCalledWith(10, true);

    // XP popup should appear after requestAnimationFrame
    await waitFor(() => {
      expect(screen.getByTestId('xp-gain-popup')).toBeInTheDocument();
    });
  });

  it('reset button calls resetStreak', () => {
    render(<App />);

    const resetButton = screen.getByText('重置');
    fireEvent.click(resetButton);

    expect(mockResetStreak).toHaveBeenCalledTimes(1);
  });

  it('focus mode shows streak badge', () => {
    mockStreak = 5;

    render(<App />);

    // Enter focus mode
    fireEvent.click(screen.getByText('专注模式'));

    expect(screen.getByTestId('streak-feedback')).toBeInTheDocument();
  });
});
