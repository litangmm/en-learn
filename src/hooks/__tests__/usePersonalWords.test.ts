import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersonalWords } from '../usePersonalWords';
import { storage } from '@/services/storage';
import type { PersonalWord } from '@/data/types';

describe('usePersonalWords', () => {
  const mockWord: PersonalWord = {
    word: 'apple',
    translation: '苹果',
    exampleSentence: 'I ate an apple yesterday.',
    exampleSentenceCn: '我昨天吃了一个苹果。',
    marked: true,
    markedAt: Date.now(),
  };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('lazy loading', () => {
    it('does not load words from storage until first access', () => {
      const getPersonalWordsSpy = vi.spyOn(storage, 'getPersonalWords');

      const { result } = renderHook(() => usePersonalWords());

      // Trigger first access via getCount to trigger lazy load
      act(() => {
        result.current.getCount();
      });

      // getPersonalWords should be called only when needed (on first access)
      expect(getPersonalWordsSpy).toHaveBeenCalled();
    });

    it('loads words on first getWords access', () => {
      storage.addPersonalWord(mockWord);
      const getPersonalWordsSpy = vi.spyOn(storage, 'getPersonalWords');

      const { result } = renderHook(() => usePersonalWords());

      act(() => {
        result.current.getWords();
      });

      expect(getPersonalWordsSpy).toHaveBeenCalled();
    });

    it('loads words on first getCount access', () => {
      storage.addPersonalWord(mockWord);

      const { result } = renderHook(() => usePersonalWords());

      act(() => {
        result.current.getCount();
      });

      // Should have loaded the word
      expect(result.current.getCount()).toBe(1);
    });

    it('loads words on first isMarked access', () => {
      storage.addPersonalWord(mockWord);

      const { result } = renderHook(() => usePersonalWords());

      let isMarked: boolean;
      act(() => {
        isMarked = result.current.isMarked('apple');
      });

      expect(isMarked).toBe(true);
    });
  });

  describe('addWord', () => {
    it('adds a word and updates state', () => {
      const { result } = renderHook(() => usePersonalWords());

      act(() => {
        result.current.addWord(mockWord);
      });

      expect(result.current.getWords()).toContainEqual(expect.objectContaining({ word: 'apple' }));
      expect(result.current.getCount()).toBe(1);
    });

    it('addWord triggers storage save', () => {
      const addPersonalWordSpy = vi.spyOn(storage, 'addPersonalWord');

      const { result } = renderHook(() => usePersonalWords());

      act(() => {
        result.current.addWord(mockWord);
      });

      expect(addPersonalWordSpy).toHaveBeenCalledWith(mockWord);
    });

    it('addWord with same word updates existing entry', () => {
      const { result } = renderHook(() => usePersonalWords());

      act(() => {
        result.current.addWord(mockWord);
      });

      const updatedWord: PersonalWord = {
        ...mockWord,
        translation: '更新后的苹果',
      };

      act(() => {
        result.current.addWord(updatedWord);
      });

      // Should still have only one word (updated)
      expect(result.current.getCount()).toBe(1);
      expect(result.current.getWords()[0].translation).toBe('更新后的苹果');
    });
  });

  describe('removeWord', () => {
    it('removes a word and updates state', () => {
      storage.addPersonalWord(mockWord);

      const { result } = renderHook(() => usePersonalWords());

      // Trigger initial load
      act(() => {
        result.current.getWords();
      });

      act(() => {
        result.current.removeWord('apple');
      });

      expect(result.current.getWords()).not.toContainEqual(expect.objectContaining({ word: 'apple' }));
      expect(result.current.getCount()).toBe(0);
    });

    it('removeWord triggers storage removal', () => {
      storage.addPersonalWord(mockWord);
      const removePersonalWordSpy = vi.spyOn(storage, 'removePersonalWord');

      const { result } = renderHook(() => usePersonalWords());

      act(() => {
        result.current.removeWord('apple');
      });

      expect(removePersonalWordSpy).toHaveBeenCalledWith('apple');
    });

    it('removeWord with non-existent word does not throw', () => {
      const { result } = renderHook(() => usePersonalWords());

      expect(() => {
        act(() => {
          result.current.removeWord('nonexistent');
        });
      }).not.toThrow();
    });
  });

  describe('isMarked', () => {
    it('returns true for marked words', () => {
      storage.addPersonalWord(mockWord);

      const { result } = renderHook(() => usePersonalWords());

      let isMarked: boolean;
      act(() => {
        isMarked = result.current.isMarked('apple');
      });

      expect(isMarked).toBe(true);
    });

    it('returns false for unmarked words', () => {
      const unmarkedWord: PersonalWord = {
        ...mockWord,
        word: 'orange',
        marked: false,
        markedAt: 0,
      };
      storage.addPersonalWord(unmarkedWord);

      const { result } = renderHook(() => usePersonalWords());

      let isMarked: boolean;
      act(() => {
        isMarked = result.current.isMarked('orange');
      });

      expect(isMarked).toBe(false);
    });

    it('returns false for non-existent words', () => {
      const { result } = renderHook(() => usePersonalWords());

      let isMarked: boolean;
      act(() => {
        isMarked = result.current.isMarked('nonexistent');
      });

      expect(isMarked).toBe(false);
    });

    it('returns false after word is removed', () => {
      storage.addPersonalWord(mockWord);

      const { result } = renderHook(() => usePersonalWords());

      // First verify it's marked
      let isMarked: boolean;
      act(() => {
        isMarked = result.current.isMarked('apple');
      });
      expect(isMarked).toBe(true);

      // Remove the word
      act(() => {
        result.current.removeWord('apple');
      });

      // Verify it's no longer marked
      act(() => {
        isMarked = result.current.isMarked('apple');
      });
      expect(isMarked).toBe(false);
    });
  });

  describe('getCount', () => {
    it('returns 0 for empty storage', () => {
      const { result } = renderHook(() => usePersonalWords());

      act(() => {
        result.current.getCount();
      });

      expect(result.current.getCount()).toBe(0);
    });

    it('returns correct count after adding words', () => {
      const { result } = renderHook(() => usePersonalWords());

      act(() => {
        result.current.addWord(mockWord);
      });

      act(() => {
        result.current.addWord({
          word: 'banana',
          translation: '香蕉',
          exampleSentence: 'I like bananas.',
          exampleSentenceCn: '我喜欢香蕉。',
          marked: true,
          markedAt: Date.now(),
        });
      });

      expect(result.current.getCount()).toBe(2);
    });

    it('returns correct count after removing words', () => {
      storage.addPersonalWord(mockWord);
      storage.addPersonalWord({
        word: 'banana',
        translation: '香蕉',
        exampleSentence: 'I like bananas.',
        exampleSentenceCn: '我喜欢香蕉。',
        marked: true,
        markedAt: Date.now(),
      });

      const { result } = renderHook(() => usePersonalWords());

      act(() => {
        result.current.getCount();
      });

      act(() => {
        result.current.removeWord('apple');
      });

      expect(result.current.getCount()).toBe(1);
    });
  });

  describe('getWords', () => {
    it('returns empty array initially', () => {
      const { result } = renderHook(() => usePersonalWords());

      let words: PersonalWord[];
      act(() => {
        words = result.current.getWords();
      });

      expect(words).toEqual([]);
    });

    it('returns all personal words', () => {
      const word1: PersonalWord = {
        word: 'apple',
        translation: '苹果',
        exampleSentence: 'I ate an apple.',
        exampleSentenceCn: '我吃了一个苹果。',
        marked: true,
        markedAt: Date.now(),
      };

      const word2: PersonalWord = {
        word: 'banana',
        translation: '香蕉',
        exampleSentence: 'I like bananas.',
        exampleSentenceCn: '我喜欢香蕉。',
        marked: false,
        markedAt: 0,
      };

      storage.addPersonalWord(word1);
      storage.addPersonalWord(word2);

      const { result } = renderHook(() => usePersonalWords());

      let words: PersonalWord[];
      act(() => {
        words = result.current.getWords();
      });

      expect(words).toHaveLength(2);
      expect(words).toContainEqual(expect.objectContaining({ word: 'apple' }));
      expect(words).toContainEqual(expect.objectContaining({ word: 'banana' }));
    });
  });

  describe('duplicate handling', () => {
    it('adding same word twice does not create duplicates', () => {
      const { result } = renderHook(() => usePersonalWords());

      act(() => {
        result.current.addWord(mockWord);
      });

      act(() => {
        result.current.addWord(mockWord);
      });

      expect(result.current.getCount()).toBe(1);
    });

    it('updating same word updates the entry instead of adding duplicate', () => {
      const { result } = renderHook(() => usePersonalWords());

      act(() => {
        result.current.addWord(mockWord);
      });

      const updatedWord: PersonalWord = {
        ...mockWord,
        translation: '更新后的翻译',
      };

      act(() => {
        result.current.addWord(updatedWord);
      });

      expect(result.current.getCount()).toBe(1);
      expect(result.current.getWords()[0].translation).toBe('更新后的翻译');
    });
  });
});
