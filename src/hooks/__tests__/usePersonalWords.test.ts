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

      let isMarked: boolean = false;
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

      let isMarked: boolean = false;
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

      let isMarked: boolean = false;
      act(() => {
        isMarked = result.current.isMarked('orange');
      });

      expect(isMarked).toBe(false);
    });

    it('returns false for non-existent words', () => {
      const { result } = renderHook(() => usePersonalWords());

      let isMarked: boolean = false;
      act(() => {
        isMarked = result.current.isMarked('nonexistent');
      });

      expect(isMarked).toBe(false);
    });

    it('returns false after word is removed', () => {
      storage.addPersonalWord(mockWord);

      const { result } = renderHook(() => usePersonalWords());

      // First verify it's marked
      let isMarked: boolean = false;
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

      let words: PersonalWord[] = [];
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

      let words: PersonalWord[] = [];
      act(() => {
        words = result.current.getWords();
      });

      expect(words).toHaveLength(2);
      expect(words).toContainEqual(expect.objectContaining({ word: 'apple' }));
      expect(words).toContainEqual(expect.objectContaining({ word: 'banana' }));
    });
  });

  describe('toggleMark', () => {
    it('marks an unmarked word', () => {
      const { result } = renderHook(() => usePersonalWords());

      act(() => {
        result.current.toggleMark('apple', 'An apple a day.');
      });

      expect(result.current.isMarked('apple')).toBe(true);
    });

    it('unmarks a marked word', () => {
      storage.addPersonalWord(mockWord);

      const { result } = renderHook(() => usePersonalWords());

      // Verify it's marked
      act(() => {
        result.current.getWords();
      });
      expect(result.current.isMarked('apple')).toBe(true);

      // Toggle to unmark
      act(() => {
        result.current.toggleMark('apple');
      });

      expect(result.current.isMarked('apple')).toBe(false);
    });

    it('toggleMark twice returns word to original state', () => {
      const { result } = renderHook(() => usePersonalWords());

      // Initially not marked
      expect(result.current.isMarked('apple')).toBe(false);

      // Mark it
      act(() => {
        result.current.toggleMark('apple', 'Example sentence.');
      });
      expect(result.current.isMarked('apple')).toBe(true);

      // Unmark it
      act(() => {
        result.current.toggleMark('apple');
      });
      expect(result.current.isMarked('apple')).toBe(false);
    });

    it('toggleMark calls addWord with correct data for new word', () => {
      const addWordSpy = vi.spyOn(storage, 'addPersonalWord');

      const { result } = renderHook(() => usePersonalWords());

      act(() => {
        result.current.toggleMark('newWord', 'Example sentence.');
      });

      expect(addWordSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          word: 'newWord',
          marked: true,
        })
      );
    });

    it('toggleMark calls removeWord for already marked word', () => {
      storage.addPersonalWord(mockWord);
      const removeWordSpy = vi.spyOn(storage, 'removePersonalWord');

      const { result } = renderHook(() => usePersonalWords());

      act(() => {
        result.current.getWords();
      });

      act(() => {
        result.current.toggleMark('apple');
      });

      expect(removeWordSpy).toHaveBeenCalledWith('apple');
    });

    it('toggleMark without sentence parameter works correctly', () => {
      const { result } = renderHook(() => usePersonalWords());

      act(() => {
        result.current.toggleMark('apple');
      });

      expect(result.current.isMarked('apple')).toBe(true);

      // Toggle again
      act(() => {
        result.current.toggleMark('apple');
      });

      expect(result.current.isMarked('apple')).toBe(false);
    });
  });

  describe('markFromPractice', () => {
    it('adds a word with full sentence information', () => {
      const { result } = renderHook(() => usePersonalWords());

      act(() => {
        result.current.markFromPractice(
          'apple',
          '苹果',
          'I ate an apple yesterday.',
          '我昨天吃了一个苹果。'
        );
      });

      expect(result.current.isMarked('apple')).toBe(true);
      const words = result.current.getWords();
      expect(words).toHaveLength(1);
      expect(words[0]).toMatchObject({
        word: 'apple',
        translation: '苹果',
        exampleSentence: 'I ate an apple yesterday.',
        exampleSentenceCn: '我昨天吃了一个苹果。',
        marked: true,
      });
    });

    it('markFromPractice includes sentenceId when provided', () => {
      const { result } = renderHook(() => usePersonalWords());

      act(() => {
        result.current.markFromPractice(
          'banana',
          '香蕉',
          'I like bananas.',
          '我喜欢香蕉。',
          'sent-123'
        );
      });

      const words = result.current.getWords();
      expect(words[0]).toMatchObject({
        word: 'banana',
        sentenceId: 'sent-123',
      });
    });

    it('markFromPractice updates existing word with new information', () => {
      const { result } = renderHook(() => usePersonalWords());

      // First add a basic word
      act(() => {
        result.current.markFromPractice('cherry', '樱桃', 'I love cherries.', '我爱樱桃。');
      });

      // Update with new info
      act(() => {
        result.current.markFromPractice(
          'cherry',
          '车厘子', // Updated translation
          'Fresh cherries are delicious.',
          '新鲜的车厘子很好吃。'
        );
      });

      // Should still have only one word (updated)
      expect(result.current.getCount()).toBe(1);
      const words = result.current.getWords();
      expect(words[0]).toMatchObject({
        word: 'cherry',
        translation: '车厘子', // Updated translation
        exampleSentence: 'Fresh cherries are delicious.',
        exampleSentenceCn: '新鲜的车厘子很好吃。',
      });
    });

    it('markFromPractice calls storage.addPersonalWord with correct data', () => {
      const addWordSpy = vi.spyOn(storage, 'addPersonalWord');

      const { result } = renderHook(() => usePersonalWords());

      act(() => {
        result.current.markFromPractice(
          'date',
          '枣',
          'I ate a date.',
          '我吃了一颗枣。'
        );
      });

      expect(addWordSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          word: 'date',
          translation: '枣',
          exampleSentence: 'I ate a date.',
          exampleSentenceCn: '我吃了一颗枣。',
          marked: true,
        })
      );
    });

    it('markFromPractice can be called multiple times for different words', () => {
      const { result } = renderHook(() => usePersonalWords());

      act(() => {
        result.current.markFromPractice('elderberry', '接骨木果', 'Elderberry wine.', '接骨木果酒。');
      });

      act(() => {
        result.current.markFromPractice('fig', '无花果', 'Fresh figs.', '新鲜的无花果。');
      });

      expect(result.current.getCount()).toBe(2);
      expect(result.current.isMarked('elderberry')).toBe(true);
      expect(result.current.isMarked('fig')).toBe(true);
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
