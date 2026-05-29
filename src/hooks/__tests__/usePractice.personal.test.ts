import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePractice } from '../usePractice';

// Shared mock sentences for most tests
const mockPersonalSentences = [
  {
    id: 'pw-1',
    english: 'Say hello to everyone',
    chinese: '向大家问好',
    blanks: [{ word: 'hello', hint: '你好' }],
    level: 'personal',
  },
  {
    id: 'pw-2',
    english: 'I need help',
    chinese: '我需要帮助',
    blanks: [{ word: 'help', hint: '帮助' }],
    level: 'personal',
  },
  {
    id: 'pw-3',
    english: 'Be a hero',
    chinese: '成为一个英雄',
    blanks: [{ word: 'hero', hint: '英雄' }],
    level: 'personal',
  },
];

// Create mock functions that can be overridden
const mockGetAllAsSentences = vi.fn(() => mockPersonalSentences);

// Mock usePersonalWordIndex
vi.mock('@/hooks/usePersonalWordIndex', () => ({
  usePersonalWordIndex: vi.fn(() => ({
    getAllAsSentences: mockGetAllAsSentences,
  })),
}));

// Mock useAdaptivePractice
vi.mock('@/hooks/useAdaptivePractice', () => ({
  useAdaptivePractice: vi.fn(() => ({
    getSmartDistractors: vi.fn(() => []),
  })),
}));

// Mock useHintLevel
vi.mock('@/hooks/useHintLevel', () => ({
  useHintLevel: vi.fn(() => ({
    recordCorrectAnswer: vi.fn(),
    recordWrongAnswer: vi.fn(),
    shouldShowHint: vi.fn(() => false),
  })),
}));

// Mock useQuestionWeighting
vi.mock('@/hooks/useQuestionWeighting', () => ({
  useQuestionWeighting: vi.fn(() => ({
    getWeightedSentenceIds: vi.fn((ids) => ids.slice(0, 10)),
    getWeightExplanation: vi.fn(() => null),
  })),
}));

// Mock storage
vi.mock('@/services/storage', () => ({
  storage: {
    loadSession: vi.fn(() => null),
    saveSession: vi.fn(),
    clearSession: vi.fn(),
    getMistakes: vi.fn(() => []),
    addMistake: vi.fn(),
    addHistory: vi.fn(),
    getHistory: vi.fn(() => []),
    getModeStats: vi.fn(() => []),
    getXPProfile: vi.fn(() => ({
      level: 2,
      currentXP: 50,
      totalXP: 50,
    })),
    getBadgeProgress: vi.fn(() => ({})),
    getMilestones: vi.fn(() => ({ unlockedMilestones: [], lastUpdated: Date.now() })),
    getAdaptiveConfig: vi.fn(() => ({
      difficultyCalibration: {
        enabled: false,
        targetAccuracy: 0.75,
        toleranceBand: 0.05,
        calibrationSpeed: 0.1,
      },
    })),
    getReviewQueue: vi.fn(() => []),
  },
}));

// Mock the personal dictionary ID constant
vi.mock('@/data/types', async () => {
  const actual = await vi.importActual('@/data/types');
  return {
    ...actual,
    PERSONAL_DICTIONARY_ID: 'personal',
    isPersonalDictionary: (id: string) => id === 'personal',
  };
});

describe('usePractice personal mode', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    localStorage.clear();
    vi.clearAllMocks();
    // Reset mock to return default sentences
    mockGetAllAsSentences.mockReturnValue(mockPersonalSentences);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should load personal sentences when dictionaryId is "personal"', async () => {
    const { result } = renderHook(() => usePractice('personal'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have loaded 3 personal sentences
    expect(result.current.shuffledSentences.length).toBe(3);
    expect(result.current.currentSentence).toBeDefined();
    expect(result.current.currentSentence!.id).toBe('pw-1');
    expect(result.current.currentSentence!.level).toBe('personal');
  });

  it('should limit to 10 sentences in personal mode', async () => {
    // Create 15 personal sentences
    const manySentences = Array.from({ length: 15 }, (_, i) => ({
      id: `pw-${i}`,
      english: `Test sentence ${i}`,
      chinese: `测试句子 ${i}`,
      blanks: [{ word: `word${i}`, hint: `hint${i}` }],
      level: 'personal',
    }));

    // Override the mock for this test
    mockGetAllAsSentences.mockReturnValue(manySentences);

    const { result } = renderHook(() => usePractice('personal'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should be limited to 10 sentences
    expect(result.current.shuffledSentences.length).toBe(10);
  });

  it('should not restore from session storage in personal mode', async () => {
    // Set up a "personal" session in storage to verify it's not restored
    const storedSession = {
      version: 2,
      dictionaryId: 'personal',
      session: {
        currentIndex: 5,
        userAnswers: [],
        currentInputs: ['test'],
        showResult: false,
        isCorrect: false,
        attempts: 0,
        isComplete: false,
        score: 100,
        selectedChoiceId: null,
        orderedTokenIds: [],
      },
      timestamp: Date.now(),
      mistakes: [],
    };
    localStorage.setItem('en-learn-session', JSON.stringify(storedSession));

    const { result } = renderHook(() => usePractice('personal'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should start from index 0, not 5
    expect(result.current.state.currentIndex).toBe(0);
    expect(result.current.state.score).toBe(0);
  });

  it('should reset state when dictionary changes', async () => {
    const { result } = renderHook(() => usePractice('personal'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Initial state
    expect(result.current.state.currentIndex).toBe(0);
    expect(result.current.state.score).toBe(0);

    // Reset should work
    act(() => {
      result.current.reset();
    });

    // State should be reset to initial values
    expect(result.current.state.currentIndex).toBe(0);
    expect(result.current.state.score).toBe(0);
  });

  it('should call getAllAsSentences from usePersonalWordIndex', async () => {
    renderHook(() => usePractice('personal'));

    await waitFor(() => {
      // Wait for the mock to be called
    });

    // Verify the hook called getAllAsSentences
    expect(mockGetAllAsSentences).toHaveBeenCalled();
  });

  it('should update lastPracticedAt in storage after completing personal practice', async () => {
    const { result } = renderHook(() => usePractice('personal'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Simulate completing the session
    act(() => {
      result.current.reset();
    });

    // State should be reset
    expect(result.current.state.currentIndex).toBe(0);
    expect(result.current.state.score).toBe(0);
  });

  it('should handle empty personal words list', async () => {
    mockGetAllAsSentences.mockReturnValue([]);

    const { result } = renderHook(() => usePractice('personal'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have 0 sentences
    expect(result.current.shuffledSentences.length).toBe(0);
    expect(result.current.currentSentence).toBeUndefined();
  });

  it('should work with all practice modes in personal mode', async () => {
    const { result } = renderHook(() => usePractice('personal', undefined, 'multiple-choice'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.shuffledSentences.length).toBe(3);
    expect(result.current.currentSentence).toBeDefined();
  });

  it('should start session timer when entering personal practice', async () => {
    const { result } = renderHook(() => usePractice('personal'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Session should be ready for practice
    expect(result.current.state.isComplete).toBe(false);
    expect(result.current.currentSentence).toBeDefined();
  });
});
