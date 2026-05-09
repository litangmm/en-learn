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

const mockTrackProgress = vi.fn();
const mockCheckBadges = vi.fn(() => []);

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

vi.mock('@/services/storage', () => ({
  storage: {
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

describe('App badge integration', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockShowResult = false;
    mockIsCorrect = false;
    mockAttempts = 0;
    mockUnlockedCount = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('(a) Award button renders in header score area', () => {
    render(<App />);
    const awardButton = screen.getByTestId('badge-award-header');
    expect(awardButton).toBeInTheDocument();
  });

  it('(b) Unlocked count badge shows correct number', () => {
    mockUnlockedCount = 3;
    render(<App />);
    const awardButton = screen.getByTestId('badge-award-header');
    expect(awardButton).toHaveTextContent('3');
  });

  it('(c) Clicking award switches to badges view', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('badge-award-header'));
    expect(screen.getByTestId('badge-panel')).toBeInTheDocument();
  });

  it('(d) BadgePanel receives correct props (or is in document)', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('badge-award-header'));
    expect(screen.getByTestId('badge-panel')).toBeInTheDocument();
    expect(screen.getByText('Badge Panel')).toBeInTheDocument();
  });

  it('(e) trackProgress called on correct answer with correct and streak', () => {
    mockShowResult = true;
    mockIsCorrect = true;
    mockAttempts = 1;

    const { rerender } = render(<App />);
    rerender(<App />);

    expect(mockTrackProgress).toHaveBeenCalledWith('correct');
    expect(mockTrackProgress).toHaveBeenCalledWith('streak', 1);
  });

  it('(f) checkBadges called on correct answer with current level', () => {
    mockShowResult = true;
    mockIsCorrect = true;
    mockAttempts = 1;

    const { rerender } = render(<App />);
    rerender(<App />);

    expect(mockCheckBadges).toHaveBeenCalledWith(2);
  });

  it('(g) Back button from badges returns to practice', () => {
    render(<App />);
    // Switch to badges view
    fireEvent.click(screen.getByTestId('badge-award-header'));
    expect(screen.getByTestId('badge-panel')).toBeInTheDocument();

    // Click back
    fireEvent.click(screen.getByTestId('badge-back-button'));

    // Should return to practice view (score text visible)
    expect(screen.getByText('得分: 0')).toBeInTheDocument();
    expect(screen.queryByTestId('badge-panel')).not.toBeInTheDocument();
  });
});
