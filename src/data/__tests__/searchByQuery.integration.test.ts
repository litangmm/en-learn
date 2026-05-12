 
import { describe, it, expect, beforeEach } from 'vitest';
import { buildDictionaryIndex, searchByQuery } from '../dictionaryIndex';
import type { Sentence } from '../types';

/**
 * Integration tests for searchByQuery with dictionary index.
 *
 * These tests verify the end-to-end search pipeline:
 * 1. Build dictionary index from sentences
 * 2. Use getByWord() to get candidate IDs (O(1) lookup)
 * 3. Pass candidates to searchByQuery for exact matching
 *
 * Tests cover:
 * - Index lookup integration (getByWord → searchByQuery)
 * - Multi-token AND search via index
 * - Index fallback when no matches
 * - Performance characteristics (O(1) lookups)
 * - Edge cases (empty index, partial matches, etc.)
 */
describe('searchByQuery integration with dictionary index', () => {
  // Large dataset for performance testing
  const createLargeDataset = (count: number): Sentence[] => {
    const sentences: Sentence[] = [];
    const levels = ['junior', 'senior', 'cet4', 'cet6', 'ielts', 'toefl', 'gre'];
    const words = [
      'apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape',
      'hello', 'world', 'test', 'learn', 'study', 'practice', 'progress',
      'book', 'read', 'write', 'speak', 'listen', 'vocabulary', 'grammar'
    ];

    for (let i = 0; i < count; i++) {
      const word = words[i % words.length];
      const level = levels[i % levels.length];
      sentences.push({
        id: `s${i}`,
        english: `The ${word} example sentence number ${i}.`,
        chinese: `这是${word}示例句子第${i}个。`,
        blanks: [{ word }],
        level,
      });
    }
    return sentences;
  };

  describe('Index lookup integration', () => {
    let sentences: Sentence[];
     
    let getByWord: (_word: string) => string[];

    beforeEach(() => {
      sentences = [
        {
          id: 's1',
          english: 'The early bird catches the worm.',
          chinese: '早起的鸟儿有虫吃。',
          blanks: [{ word: 'catches' }],
          level: 'cet4',
        },
        {
          id: 's2',
          english: 'Actions speak louder than words.',
          chinese: '行动胜于言辞。',
          blanks: [{ word: 'Actions' }],
          level: 'cet4',
        },
        {
          id: 's3',
          english: 'Time and tide wait for no man.',
          chinese: '时不我待。',
          blanks: [{ word: 'tide' }],
          level: 'cet6',
        },
        {
          id: 's4',
          english: 'Practice makes perfect.',
          chinese: '熟能生巧。',
          blanks: [{ word: 'Practice' }],
          level: 'junior',
        },
      ];

      const index = buildDictionaryIndex(sentences);
      getByWord = (_word: string) => index.getByWord(_word);
    });

    it('uses index for single word lookup', () => {
      // 'catches' appears in s1's blank
      const result = searchByQuery('catches', sentences, getByWord);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s1');
    });

    it('uses index for word in english text', () => {
      // 'early' appears in s1's english text
      const result = searchByQuery('early', sentences, getByWord);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s1');
    });

    it('uses index for multiple words (AND logic)', () => {
      // 'early' in s1's english, 'bird' in s1's english
      const result = searchByQuery('early bird', sentences, getByWord);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s1');
    });

    it('returns empty when no index match', () => {
      // 'xyzzy' not in any sentence
      const result = searchByQuery('xyzzy', sentences, getByWord);
      expect(result).toHaveLength(0);
    });
  });

  describe('Index fallback behavior', () => {
    it('falls back to scanning when index has no matches for English token', () => {
      const sentences: Sentence[] = [
        {
          id: 's1',
          english: 'The quick brown fox.',
          chinese: '快速的棕色狐狸。',
          blanks: [],
          level: 'cet4',
        },
      ];

      const index = buildDictionaryIndex(sentences);
      // 'xyzzy' not in index, should fall back to scanning
      const getByWord = (_word: string) => index.getByWord(_word);

      const result = searchByQuery('xyzzy', sentences, getByWord);
      // No match in any text field
      expect(result).toHaveLength(0);
    });

    it('falls back to scanning and finds partial match', () => {
      const sentences: Sentence[] = [
        {
          id: 's1',
          english: 'The quick brown fox.',
          chinese: '快速的棕色狐狸。',
          blanks: [],
          level: 'cet4',
        },
      ];

      const index = buildDictionaryIndex(sentences);
      const getByWord = (_word: string) => index.getByWord(_word);

      // 'brown' is in the sentence text
      const result = searchByQuery('brown', sentences, getByWord);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s1');
    });

    it('intersects index results with text match', () => {
      const sentences: Sentence[] = [
        {
          id: 's1',
          english: 'The quick brown fox.',
          chinese: '快速的棕色狐狸。',
          blanks: [],
          level: 'cet4',
        },
        {
          id: 's2',
          english: 'The slow green turtle.',
          chinese: '慢速的绿色乌龟。',
          blanks: [],
          level: 'cet4',
        },
      ];

      const index = buildDictionaryIndex(sentences);
      const getByWord = (_word: string) => index.getByWord(_word);

      // 'quick' in s1, 'green' in s2 → no intersection
      const result = searchByQuery('quick green', sentences, getByWord);
      expect(result).toHaveLength(0);
    });
  });

  describe('Performance characteristics', () => {
    it('maintains O(1) lookup for single word search on large dataset', () => {
      const sentences = createLargeDataset(1000);
      const index = buildDictionaryIndex(sentences);
      const getByWord = (_word: string) => index.getByWord(_word);

      const startTime = performance.now();
      const result = searchByQuery('apple', sentences, getByWord);
      const duration = performance.now() - startTime;

      // Should find ~77 matches (1000 / 13 words)
      expect(result.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100); // Should be fast even for large dataset
    });

    it('maintains O(1) lookup for multi-token search on large dataset', () => {
      const sentences = createLargeDataset(1000);
      const index = buildDictionaryIndex(sentences);
      const getByWord = (_word: string) => index.getByWord(_word);

      const startTime = performance.now();
      const result = searchByQuery('the example', sentences, getByWord);
      const duration = performance.now() - startTime;

      // Should find matches with both tokens
      expect(result.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(100);
    });

    it('index lookup is consistent across multiple calls', () => {
      const sentences = createLargeDataset(100);
      const index = buildDictionaryIndex(sentences);
      const getByWord = (_word: string) => index.getByWord(_word);

      const results1 = searchByQuery('apple', sentences, getByWord);
      const results2 = searchByQuery('apple', sentences, getByWord);

      // Should return same results consistently
      expect(results1.length).toBe(results2.length);
      expect(results1.map(s => s.id)).toEqual(results2.map(s => s.id));
    });
  });

  describe('Edge cases with index', () => {
    it('handles empty index (no sentences)', () => {
      const index = buildDictionaryIndex([]);
      const getByWord = (_word: string) => index.getByWord(_word);

      const result = searchByQuery('hello', [], getByWord);
      expect(result).toHaveLength(0);
    });

    it('handles sentence with empty blanks', () => {
      const sentences: Sentence[] = [
        {
          id: 's1',
          english: 'No blanks here.',
          chinese: '这里没有空格。',
          blanks: [],
          level: 'cet4',
        },
      ];

      const index = buildDictionaryIndex(sentences);
      const getByWord = (_word: string) => index.getByWord(_word);

      // 'blanks' is in the english text
      const result = searchByQuery('blanks', sentences, getByWord);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s1');
    });

    it('handles sentence with multiple blanks', () => {
      const sentences: Sentence[] = [
        {
          id: 's1',
          english: 'The quick brown fox jumps.',
          chinese: '敏捷的棕色狐狸跳。',
          blanks: [
            { word: 'quick' },
            { word: 'brown' },
            { word: 'fox' },
          ],
          level: 'cet4',
        },
      ];

      const index = buildDictionaryIndex(sentences);
      const getByWord = (_word: string) => index.getByWord(_word);

      // Each blank word is indexed
      expect(searchByQuery('quick', sentences, getByWord)).toHaveLength(1);
      expect(searchByQuery('brown', sentences, getByWord)).toHaveLength(1);
      expect(searchByQuery('fox', sentences, getByWord)).toHaveLength(1);

      // Multi-token: all three blanks
      const result = searchByQuery('quick fox', sentences, getByWord);
      expect(result).toHaveLength(1);
    });

    it('handles case-insensitive index lookup', () => {
      const sentences: Sentence[] = [
        {
          id: 's1',
          english: 'HELLO world',
          chinese: '你好 世界',
          blanks: [{ word: 'Hello' }],
          level: 'cet4',
        },
      ];

      const index = buildDictionaryIndex(sentences);
      const getByWord = (_word: string) => index.getByWord(_word);

      // All case variations should find the sentence
      expect(searchByQuery('hello', sentences, getByWord)).toHaveLength(1);
      expect(searchByQuery('HELLO', sentences, getByWord)).toHaveLength(1);
      expect(searchByQuery('Hello', sentences, getByWord)).toHaveLength(1);
    });

    it('handles word with special characters', () => {
      const sentences: Sentence[] = [
        {
          id: 's1',
          english: "It's a test, isn't it?",
          chinese: '这是一个测试，不是吗？',
          blanks: [{ word: "isn't" }],
          level: 'cet4',
        },
      ];

      const index = buildDictionaryIndex(sentences);
      const getByWord = (_word: string) => index.getByWord(_word);

      // Index strips non-alphanumeric for lookup
      const result = searchByQuery("isn't", sentences, getByWord);
      expect(result).toHaveLength(1);
    });
  });

  describe('Index stats integration', () => {
    it('index stats reflect indexed words correctly', () => {
      const sentences: Sentence[] = [
        {
          id: 's1',
          english: 'hello world',
          chinese: '你好',
          blanks: [{ word: 'hello' }],
          level: 'cet4',
        },
        {
          id: 's2',
          english: 'good morning',
          chinese: '早上好',
          blanks: [{ word: 'morning' }],
          level: 'cet6',
        },
      ];

      const index = buildDictionaryIndex(sentences);
      const stats = index.getStats();

      // Should have indexed words from english text and blanks
      expect(stats.uniqueWords).toBeGreaterThan(0);
      expect(stats.totalCount).toBeGreaterThan(0);
      expect(stats.byLevel.cet4).toBe(1);
      expect(stats.byLevel.cet6).toBe(1);
    });
  });
});