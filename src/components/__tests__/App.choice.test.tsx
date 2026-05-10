import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import App from '../../App';
import type { ChoiceOption } from '@/data/types';

const mockInitializeInputs = vi.fn();
const mockSetInput = vi.fn();
const mockCheckAnswer = vi.fn();
const mockNextSentence = vi.fn();
const mockRetry = vi.fn();
const mockReset = vi.fn();
const mockSpeak = vi.fn();
const mockSelectChoice = vi.fn();

const mockOptions: ChoiceOption[] = [
  { id: '1', text: 'The early bird catches the worm.' },
  { id: '2', text: 'Actions speak louder than words.' },
  { id: '3', text: 'Practice makes perfect.' },
  { id: '4', text: 'Better late than never.' },
];

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
    options: mockOptions,
    setInput: mockSetInput,
    checkAnswer: mockCheckAnswer,
    nextSentence: mockNextSentence,
    retry: mockRetry,
    reset: mockReset,
    initializeInputs: mockInitializeInputs,
    selectChoice: mockSelectChoice,
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

describe('App multiple-choice integration', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders mode toggle with three options', () => {
    render(<App />);
    expect(screen.getByText('填空模式')).toBeInTheDocument();
    expect(screen.getByText('听写模式')).toBeInTheDocument();
    expect(screen.getByText('选择题模式')).toBeInTheDocument();
  });

  it('switches to multiple-choice mode and renders options', () => {
    render(<App />);

    const mcButton = screen.getByText('选择题模式');
    fireEvent.click(mcButton);

    expect(screen.getByText('The early bird catches the worm.')).toBeInTheDocument();
    expect(screen.getByText('Actions speak louder than words.')).toBeInTheDocument();
  });

  it('calls initializeInputs when switching to multiple-choice mode', () => {
    render(<App />);
    const mcButton = screen.getByText('选择题模式');
    fireEvent.click(mcButton);

    expect(mockInitializeInputs).toHaveBeenCalled();
  });

  it('passes options and selectChoice to PracticeCard', () => {
    render(<App />);
    const mcButton = screen.getByText('选择题模式');
    fireEvent.click(mcButton);

    // Options should be rendered
    expect(screen.getByText('Practice makes perfect.')).toBeInTheDocument();
  });

  it('uses 500ms auto-play delay in multiple-choice mode', () => {
    vi.useFakeTimers();
    render(<App />);
    const mcButton = screen.getByText('选择题模式');
    fireEvent.click(mcButton);

    vi.advanceTimersByTime(500);
    expect(mockSpeak).toHaveBeenCalled();

    vi.useRealTimers();
  });
});
