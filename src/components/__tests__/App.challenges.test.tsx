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
const mockTrackActivity = vi.fn();
const mockClaimReward = vi.fn();

let mockShowResult = false;
let mockIsCorrect = false;
let mockAttempts = 0;
let mockUnclaimedCount = 0;

vi.mock('@/hooks/useChurnSignals', () => ({
  useChurnSignals: vi.fn(() => ({
    riskLevel: 'low',
    topRiskFactors: [],
  })),
}));

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
      challenges: [
        {
          id: 'c1',
          title: '答对5题',
          description: '答对5道题',
          type: 'correct',
          target: 5,
          current: 3,
          completed: false,
          claimed: false,
          rewardXP: 20,
        },
        {
          id: 'c2',
          title: '连续答对3题',
          description: '连续答对3道题',
          type: 'streak',
          target: 3,
          current: 0,
          completed: false,
          claimed: false,
          rewardXP: 30,
        },
      ],
    },
    unclaimedCount: mockUnclaimedCount,
    trackActivity: mockTrackActivity,
    claimReward: mockClaimReward,
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

vi.mock('@/components/DailyChallengePanel', () => ({
  DailyChallengePanel: vi.fn(({ onBack }: { onBack: () => void }) => (
    <div data-testid="daily-challenge-panel">
      <span>Daily Challenges</span>
      <button onClick={onBack} data-testid="challenge-back-button">
        返回
      </button>
    </div>
  )),
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
    getGoals: vi.fn(() => null),
    saveGoals: vi.fn(),
    generateDefaultGoals: vi.fn(() => ({ goals: [], updatedAt: Date.now() })),
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

describe('App daily challenges integration', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockShowResult = false;
    mockIsCorrect = false;
    mockAttempts = 0;
    mockUnclaimedCount = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('(a) Trophy button renders in header score area', () => {
    render(<App />);
    const trophyButton = screen.getByTestId('challenge-trophy-header');
    expect(trophyButton).toBeInTheDocument();
  });

  it('(b) Unclaimed badge shows correct count', () => {
    mockUnclaimedCount = 2;
    render(<App />);
    const trophyButton = screen.getByTestId('challenge-trophy-header');
    expect(trophyButton).toHaveTextContent('2');
  });

  it('(c) Clicking trophy switches to challenges view', () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('challenge-trophy-header'));
    expect(screen.getByTestId('daily-challenge-panel')).toBeInTheDocument();
  });

  it('(d) trackActivity called on correct answer with answer, correct, and streak', () => {
    mockShowResult = true;
    mockIsCorrect = true;
    mockAttempts = 1;

    const { rerender } = render(<App />);
    rerender(<App />);

    expect(mockTrackActivity).toHaveBeenCalledWith('answer');
    expect(mockTrackActivity).toHaveBeenCalledWith('correct');
    expect(mockTrackActivity).toHaveBeenCalledWith('streak', 1);
  });

  it('(e) trackActivity called on wrong answer with answer and streak 0', () => {
    mockShowResult = true;
    mockIsCorrect = false;

    const { rerender } = render(<App />);
    rerender(<App />);

    expect(mockTrackActivity).toHaveBeenCalledWith('answer');
    expect(mockTrackActivity).toHaveBeenCalledWith('streak', 0);
  });

  it('(f) Back button from challenges returns to practice view', () => {
    render(<App />);
    // Switch to challenges view
    fireEvent.click(screen.getByTestId('challenge-trophy-header'));
    expect(screen.getByTestId('daily-challenge-panel')).toBeInTheDocument();

    // Click back
    fireEvent.click(screen.getByTestId('challenge-back-button'));

    // Should return to practice view (score text visible)
    expect(screen.getByText('得分: 0')).toBeInTheDocument();
    expect(screen.queryByTestId('daily-challenge-panel')).not.toBeInTheDocument();
  });
});
