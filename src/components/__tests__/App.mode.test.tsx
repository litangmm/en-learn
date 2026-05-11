import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
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

describe('App mode switching', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders mode toggle with both options', () => {
    render(<App />);
    expect(screen.getByText('填空模式')).toBeInTheDocument();
    expect(screen.getByText('听写模式')).toBeInTheDocument();
  });

  it('switches to dictation mode and keeps chinese translation visible', () => {
    render(<App />);
    // Initially in fill-in-blanks mode, chinese is visible
    expect(screen.getByText('早起的鸟儿有虫吃。')).toBeInTheDocument();

    // Click dictation mode
    const dictationButton = screen.getByText('听写模式');
    fireEvent.click(dictationButton);

    // Chinese should remain visible in dictation mode
    expect(screen.getByText('早起的鸟儿有虫吃。')).toBeInTheDocument();
  });

  it('calls initializeInputs when switching mode', () => {
    render(<App />);
    const dictationButton = screen.getByText('听写模式');
    fireEvent.click(dictationButton);

    expect(mockInitializeInputs).toHaveBeenCalled();
  });

  it('switches back to fill-in-blanks mode and shows chinese translation', () => {
    render(<App />);
    const dictationButton = screen.getByText('听写模式');
    const fillButton = screen.getByText('填空模式');

    // Switch to dictation — chinese remains visible
    fireEvent.click(dictationButton);
    expect(screen.getByText('早起的鸟儿有虫吃。')).toBeInTheDocument();

    // Switch back to fill-in-blanks — chinese still visible
    fireEvent.click(fillButton);
    expect(screen.getByText('早起的鸟儿有虫吃。')).toBeInTheDocument();
  });

  it('has fill-in-blanks as default mode', () => {
    render(<App />);
    // Chinese should be visible by default
    expect(screen.getByText('早起的鸟儿有虫吃。')).toBeInTheDocument();
    // English sentence should also be visible
    expect(screen.getByText(/The early bird/)).toBeInTheDocument();
  });
});
