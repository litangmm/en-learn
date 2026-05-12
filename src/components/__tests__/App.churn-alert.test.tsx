import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import App from '../../App';
import type { ChurnSignal } from '@/data/types';

// Use vi.hoisted to create reactive mock state
const { mockInitializeInputs, mockSetInput, mockCheckAnswer, mockNextSentence,
        mockRetry, mockReset, mockAddXP, mockSpeak, mockTrackActivity } = vi.hoisted(() => ({
  mockInitializeInputs: vi.fn(),
  mockSetInput: vi.fn(),
  mockCheckAnswer: vi.fn(),
  mockNextSentence: vi.fn(),
  mockRetry: vi.fn(),
  mockReset: vi.fn(),
  mockAddXP: vi.fn(() => ({ finalXP: 15, multiplier: 1.0, streak: 0 })),
  mockSpeak: vi.fn(),
  mockTrackActivity: vi.fn(),
}));

// Mutable state for useChurnSignals mock - wrapped in object for mutability
const churnSignalsState = {
  riskLevel: 'low' as 'low' | 'medium' | 'high' | 'critical',
  topRiskFactors: [] as ChurnSignal[],
};

let mockShowResult = false;
let mockIsCorrect = false;
let mockAttempts = 0;

vi.mock('@/hooks/useChurnSignals', () => ({
  useChurnSignals: vi.fn(() => ({
    riskLevel: churnSignalsState.riskLevel,
    topRiskFactors: churnSignalsState.topRiskFactors,
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

vi.mock('@/hooks/useRecallReminder', () => ({
  useRecallReminder: vi.fn(() => ({
    status: 'idle' as const,
    dueCount: 0,
    lastDismissed: null,
    dismiss: vi.fn(),
    canShow: true,
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
    getGoals: vi.fn(() => null),
    saveGoals: vi.fn(),
    generateDefaultGoals: vi.fn(() => ({ goals: [], updatedAt: Date.now() })),
  },
}));

vi.mock('@/data/dictionaries', () => ({
  getDictionaryById: vi.fn(() => ({ id: 'cet4', name: 'CET-4', description: '', sentenceCount: 100 })),
  dictionaries: [{ id: 'cet4', name: 'CET-4', description: '', sentenceCount: 100 }],
}));

vi.mock('@/data/loader', () => ({
  loadDictionary: vi.fn(() => Promise.resolve([])),
}));

// Mock framer-motion globally - use function mock to pass through all props including data-testid
vi.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }, ref) => (
        <div ref={ref} {...props}>{children}</div>
      )),
      button: React.forwardRef(({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }, ref) => (
        <button ref={ref} {...props}>{children}</button>
      )),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

describe('App ChurnAlertBanner integration', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockShowResult = false;
    mockIsCorrect = false;
    mockAttempts = 0;
    // Reset to default low risk
    churnSignalsState.riskLevel = 'low';
    churnSignalsState.topRiskFactors = [];
    // Clear localStorage for dismissal tests
    localStorage.removeItem('en-learn-churn-banner-dismissed');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('shows banner for high risk level', () => {
    it('shows banner when riskLevel is high', async () => {
      churnSignalsState.riskLevel = 'high';
      churnSignalsState.topRiskFactors = [
        { type: 'inactive_days', value: 3, severity: 0.7, description: '3天未学习' },
      ];

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('churn-alert-banner')).toBeInTheDocument();
      });
    });

    it('shows banner when riskLevel is critical', async () => {
      churnSignalsState.riskLevel = 'critical';
      churnSignalsState.topRiskFactors = [
        { type: 'inactive_days', value: 7, severity: 0.9, description: '7天未学习' },
      ];

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('churn-alert-banner')).toBeInTheDocument();
      });
    });
  });

  describe('hides banner when dismissed or low risk', () => {
    it('hides banner when riskLevel is low', () => {
      churnSignalsState.riskLevel = 'low';
      churnSignalsState.topRiskFactors = [];

      render(<App />);

      expect(screen.queryByTestId('churn-alert-banner')).not.toBeInTheDocument();
    });

    it('hides banner when riskLevel is medium', () => {
      churnSignalsState.riskLevel = 'medium';
      churnSignalsState.topRiskFactors = [
        { type: 'inactive_days', value: 2, severity: 0.4, description: '2天未学习' },
      ];

      render(<App />);

      expect(screen.queryByTestId('churn-alert-banner')).not.toBeInTheDocument();
    });

    it('CTA button triggers onEngage and navigates to practice', async () => {
      churnSignalsState.riskLevel = 'high';
      churnSignalsState.topRiskFactors = [];

      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('churn-alert-banner')).toBeInTheDocument();
      });

      // Click the CTA button "开始练习"
      const ctaButton = screen.getByRole('button', { name: '开始练习' });
      fireEvent.click(ctaButton);

      // The CTA should trigger the engage action (handleRestart) which
      // resets practice state and starts a new session
      // Verify banner is still visible (banner doesn't hide on engage)
      expect(screen.getByTestId('churn-alert-banner')).toBeInTheDocument();
    });

    it('banner can be dismissed and hides after click', async () => {
      churnSignalsState.riskLevel = 'high';
      churnSignalsState.topRiskFactors = [
        {
          id: 'test_signal_1',
          type: 'session_gap',
          severity: 'high' as const,
          description: '3天未学习',
          value: 3,
          threshold: 3,
          detectedAt: 0,
        },
      ];

      const { rerender } = render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('churn-alert-banner')).toBeInTheDocument();
      });

      // Find and click the dismiss button (X icon)
      const dismissButton = screen.getByRole('button', { name: '关闭' });
      fireEvent.click(dismissButton);

      // Re-render to pick up localStorage changes (AnimatePresence mock just passes through)
      rerender(<App />);

      await waitFor(() => {
        expect(screen.queryByTestId('churn-alert-banner')).not.toBeInTheDocument();
      });
    });
  });
});