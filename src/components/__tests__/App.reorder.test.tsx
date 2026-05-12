import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import App from '../../App';

const mockInitializeInputs = vi.fn();
const mockResetTokens = vi.fn();
const mockSetInput = vi.fn();
const mockCheckAnswer = vi.fn();
const mockNextSentence = vi.fn();
const mockRetry = vi.fn();
const mockReset = vi.fn();
const mockSpeak = vi.fn();
const mockSelectChoice = vi.fn();
const mockSelectToken = vi.fn();
const mockDeselectToken = vi.fn();

const mockTokens = [
  { id: '1-token-0', text: 'The' },
  { id: '1-token-1', text: 'early' },
  { id: '1-token-2', text: 'bird' },
  { id: '1-token-3', text: 'catches' },
  { id: '1-token-4', text: 'the' },
  { id: '1-token-5', text: 'worm.' },
];

const mockOptions = [
  {
    id: '1',
    english: 'The early bird catches the worm.',
    chinese: '早起的鸟儿有虫吃。',
    blanks: [{ word: 'catches', hint: '抓住' }],
    level: 'junior',
  },
  {
    id: '2',
    english: 'Actions speak louder than words.',
    chinese: '行动胜于言辞。',
    blanks: [{ word: 'Actions', hint: '行动' }],
    level: 'junior',
  },
  {
    id: '3',
    english: 'Practice makes perfect.',
    chinese: '熟能生巧。',
    blanks: [{ word: 'perfect', hint: '完美的' }],
    level: 'junior',
  },
  {
    id: '4',
    english: 'Better late than never.',
    chinese: '迟做总比不做好。',
    blanks: [{ word: 'never', hint: '从不' }],
    level: 'junior',
  },
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
    options: mockOptions,
    sentenceTokens: mockTokens,
    setInput: mockSetInput,
    checkAnswer: mockCheckAnswer,
    nextSentence: mockNextSentence,
    retry: mockRetry,
    reset: mockReset,
    initializeInputs: mockInitializeInputs,
    selectChoice: mockSelectChoice,
    selectToken: mockSelectToken,
    deselectToken: mockDeselectToken,
    resetTokens: mockResetTokens,
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

describe('App sentence-reorder integration', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders mode toggle with four options including 连词成句', () => {
    render(<App />);
    expect(screen.getByText('填空模式')).toBeInTheDocument();
    expect(screen.getByText('听写模式')).toBeInTheDocument();
    expect(screen.getByText('选择题模式')).toBeInTheDocument();
    expect(screen.getByText('连词成句')).toBeInTheDocument();
  });

  it('switches to sentence-reorder mode and renders word pool', () => {
    render(<App />);

    const reorderButton = screen.getByText('连词成句');
    fireEvent.click(reorderButton);

    expect(screen.getByText('The')).toBeInTheDocument();
    expect(screen.getByText('early')).toBeInTheDocument();
    expect(screen.getByText('bird')).toBeInTheDocument();
  });

  it('calls initializeInputs and resetTokens when switching to sentence-reorder mode', () => {
    render(<App />);
    const reorderButton = screen.getByText('连词成句');
    fireEvent.click(reorderButton);

    expect(mockInitializeInputs).toHaveBeenCalled();
    expect(mockResetTokens).toHaveBeenCalled();
  });

  it('passes sentenceTokens and orderedTokenIds to PracticeCard in reorder mode', () => {
    render(<App />);
    const reorderButton = screen.getByText('连词成句');
    fireEvent.click(reorderButton);

    // All tokens should be rendered from the pool
    expect(screen.getByText('The')).toBeInTheDocument();
    expect(screen.getByText('catches')).toBeInTheDocument();
    expect(screen.getByText('worm.')).toBeInTheDocument();
  });

  it('uses 500ms auto-play delay in sentence-reorder mode', () => {
    vi.useFakeTimers();
    render(<App />);
    const reorderButton = screen.getByText('连词成句');
    fireEvent.click(reorderButton);

    vi.advanceTimersByTime(500);
    expect(mockSpeak).toHaveBeenCalled();

    vi.useRealTimers();
  });
});
