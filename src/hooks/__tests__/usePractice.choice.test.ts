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
  {
    id: '4',
    english: 'Better late than never.',
    chinese: '迟做总比不做好。',
    blanks: [{ word: 'never', hint: '从不' }],
    level: 'junior',
  },
  {
    id: '5',
    english: 'Time flies.',
    chinese: '时光飞逝。',
    blanks: [{ word: 'flies', hint: '飞' }],
    level: 'junior',
  },
];

vi.mock('@/data/loader', () => ({
  loadDictionary: vi.fn(() => Promise.resolve(mockSentences)),
}));

describe('usePractice multiple-choice', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate 4 options containing currentSentence', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toHaveLength(4);
    const hasCurrent = result.current.options.some(
      (s) => s.id === result.current.currentSentence?.id
    );
    expect(hasCurrent).toBe(true);
  });

  it('should update selectedChoiceId via selectChoice', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.selectChoice('2');
    });

    expect(result.current.state.selectedChoiceId).toBe('2');
  });

  it('should mark correct when checkAnswer with correct id', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const correctId = result.current.currentSentence!.id;

    act(() => {
      result.current.checkAnswer(correctId);
    });

    expect(result.current.state.showResult).toBe(true);
    expect(result.current.state.isCorrect).toBe(true);
    expect(result.current.state.score).toBe(10);
    expect(result.current.state.attempts).toBe(1);
    expect(result.current.state.userAnswers).toHaveLength(1);
    expect(result.current.state.userAnswers[0]).toMatchObject({
      sentenceId: correctId,
      isCorrect: true,
      attempts: 1,
    });
  });

  it('should mark wrong when checkAnswer with wrong id', async () => {
    vi.spyOn(storage, 'loadSession').mockReturnValue(null);

    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const correctId = result.current.currentSentence!.id;
    const wrongId = mockSentences.find((s) => s.id !== correctId)!.id;

    act(() => {
      result.current.checkAnswer(wrongId);
    });

    expect(result.current.state.showResult).toBe(true);
    expect(result.current.state.isCorrect).toBe(false);
    expect(result.current.state.score).toBe(0);
    expect(result.current.state.userAnswers).toHaveLength(0);
  });

  it('should reset selectedChoiceId on nextSentence', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.selectChoice('2');
    });
    expect(result.current.state.selectedChoiceId).toBe('2');

    act(() => {
      result.current.nextSentence();
    });

    expect(result.current.state.selectedChoiceId).toBeNull();
  });

  it('should reset selectedChoiceId on reset', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.selectChoice('2');
    });
    expect(result.current.state.selectedChoiceId).toBe('2');

    act(() => {
      result.current.reset();
    });

    expect(result.current.state.selectedChoiceId).toBeNull();
  });

});
