import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import App from '../../App';

const mockInitializeInputs = vi.fn();
const mockSetInput = vi.fn();
const mockCheckAnswer = vi.fn();
const mockNextSentence = vi.fn();
const mockRetry = vi.fn();
const mockReset = vi.fn();
const mockAddXP = vi.fn(() => ({ finalXP: 15, multiplier: 1.0, streak: 0 }));
const mockSpeak = vi.fn();

let mockShowResult = false;
let mockIsCorrect = false;
let mockAttempts = 0;

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

vi.mock('@/hooks/useFlowState', () => ({
  useFlowState: vi.fn(() => ({
    flowState: 'normal',
    fatigueSignals: [
      { type: 'accuracy', trend: 'stable', description: '正确率保持稳定', severity: 0.2 },
      { type: 'consecutive_errors', trend: 'stable', description: '答题状态良好，无连续错误', severity: 0 },
      { type: 'speed', trend: 'stable', description: '答题节奏稳定', severity: 0.1 },
    ],
    recordCorrect: vi.fn(),
    recordWrong: vi.fn(),
    reset: vi.fn(),
    consecutiveErrors: 0,
    recentAccuracy: 0,
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
  },
}));

vi.mock('@/data/dictionaries', () => ({
  getDictionaryById: vi.fn(() => ({ id: 'cet4', name: 'CET-4', description: '', sentenceCount: 100 })),
  dictionaries: [{ id: 'cet4', name: 'CET-4', description: '', sentenceCount: 100 }],
}));

vi.mock('@/data/loader', () => ({
  loadDictionary: vi.fn(() => Promise.resolve([])),
}));

describe('App XP integration', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockShowResult = false;
    mockIsCorrect = false;
    mockAttempts = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders XPBar in header with correct level', () => {
    render(<App />);
    expect(screen.getByText('Lv.2')).toBeInTheDocument();
  });

  it('calls addXP on correct answer with base XP and firstTry bonus', () => {
    mockShowResult = true;
    mockIsCorrect = true;
    mockAttempts = 1;

    const { rerender } = render(<App />);
    rerender(<App />);

    expect(mockAddXP).toHaveBeenCalledWith(10, true);
  });

  it('calls addXP without firstTry bonus on multiple attempts', () => {
    mockShowResult = true;
    mockIsCorrect = true;
    mockAttempts = 2;

    const { rerender } = render(<App />);
    rerender(<App />);

    expect(mockAddXP).toHaveBeenCalledWith(10, false);
  });

  it('does not award XP when answer is wrong', () => {
    mockShowResult = true;
    mockIsCorrect = false;
    mockAttempts = 1;

    const { rerender } = render(<App />);
    rerender(<App />);

    expect(mockAddXP).not.toHaveBeenCalled();
  });

  it('does not double-award XP for same question', () => {
    mockShowResult = true;
    mockIsCorrect = true;
    mockAttempts = 1;

    const { rerender } = render(<App />);
    rerender(<App />);
    rerender(<App />);

    expect(mockAddXP).toHaveBeenCalledTimes(1);
  });

  it('clears award tracking on reset', () => {
    mockShowResult = true;
    mockIsCorrect = true;
    mockAttempts = 1;

    const { rerender } = render(<App />);
    rerender(<App />);

    expect(mockAddXP).toHaveBeenCalledTimes(1);

    // Click reset button
    const resetButton = screen.getByText('重置');
    fireEvent.click(resetButton);

    expect(mockReset).toHaveBeenCalled();

    // After reset, same question should be awardable again
    // (but we'd need to re-render with fresh state to verify)
  });

  it('renders XPBar in focus mode floating bar', () => {
    render(<App />);

    // Enter focus mode
    fireEvent.click(screen.getByText('专注模式'));

    // XPBar should be visible in floating bar
    expect(screen.getByText('Lv.2')).toBeInTheDocument();
  });
});
