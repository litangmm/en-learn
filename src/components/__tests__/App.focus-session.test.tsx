import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import App from '../../App';

const mockInitializeInputs = vi.fn();
const mockSetInput = vi.fn();
const mockCheckAnswer = vi.fn();
const mockNextSentence = vi.fn();
const mockRetry = vi.fn();
const mockReset = vi.fn();
const mockSpeak = vi.fn();

vi.mock('@/hooks/usePractice', () => ({
  usePractice: vi.fn(() => ({
    state: {
      currentIndex: 0,
      userAnswers: [],
      currentInputs: ['test-value'],
      showResult: false,
      isCorrect: false,
      attempts: 0,
      isComplete: false,
      score: 0,
      orderedTokenIds: [],
      selectedChoiceId: null,
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
    shouldShowHint: vi.fn(() => false),
    reset: vi.fn(),
  })),
}));

vi.mock('@/hooks/useXP', () => ({
  useXP: vi.fn(() => ({
    profile: { totalXP: 150, currentLevel: 2, levelProgress: 50 },
    addXP: vi.fn(),
    getPersonalWords: vi.fn(() => []),
    addPersonalWord: vi.fn(),
    removePersonalWord: vi.fn(),
    getPersonalWordCount: vi.fn(() => 0),
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

vi.mock('@/hooks/usePersonalWords', () => ({
  usePersonalWords: vi.fn(() => ({
    isMarked: vi.fn(() => false),
    markFromPractice: vi.fn(),
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
    importAllData: vi.fn(() => ({ success: true, importedCounts: {}, message: '' })),
    getReviewQueue: vi.fn(() => []),
    scheduleNextReview: vi.fn(),
    getXPProfile: vi.fn(() => ({ totalXP: 0, currentLevel: 1, levelProgress: 0 })),
    updateXPProfile: vi.fn(),
    addXP: vi.fn(),
    getPersonalWords: vi.fn(() => []),
    addPersonalWord: vi.fn(),
    removePersonalWord: vi.fn(),
    getPersonalWordCount: vi.fn(() => 0),
  },
}));

vi.mock('@/data/dictionaries', () => ({
  getDictionaryById: vi.fn(() => ({ id: 'cet4', name: 'CET-4', description: '', sentenceCount: 100 })),
  dictionaries: [{ id: 'cet4', name: 'CET-4', description: '', sentenceCount: 100 }],
}));

vi.mock('@/data/loader', () => ({
  loadDictionary: vi.fn(() => Promise.resolve([])),
}));

describe('FocusSession', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows focus session button in navigation area', () => {
    render(<App />);
    // The new "沉浸专注" button should be visible
    expect(screen.getByText('沉浸专注')).toBeInTheDocument();
  });

  it('opens focus session overlay when clicking the button', () => {
    render(<App />);

    // Click the focus session button
    const focusSessionButton = screen.getByText('沉浸专注');
    fireEvent.click(focusSessionButton);

    // Should show timer in overlay (format: MM:SS)
    expect(screen.getByText('00:00')).toBeInTheDocument();
  });

  it('shows current/total questions in overlay', () => {
    render(<App />);

    // Click the focus session button
    fireEvent.click(screen.getByText('沉浸专注'));

    // Should show question count with current/total format
    expect(screen.getByText('1/10 题')).toBeInTheDocument();
  });

  it('shows exit button in overlay', () => {
    render(<App />);

    // Click the focus session button
    fireEvent.click(screen.getByText('沉浸专注'));

    // Should show exit button (aria-label)
    const exitButton = screen.getByRole('button', { name: '退出专注模式' });
    expect(exitButton).toBeInTheDocument();
  });

  it('closes focus session and returns to normal view when exit is clicked', () => {
    render(<App />);

    // Enter focus session
    fireEvent.click(screen.getByText('沉浸专注'));

    // Timer should be visible
    expect(screen.getByText('00:00')).toBeInTheDocument();

    // Exit the session
    const exitButton = screen.getByRole('button', { name: '退出专注模式' });
    fireEvent.click(exitButton);

    // Timer should no longer be visible (overlay closed)
    expect(screen.queryByText('00:00')).not.toBeInTheDocument();

    // Normal navigation should be restored
    expect(screen.getByText('沉浸专注')).toBeInTheDocument();
    expect(screen.getByText('填空模式')).toBeInTheDocument();
  });

  it('timer counts up in focus session', async () => {
    vi.useFakeTimers();
    render(<App />);

    // Enter focus session wrapped in act
    act(() => {
      fireEvent.click(screen.getByText('沉浸专注'));
    });

    // Initial time should be 00:00
    expect(screen.getByText('00:00')).toBeInTheDocument();

    // Advance time by 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // Timer should show 00:05
    expect(screen.getByText('00:05')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('practice card content is rendered in focus session overlay', () => {
    render(<App />);

    // Enter focus session wrapped in act
    act(() => {
      fireEvent.click(screen.getByText('沉浸专注'));
    });

    // The overlay should be visible (check for the timer which is always there)
    expect(screen.getByText('00:00')).toBeInTheDocument();

    // Check that the overlay exists (it should cover the entire viewport)
    const overlay = document.querySelector('[class*="fixed inset-0 z-"]');
    expect(overlay).toBeInTheDocument();

    // Check the sentence appears in the DOM (it may appear multiple times due to the overlay)
    const sentences = screen.getAllByText((_, element) => {
      return element?.textContent?.includes('早起的鸟儿有虫吃') ?? false;
    });
    expect(sentences.length).toBeGreaterThanOrEqual(1);
  });
});