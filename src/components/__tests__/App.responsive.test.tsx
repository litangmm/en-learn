import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import App from '../../App';

const mockInitializeInputs = vi.fn();
const mockSetInput = vi.fn();
const mockCheckAnswer = vi.fn();
const mockNextSentence = vi.fn();
const mockRetry = vi.fn();
const mockReset = vi.fn();
const mockSpeak = vi.fn();

let isMobileMock = false;

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
    playbackRate: 1,
    setPlaybackRate: vi.fn(),
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

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => isMobileMock),
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

describe('App responsive layout', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    isMobileMock = false;
  });

  it('renders MobileNav on mobile', () => {
    isMobileMock = true;
    render(<App />);
    expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
  });

  it('does not render MobileNav on desktop', () => {
    isMobileMock = false;
    render(<App />);
    expect(screen.queryByTestId('mobile-nav')).not.toBeInTheDocument();
  });

  it('hides desktop nav buttons on mobile via hidden class', () => {
    isMobileMock = true;
    render(<App />);
    // Find the desktop nav container and verify it has hidden class
    const desktopNavContainer = screen.getByText('错题本').parentElement;
    expect(desktopNavContainer).toHaveClass('hidden');
    expect(desktopNavContainer).toHaveClass('md:flex');
  });

  it('shows desktop nav buttons on desktop', () => {
    isMobileMock = false;
    render(<App />);
    expect(screen.getByText('错题本')).toBeInTheDocument();
    expect(screen.getByText('学习记录')).toBeInTheDocument();
    expect(screen.getByText('数据管理')).toBeInTheDocument();
    expect(screen.getByText('智能复习')).toBeInTheDocument();
  });

  it('shows DictionarySelector in main content on mobile', () => {
    isMobileMock = true;
    render(<App />);
    // DictionarySelector should be present somewhere (in main content area on mobile)
    const buttons = screen.getAllByRole('combobox');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('has bottom padding on mobile main content', () => {
    isMobileMock = true;
    render(<App />);
    const main = document.querySelector('main');
    expect(main).toHaveClass('pb-20');
    expect(main).toHaveClass('md:pb-0');
  });

  it('has no bottom padding on desktop main content', () => {
    isMobileMock = false;
    render(<App />);
    const main = document.querySelector('main');
    expect(main).toHaveClass('pb-20');
    expect(main).toHaveClass('md:pb-0');
  });

  it('header score area has flex-wrap to prevent overflow on narrow screens', () => {
    isMobileMock = true;
    const { container } = render(<App />);
    const header = container.querySelector('header');
    const flexWrapElements = header?.querySelectorAll('.flex-wrap');
    expect(flexWrapElements && flexWrapElements.length).toBeGreaterThanOrEqual(1);
  });

  it('title uses text-base on mobile with md:text-lg for desktop', () => {
    isMobileMock = true;
    const { container } = render(<App />);
    const title = container.querySelector('h1');
    expect(title).toHaveClass('text-base');
    expect(title).toHaveClass('md:text-lg');
  });

  it('ToggleGroup is wrapped in overflow-x-auto container on mobile', () => {
    isMobileMock = true;
    const { container } = render(<App />);
    const toggleGroup = container.querySelector('[role="group"]');
    expect(toggleGroup).toBeInTheDocument();
    const parent = toggleGroup?.parentElement;
    expect(parent).toHaveClass('overflow-x-auto');
  });

  it('PracticeCard inputs have responsive width classes', () => {
    isMobileMock = true;
    const { container } = render(<App />);
    const inputs = container.querySelectorAll('input[type="text"]');
    expect(inputs.length).toBeGreaterThan(0);
    inputs.forEach((input) => {
      expect(input).toHaveClass('min-w-[60px]');
      expect(input).toHaveClass('max-w-[120px]');
      expect(input).toHaveClass('md:w-32');
    });
  });

  it('audio button has responsive height classes', () => {
    isMobileMock = true;
    render(<App />);
    const audioButton = screen.getByText('播放音频').closest('button');
    expect(audioButton).toBeTruthy();
    expect(audioButton).toHaveClass('h-8');
    expect(audioButton).toHaveClass('md:h-10');
  });
});
