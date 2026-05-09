import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePractice } from '../usePractice';
import { storage } from '@/services/storage';

const mockSentences = [
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
    blanks: [
      { word: 'Actions', hint: '行动' },
      { word: 'words', hint: '言辞' },
    ],
    level: 'junior',
  },
  {
    id: '3',
    english: 'Practice makes perfect.',
    chinese: '熟能生巧。',
    blanks: [{ word: 'perfect', hint: '完美的' }],
    level: 'junior',
  },
];

vi.mock('@/data/loader', () => ({
  loadDictionary: vi.fn(() => Promise.resolve(mockSentences)),
}));

describe('usePractice', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => usePractice('test'));

    expect(result.current.state.currentIndex).toBe(0);
    expect(result.current.state.userAnswers).toEqual([]);
    expect(result.current.state.currentInputs).toEqual([]);
    expect(result.current.state.showResult).toBe(false);
    expect(result.current.state.isCorrect).toBe(false);
    expect(result.current.state.attempts).toBe(0);
    expect(result.current.state.isComplete).toBe(false);
    expect(result.current.state.score).toBe(0);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.totalQuestions).toBe(0);
  });

  it('should load sentences and update state', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.shuffledSentences.length).toBe(3);
    expect(result.current.currentSentence).toBeDefined();
    expect(result.current.totalQuestions).toBe(3);
    expect(result.current.currentQuestion).toBe(1);
    expect(result.current.state.currentInputs.length).toBeGreaterThan(0);
  });

  it('should update input value', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setInput(0, 'catches');
    });

    expect(result.current.state.currentInputs[0]).toBe('catches');
  });

  it('should mark answer as correct and increase score on first attempt', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setInput(0, 'catches');
    });

    act(() => {
      result.current.checkAnswer();
    });

    expect(result.current.state.showResult).toBe(true);
    expect(result.current.state.isCorrect).toBe(true);
    expect(result.current.state.attempts).toBe(1);
    expect(result.current.state.score).toBe(10);
    expect(result.current.state.userAnswers).toHaveLength(1);
    expect(result.current.state.userAnswers[0]).toMatchObject({
      sentenceId: '1',
      answers: ['catches'],
      isCorrect: true,
      attempts: 1,
    });
  });

  it('should reduce score on multiple attempts', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // First attempt: wrong
    act(() => {
      result.current.setInput(0, 'catch');
    });
    act(() => {
      result.current.checkAnswer();
    });
    expect(result.current.state.isCorrect).toBe(false);
    expect(result.current.state.score).toBe(0);

    // Retry
    act(() => {
      result.current.retry();
    });

    // Second attempt: correct
    act(() => {
      result.current.setInput(0, 'catches');
    });
    act(() => {
      result.current.checkAnswer();
    });

    expect(result.current.state.isCorrect).toBe(true);
    expect(result.current.state.attempts).toBe(2);
    expect(result.current.state.score).toBe(7); // 10 - (2-1)*3 = 7
  });

  it('should cap minimum score at 5', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 3 wrong attempts
    for (let i = 0; i < 3; i++) {
      act(() => {
        result.current.setInput(0, 'wrong');
      });
      act(() => {
        result.current.checkAnswer();
      });
      if (i < 2) {
        act(() => {
          result.current.retry();
        });
      }
    }

    // Correct on 4th attempt
    act(() => {
      result.current.retry();
    });
    act(() => {
      result.current.setInput(0, 'catches');
    });
    act(() => {
      result.current.checkAnswer();
    });

    expect(result.current.state.score).toBe(5); // capped at 5
  });

  it('should mark answer as wrong without changing score', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setInput(0, 'wrong');
    });
    act(() => {
      result.current.checkAnswer();
    });

    expect(result.current.state.showResult).toBe(true);
    expect(result.current.state.isCorrect).toBe(false);
    expect(result.current.state.attempts).toBe(1);
    expect(result.current.state.score).toBe(0);
    expect(result.current.state.userAnswers).toHaveLength(0);
  });

  it('should handle multiple blanks correctly', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Move to sentence 2 (2 blanks) by answering sentence 1
    act(() => {
      result.current.setInput(0, 'catches');
    });
    act(() => {
      result.current.checkAnswer();
    });
    act(() => {
      result.current.nextSentence();
    });

    expect(result.current.state.currentIndex).toBe(1);
    expect(result.current.state.currentInputs.length).toBe(2);

    act(() => {
      result.current.setInput(0, 'Actions');
      result.current.setInput(1, 'words');
    });
    act(() => {
      result.current.checkAnswer();
    });

    expect(result.current.state.isCorrect).toBe(true);
    expect(result.current.state.score).toBe(20);
  });

  it('should require all blanks to be correct', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Move to sentence 2
    act(() => {
      result.current.setInput(0, 'catches');
    });
    act(() => {
      result.current.checkAnswer();
    });
    act(() => {
      result.current.nextSentence();
    });

    act(() => {
      result.current.setInput(0, 'Actions');
      result.current.setInput(1, 'wrong');
    });
    act(() => {
      result.current.checkAnswer();
    });

    expect(result.current.state.isCorrect).toBe(false);
  });

  it('should move to next sentence and update progress', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setInput(0, 'catches');
    });
    act(() => {
      result.current.checkAnswer();
    });

    expect(result.current.progress).toBe((1 / 3) * 100);

    act(() => {
      result.current.nextSentence();
    });

    expect(result.current.state.currentIndex).toBe(1);
    expect(result.current.state.showResult).toBe(false);
    expect(result.current.state.isCorrect).toBe(false);
    expect(result.current.state.attempts).toBe(0);
    expect(result.current.currentQuestion).toBe(2);
  });

  it('should complete practice after last question', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Answer all questions
    for (let i = 0; i < 3; i++) {
      const answers = [['catches'], ['Actions', 'words'], ['perfect']][i];
      answers.forEach((ans, idx) => {
        act(() => {
          result.current.setInput(idx, ans);
        });
      });
      act(() => {
        result.current.checkAnswer();
      });
      // Click "next" for all questions including the last one to complete
      act(() => {
        result.current.nextSentence();
      });
    }

    expect(result.current.state.isComplete).toBe(true);
    expect(result.current.state.showResult).toBe(false);
  });

  it('should retry without resetting attempts', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setInput(0, 'wrong');
    });
    act(() => {
      result.current.checkAnswer();
    });

    expect(result.current.state.attempts).toBe(1);
    expect(result.current.state.showResult).toBe(true);

    act(() => {
      result.current.retry();
    });

    expect(result.current.state.attempts).toBe(1);
    expect(result.current.state.showResult).toBe(false);
    expect(result.current.state.isCorrect).toBe(false);
  });

  it('should reset to initial state', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setInput(0, 'catches');
    });
    act(() => {
      result.current.checkAnswer();
    });

    expect(result.current.state.score).toBe(10);

    act(() => {
      result.current.reset();
    });

    expect(result.current.state.currentIndex).toBe(0);
    expect(result.current.state.score).toBe(0);
    expect(result.current.state.userAnswers).toEqual([]);
    expect(result.current.state.showResult).toBe(false);
    expect(result.current.state.isComplete).toBe(false);
  });

  it('should not advance progress on wrong answer', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setInput(0, 'wrong');
    });
    act(() => {
      result.current.checkAnswer();
    });

    expect(result.current.progress).toBe(0);
  });

  it('should be case-insensitive for answers', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setInput(0, 'CATCHES');
    });
    act(() => {
      result.current.checkAnswer();
    });

    expect(result.current.state.isCorrect).toBe(true);
  });

  it('should trim whitespace from answers', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setInput(0, '  catches  ');
    });
    act(() => {
      result.current.checkAnswer();
    });

    expect(result.current.state.isCorrect).toBe(true);
  });

  it('should restore persisted session on mount', async () => {
    const persistedSession = {
      version: 1 as const,
      dictionaryId: 'test',
      session: {
        currentIndex: 1,
        userAnswers: [
          {
            sentenceId: '1',
            answers: ['catches'],
            isCorrect: true,
            attempts: 1,
          },
        ],
        currentInputs: ['old'],
        showResult: false,
        isCorrect: false,
        attempts: 0,
        isComplete: false,
        score: 10,
      },
      timestamp: Date.now(),
    };
    vi.spyOn(storage, 'loadSession').mockReturnValue(persistedSession);

    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.state.currentIndex).toBe(1);
    expect(result.current.state.score).toBe(10);
    expect(result.current.state.userAnswers).toHaveLength(1);
    expect(result.current.state.currentInputs).toEqual(['', '']);
  });

  it('should initialize normally when no persisted session', async () => {
    vi.spyOn(storage, 'loadSession').mockReturnValue(null);

    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.state.currentIndex).toBe(0);
    expect(result.current.state.score).toBe(0);
    expect(result.current.state.currentInputs).toEqual(['']);
  });

  it('should not restore session from different dictionary', async () => {
    const persistedSession = {
      version: 1 as const,
      dictionaryId: 'other-dict',
      session: {
        currentIndex: 2,
        userAnswers: [],
        currentInputs: [],
        showResult: false,
        isCorrect: false,
        attempts: 0,
        isComplete: false,
        score: 0,
      },
      timestamp: Date.now(),
    };
    vi.spyOn(storage, 'loadSession').mockReturnValue(persistedSession);

    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.state.currentIndex).toBe(0);
    expect(result.current.state.score).toBe(0);
  });

  it('should not restore completed session', async () => {
    const persistedSession = {
      version: 1 as const,
      dictionaryId: 'test',
      session: {
        currentIndex: 2,
        userAnswers: [],
        currentInputs: [],
        showResult: false,
        isCorrect: false,
        attempts: 0,
        isComplete: true,
        score: 0,
      },
      timestamp: Date.now(),
    };
    vi.spyOn(storage, 'loadSession').mockReturnValue(persistedSession);

    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.state.currentIndex).toBe(0);
    expect(result.current.state.isComplete).toBe(false);
  });

  it('should save session on state changes', async () => {
    const saveSpy = vi.spyOn(storage, 'saveSession').mockImplementation(() => {});
    vi.spyOn(storage, 'loadSession').mockReturnValue(null);

    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setInput(0, 'catches');
    });

    await waitFor(() => {
      expect(saveSpy).toHaveBeenCalledWith('test', expect.objectContaining({
        currentInputs: ['catches'],
      }));
    });
  });

  it('should load new dictionary when dictionaryId changes', async () => {
    vi.spyOn(storage, 'loadSession').mockReturnValue(null);

    const { rerender, result } = renderHook(({ dictId }) => usePractice(dictId), {
      initialProps: { dictId: 'dict-a' },
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify initial state
    expect(result.current.state.currentIndex).toBe(0);

    // Re-render with different dictionary
    rerender({ dictId: 'dict-b' });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should reset to initial state for new dictionary
    expect(result.current.state.currentIndex).toBe(0);
    expect(result.current.state.score).toBe(0);
  });
});
