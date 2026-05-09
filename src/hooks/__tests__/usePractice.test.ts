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
    localStorage.clear();
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

  it('should change shuffled order after reset', async () => {
    let callCount = 0;
    const sequence = [0.1, 0.1, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9];
    vi.spyOn(Math, 'random').mockImplementation(() => sequence[callCount++] ?? 0.5);
    vi.spyOn(storage, 'loadSession').mockReturnValue(null);
    vi.spyOn(storage, 'saveSession').mockImplementation(() => {});

    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const firstId = result.current.shuffledSentences[0].id;

    act(() => {
      result.current.reset();
    });

    await waitFor(() => {
      expect(result.current.shuffledSentences[0].id).not.toBe(firstId);
    });
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
      version: 2 as const,
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
        orderedTokenIds: [],
      },
      timestamp: Date.now(),
      mistakes: [],
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
      version: 2 as const,
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
        orderedTokenIds: [],
      },
      timestamp: Date.now(),
      mistakes: [],
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
      version: 2 as const,
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
        orderedTokenIds: [],
      },
      timestamp: Date.now(),
      mistakes: [],
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

  describe('mistake capture', () => {
    it('should record a mistake on wrong answer', async () => {
      vi.spyOn(storage, 'loadSession').mockReturnValue(null);
      vi.spyOn(storage, 'saveSession').mockImplementation(() => {});

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

      expect(result.current.state.isCorrect).toBe(false);
      expect(result.current.state.showResult).toBe(true);
    });

    it('should persist mistakes when session completes', async () => {
      const addMistakeSpy = vi.spyOn(storage, 'addMistake').mockImplementation(() => {});
      vi.spyOn(storage, 'loadSession').mockReturnValue(null);
      vi.spyOn(storage, 'saveSession').mockImplementation(() => {});
      vi.spyOn(storage, 'clearSession').mockImplementation(() => {});

      const { result } = renderHook(() => usePractice('test'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Answer all questions wrong first, then correct
      for (let i = 0; i < 3; i++) {
        const answers = [['catches'], ['Actions', 'words'], ['perfect']][i];

        // Wrong first
        act(() => {
          result.current.setInput(0, 'wrong');
        });
        act(() => {
          result.current.checkAnswer();
        });

        // Then correct
        act(() => {
          result.current.retry();
        });
        answers.forEach((ans, idx) => {
          act(() => {
            result.current.setInput(idx, ans);
          });
        });
        act(() => {
          result.current.checkAnswer();
        });

        act(() => {
          result.current.nextSentence();
        });
      }

      await waitFor(() => {
        expect(result.current.state.isComplete).toBe(true);
      });

      await waitFor(() => {
        expect(addMistakeSpy).toHaveBeenCalled();
      });
    });

    it('should not record mistake when correct on first try', async () => {
      const addMistakeSpy = vi.spyOn(storage, 'addMistake').mockImplementation(() => {});
      vi.spyOn(storage, 'loadSession').mockReturnValue(null);
      vi.spyOn(storage, 'saveSession').mockImplementation(() => {});
      vi.spyOn(storage, 'clearSession').mockImplementation(() => {});

      const { result } = renderHook(() => usePractice('test'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Answer all correctly on first try
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
        act(() => {
          result.current.nextSentence();
        });
      }

      await waitFor(() => {
        expect(result.current.state.isComplete).toBe(true);
      });

      // Should not have called addMistake
      expect(addMistakeSpy).not.toHaveBeenCalled();
    });

    it('should update mistake with correct answers after retry', async () => {
      vi.spyOn(storage, 'loadSession').mockReturnValue(null);
      vi.spyOn(storage, 'saveSession').mockImplementation(() => {});

      const { result } = renderHook(() => usePractice('test'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // First attempt: wrong
      act(() => {
        result.current.setInput(0, 'wrong');
      });
      act(() => {
        result.current.checkAnswer();
      });

      expect(result.current.state.isCorrect).toBe(false);

      // Retry and get correct
      act(() => {
        result.current.retry();
      });
      act(() => {
        result.current.setInput(0, 'catches');
      });
      act(() => {
        result.current.checkAnswer();
      });

      expect(result.current.state.isCorrect).toBe(true);
      expect(result.current.state.attempts).toBe(2);
    });
  });

  describe('sentenceIds prop (mistake practice)', () => {
    it('should filter sentences when sentenceIds provided', async () => {
      vi.spyOn(storage, 'loadSession').mockReturnValue(null);

      const { result } = renderHook(() => usePractice('test', ['1', '3']));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.shuffledSentences).toHaveLength(2);
      expect(result.current.shuffledSentences[0].id).toBe('1');
      expect(result.current.shuffledSentences[1].id).toBe('3');
      expect(result.current.totalQuestions).toBe(2);
    });

    it('should fallback to all sentences when no sentenceIds match', async () => {
      vi.spyOn(storage, 'loadSession').mockReturnValue(null);

      const { result } = renderHook(() => usePractice('test', ['nonexistent']));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Falls back to first 10 (but we only have 3 mock sentences)
      expect(result.current.shuffledSentences.length).toBeGreaterThan(0);
    });
  });

  describe('history recording', () => {
    it('should record history when session completes', async () => {
      const addHistorySpy = vi.spyOn(storage, 'addHistory').mockImplementation(() => {});
      vi.spyOn(storage, 'loadSession').mockReturnValue(null);
      vi.spyOn(storage, 'saveSession').mockImplementation(() => {});
      vi.spyOn(storage, 'clearSession').mockImplementation(() => {});

      const { result } = renderHook(() => usePractice('test'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Answer all questions correctly on first try
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
        act(() => {
          result.current.nextSentence();
        });
      }

      await waitFor(() => {
        expect(result.current.state.isComplete).toBe(true);
      });

      await waitFor(() => {
        expect(addHistorySpy).toHaveBeenCalled();
      });

      const callArg = addHistorySpy.mock.calls[0][0];
      expect(callArg.dictionaryId).toBe('test');
      expect(callArg.score).toBe(30); // 10 points per question * 3
      expect(callArg.totalQuestions).toBe(3);
      expect(callArg.correctCount).toBe(3);
      expect(callArg.accuracy).toBe(100);
      expect(callArg.duration).toBeGreaterThanOrEqual(1);
      expect(typeof callArg.id).toBe('string');
      expect(typeof callArg.timestamp).toBe('number');
    });

    it('should calculate correctCount and accuracy correctly with wrong answers', async () => {
      const addHistorySpy = vi.spyOn(storage, 'addHistory').mockImplementation(() => {});
      vi.spyOn(storage, 'loadSession').mockReturnValue(null);
      vi.spyOn(storage, 'saveSession').mockImplementation(() => {});
      vi.spyOn(storage, 'clearSession').mockImplementation(() => {});

      const { result } = renderHook(() => usePractice('test'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Question 1: wrong then correct
      act(() => {
        result.current.setInput(0, 'wrong');
      });
      act(() => {
        result.current.checkAnswer();
      });
      act(() => {
        result.current.retry();
      });
      act(() => {
        result.current.setInput(0, 'catches');
      });
      act(() => {
        result.current.checkAnswer();
      });
      act(() => {
        result.current.nextSentence();
      });

      // Question 2: correct
      act(() => {
        result.current.setInput(0, 'Actions');
        result.current.setInput(1, 'words');
      });
      act(() => {
        result.current.checkAnswer();
      });
      act(() => {
        result.current.nextSentence();
      });

      // Question 3: wrong (don't retry, just move on)
      act(() => {
        result.current.setInput(0, 'wrong');
      });
      act(() => {
        result.current.checkAnswer();
      });
      act(() => {
        result.current.nextSentence();
      });

      await waitFor(() => {
        expect(result.current.state.isComplete).toBe(true);
      });

      await waitFor(() => {
        expect(addHistorySpy).toHaveBeenCalled();
      });

      const callArg = addHistorySpy.mock.calls[0][0];
      expect(callArg.correctCount).toBe(2); // Q1 and Q2 correct
      expect(callArg.totalQuestions).toBe(3);
      expect(callArg.accuracy).toBe(67); // round(2/3 * 100) = 67
    });

    it('should not record history for restored sessions', async () => {
      const addHistorySpy = vi.spyOn(storage, 'addHistory').mockImplementation(() => {});
      const persistedSession = {
        version: 2 as const,
        dictionaryId: 'test',
        session: {
          currentIndex: 0,
          userAnswers: [],
          currentInputs: [''],
          showResult: false,
          isCorrect: false,
          attempts: 0,
          isComplete: false,
          score: 0,
          orderedTokenIds: [],
        },
        timestamp: Date.now(),
        mistakes: [],
      };
      vi.spyOn(storage, 'loadSession').mockReturnValue(persistedSession);
      vi.spyOn(storage, 'saveSession').mockImplementation(() => {});
      vi.spyOn(storage, 'clearSession').mockImplementation(() => {});

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
        act(() => {
          result.current.nextSentence();
        });
      }

      await waitFor(() => {
        expect(result.current.state.isComplete).toBe(true);
      });

      // History should not be recorded for restored sessions
      expect(addHistorySpy).not.toHaveBeenCalled();
    });

    it('should record history after reset and completion', async () => {
      const addHistorySpy = vi.spyOn(storage, 'addHistory').mockImplementation(() => {});
      vi.spyOn(storage, 'loadSession').mockReturnValue(null);
      vi.spyOn(storage, 'saveSession').mockImplementation(() => {});
      vi.spyOn(storage, 'clearSession').mockImplementation(() => {});

      const { result } = renderHook(() => usePractice('test'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Reset first
      act(() => {
        result.current.reset();
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
        act(() => {
          result.current.nextSentence();
        });
      }

      await waitFor(() => {
        expect(result.current.state.isComplete).toBe(true);
      });

      await waitFor(() => {
        expect(addHistorySpy).toHaveBeenCalled();
      });

      const callArg = addHistorySpy.mock.calls[0][0];
      expect(callArg.duration).toBeGreaterThanOrEqual(1);
      expect(callArg.correctCount).toBe(3);
    });
  });
});
