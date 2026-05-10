import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
    options: [],
    selectChoice: vi.fn(),
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
  },
}));

vi.mock('@/data/dictionaries', () => ({
  getDictionaryById: vi.fn(() => ({ id: 'cet4', name: 'CET-4', description: '', sentenceCount: 100 })),
  dictionaries: [{ id: 'cet4', name: 'CET-4', description: '', sentenceCount: 100 }],
}));

vi.mock('@/data/loader', () => ({
  loadDictionary: vi.fn(() => Promise.resolve([])),
}));

describe('App focus mode', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders focus mode entry button', () => {
    render(<App />);
    expect(screen.getByText('专注模式')).toBeInTheDocument();
  });

  it('enters focus mode when clicking the entry button', () => {
    render(<App />);

    // Normal UI elements should be visible before focus mode
    expect(screen.getByText('听力词汇练习')).toBeInTheDocument();
    expect(screen.getByText('填空模式')).toBeInTheDocument();

    // Click focus mode button
    const focusButton = screen.getByText('专注模式');
    fireEvent.click(focusButton);

    // Header should be hidden
    expect(screen.queryByText('听力词汇练习')).not.toBeInTheDocument();

    // Mode toggle should be hidden
    expect(screen.queryByText('填空模式')).not.toBeInTheDocument();

    // Floating bar should be visible
    expect(screen.getByText(/第 1\/10 题/)).toBeInTheDocument();
    expect(screen.getByText('得分: 0')).toBeInTheDocument();
    expect(screen.getByText('退出专注')).toBeInTheDocument();

    // Bottom hint should be hidden
    expect(screen.queryByText(/听音频后，在输入框中填入/)).not.toBeInTheDocument();
  });

  it('exits focus mode when clicking exit button', () => {
    render(<App />);

    // Enter focus mode
    fireEvent.click(screen.getByText('专注模式'));
    expect(screen.queryByText('听力词汇练习')).not.toBeInTheDocument();

    // Exit focus mode
    fireEvent.click(screen.getByText('退出专注'));

    // Normal UI should be restored
    expect(screen.getByText('听力词汇练习')).toBeInTheDocument();
    expect(screen.getByText('填空模式')).toBeInTheDocument();
    expect(screen.getByText('专注模式')).toBeInTheDocument();
  });

  it('exits focus mode when pressing ESC key', () => {
    render(<App />);

    // Enter focus mode
    fireEvent.click(screen.getByText('专注模式'));
    expect(screen.queryByText('听力词汇练习')).not.toBeInTheDocument();

    // Press ESC
    fireEvent.keyDown(window, { key: 'Escape' });

    // Normal UI should be restored
    expect(screen.getByText('听力词汇练习')).toBeInTheDocument();
    expect(screen.getByText('填空模式')).toBeInTheDocument();
  });

  it('does not exit focus mode on ESC when typing in an input', () => {
    render(<App />);

    // Enter focus mode
    fireEvent.click(screen.getByText('专注模式'));

    // Find input and focus it
    const input = screen.getByPlaceholderText('1');
    fireEvent.keyDown(input, { key: 'Escape' });

    // Should still be in focus mode (floating bar still visible)
    expect(screen.getByText(/第 1\/10 题/)).toBeInTheDocument();
  });

  it('PracticeCard remains interactive in focus mode', () => {
    render(<App />);

    // Enter focus mode
    fireEvent.click(screen.getByText('专注模式'));

    // PracticeCard should still render
    expect(screen.getByText('早起的鸟儿有虫吃。')).toBeInTheDocument();

    // Input should be present and interactive
    const input = screen.getByPlaceholderText('1');
    expect(input).toBeInTheDocument();

    // Submit button should be present
    expect(screen.getByText('提交答案')).toBeInTheDocument();

    // Audio button should be present
    expect(screen.getByText('播放音频')).toBeInTheDocument();
  });
});
