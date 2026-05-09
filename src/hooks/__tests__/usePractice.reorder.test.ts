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

describe('usePractice sentence-reorder', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should generate sentenceTokens from current sentence', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.sentenceTokens).toHaveLength(6);
    expect(result.current.sentenceTokens[0]).toMatchObject({
      id: '1-token-0',
      text: 'The',
    });
    expect(result.current.sentenceTokens[5]).toMatchObject({
      id: '1-token-5',
      text: 'worm.',
    });
  });

  it('should append token id via selectToken', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.selectToken('1-token-0');
    });

    expect(result.current.state.orderedTokenIds).toEqual(['1-token-0']);

    act(() => {
      result.current.selectToken('1-token-1');
    });

    expect(result.current.state.orderedTokenIds).toEqual(['1-token-0', '1-token-1']);
  });

  it('should remove token by index via deselectToken', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.selectToken('1-token-0');
      result.current.selectToken('1-token-1');
      result.current.selectToken('1-token-2');
    });

    expect(result.current.state.orderedTokenIds).toHaveLength(3);

    act(() => {
      result.current.deselectToken(1);
    });

    expect(result.current.state.orderedTokenIds).toEqual(['1-token-0', '1-token-2']);
  });

  it('should clear all tokens via resetTokens', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.selectToken('1-token-0');
      result.current.selectToken('1-token-1');
    });

    expect(result.current.state.orderedTokenIds).toHaveLength(2);

    act(() => {
      result.current.resetTokens();
    });

    expect(result.current.state.orderedTokenIds).toEqual([]);
  });

  it('should award 10 points when checkAnswer with correct order', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const correctOrder = result.current.sentenceTokens.map((t) => t.id);

    act(() => {
      result.current.checkAnswer(correctOrder);
    });

    expect(result.current.state.showResult).toBe(true);
    expect(result.current.state.isCorrect).toBe(true);
    expect(result.current.state.score).toBe(10);
    expect(result.current.state.userAnswers).toHaveLength(1);
    expect(result.current.state.userAnswers[0]).toMatchObject({
      sentenceId: '1',
      isCorrect: true,
      attempts: 1,
    });
  });

  it('should record mistake when checkAnswer with wrong order', async () => {
    vi.spyOn(storage, 'loadSession').mockReturnValue(null);

    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const tokens = result.current.sentenceTokens;
    const wrongOrder = [tokens[1].id, tokens[0].id, ...tokens.slice(2).map((t) => t.id)];

    act(() => {
      result.current.checkAnswer(wrongOrder);
    });

    expect(result.current.state.showResult).toBe(true);
    expect(result.current.state.isCorrect).toBe(false);
    expect(result.current.state.score).toBe(0);
    expect(result.current.state.userAnswers).toHaveLength(0);
  });

  it('should clear orderedTokenIds on nextSentence', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.selectToken('1-token-0');
    });
    expect(result.current.state.orderedTokenIds).toHaveLength(1);

    act(() => {
      result.current.nextSentence();
    });

    expect(result.current.state.orderedTokenIds).toEqual([]);
  });

  it('should clear orderedTokenIds on reset', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.selectToken('1-token-0');
    });
    expect(result.current.state.orderedTokenIds).toHaveLength(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.state.orderedTokenIds).toEqual([]);
  });
});
