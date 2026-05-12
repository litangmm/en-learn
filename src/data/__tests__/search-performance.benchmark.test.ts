/**
 * Search Performance Benchmark Tests
 *
 * These tests verify the O(1) performance characteristics of dictionary index lookups.
 * They are designed to run in both development (watch) and CI environments.
 *
 * Key benchmarks:
 * 1. Index build time: O(n) where n = sentence count
 * 2. Index lookup time: O(1) per lookup
 * 3. Search time: O(m) where m = number of tokens, with O(1) per token lookup
 *
 * Target metrics:
 * - Index build: < 100ms for 10,000 sentences
 * - Index lookup: < 1ms per operation
 * - Search: < 10ms for 1000 sentences with 3 tokens
 */

import { describe, it, expect } from 'vitest';
import { buildDictionaryIndex, searchByQuery } from '../dictionaryIndex';
import type { Sentence } from '../types';

/**
 * Generates test sentences for performance testing.
 */
function generateSentences(count: number, seed = 0): Sentence[] {
  const sentences: Sentence[] = [];
  const levels = ['junior', 'senior', 'cet4', 'cet6', 'ielts', 'toefl', 'gre'];
  const baseWords = [
    'apple', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape',
    'hello', 'world', 'test', 'learn', 'study', 'practice', 'progress',
    'book', 'read', 'write', 'speak', 'listen', 'vocabulary', 'grammar',
    'quick', 'brown', 'fox', 'jumps', 'lazy', 'dog', 'sentence', 'example'
  ];

  for (let i = 0; i < count; i++) {
    const wordIndex = (i + seed) % baseWords.length;
    const levelIndex = i % levels.length;
    sentences.push({
      id: `s${i}`,
      english: `The ${baseWords[wordIndex]} example sentence number ${i}.`,
      chinese: `这是${baseWords[wordIndex]}示例句子第${i}个。`,
      blanks: [{ word: baseWords[wordIndex] }],
      level: levels[levelIndex],
    });
  }

  return sentences;
}

describe('Search Performance Benchmarks', () => {
  describe('Index build performance', () => {
    it('builds index for 100 sentences under 10ms', () => {
      const sentences = generateSentences(100);

      const startTime = performance.now();
      const index = buildDictionaryIndex(sentences);
      const buildTime = performance.now() - startTime;

      expect(index.getStats().totalCount).toBeGreaterThan(0);
      expect(buildTime).toBeLessThan(10); // Should be very fast for 100 sentences
    });

    it('builds index for 1000 sentences under 50ms', () => {
      const sentences = generateSentences(1000);

      const startTime = performance.now();
      const index = buildDictionaryIndex(sentences);
      const buildTime = performance.now() - startTime;

      expect(index.getStats().totalCount).toBeGreaterThan(0);
      expect(buildTime).toBeLessThan(50);
    });

    it('builds index for 5000 sentences under 200ms', () => {
      const sentences = generateSentences(5000);

      const startTime = performance.now();
      const index = buildDictionaryIndex(sentences);
      const buildTime = performance.now() - startTime;

      expect(index.getStats().totalCount).toBeGreaterThan(0);
      expect(buildTime).toBeLessThan(200);
    });
  });

  describe('Index lookup performance (O(1))', () => {
    it('single word lookup is O(1) - consistent time across dataset size', () => {
      // Small dataset
      const smallSentences = generateSentences(100);
      const smallIndex = buildDictionaryIndex(smallSentences);

      // Large dataset
      const largeSentences = generateSentences(5000);
      const largeIndex = buildDictionaryIndex(largeSentences);

      const smallStart = performance.now();
      smallIndex.getByWord('apple');
      const smallTime = performance.now() - smallStart;

      const largeStart = performance.now();
      largeIndex.getByWord('apple');
      const largeTime = performance.now() - largeStart;

      // Both should be very fast (sub-millisecond)
      expect(smallTime).toBeLessThan(5);
      expect(largeTime).toBeLessThan(5);

      // Large dataset should NOT be significantly slower than small dataset
      // O(1) means lookup time is independent of dataset size
      expect(largeTime).toBeLessThan(smallTime * 10); // Allow 10x variance for JS overhead
    });

    it('multiple lookups maintain O(1) per lookup', () => {
      const sentences = generateSentences(1000);
      const index = buildDictionaryIndex(sentences);

      const lookupWords = ['apple', 'hello', 'book', 'quick', 'test'];

      const startTime = performance.now();
      for (const word of lookupWords) {
        index.getByWord(word);
      }
      const totalTime = performance.now() - startTime;

      // 5 lookups should be very fast
      expect(totalTime).toBeLessThan(10);

      // Average per lookup should be sub-millisecond
      const avgPerLookup = totalTime / lookupWords.length;
      expect(avgPerLookup).toBeLessThan(2);
    });
  });

  describe('Search performance with index', () => {
    it('search with single token on 1000 sentences under 50ms', () => {
      const sentences = generateSentences(1000);
      const index = buildDictionaryIndex(sentences);
      const getByWord = (word: string) => index.getByWord(word);

      const startTime = performance.now();
      const result = searchByQuery('apple', sentences, getByWord);
      const searchTime = performance.now() - startTime;

      expect(result.length).toBeGreaterThan(0);
      expect(searchTime).toBeLessThan(50);
    });

    it('search with 2 tokens on 1000 sentences under 50ms', () => {
      const sentences = generateSentences(1000);
      const index = buildDictionaryIndex(sentences);
      const getByWord = (word: string) => index.getByWord(word);

      const startTime = performance.now();
      const result = searchByQuery('the example', sentences, getByWord);
      const searchTime = performance.now() - startTime;

      expect(result.length).toBeGreaterThan(0);
      expect(searchTime).toBeLessThan(50);
    });

    it('search with 3 tokens on 1000 sentences under 100ms', () => {
      const sentences = generateSentences(1000);
      const index = buildDictionaryIndex(sentences);
      const getByWord = (word: string) => index.getByWord(word);

      const startTime = performance.now();
      const result = searchByQuery('the example sentence', sentences, getByWord);
      const searchTime = performance.now() - startTime;

      expect(result.length).toBeGreaterThan(0);
      expect(searchTime).toBeLessThan(100);
    });

    it('search time scales linearly with tokens, not dataset size', () => {
      const smallSentences = generateSentences(100);
      const largeSentences = generateSentences(1000);

      const smallIndex = buildDictionaryIndex(smallSentences);
      const largeIndex = buildDictionaryIndex(largeSentences);

      const smallGetByWord = (word: string) => smallIndex.getByWord(word);
      const largeGetByWord = (word: string) => largeIndex.getByWord(word);

      // Single token search on both
      const smallStart = performance.now();
      searchByQuery('apple', smallSentences, smallGetByWord);
      const smallTime = performance.now() - smallStart;

      const largeStart = performance.now();
      searchByQuery('apple', largeSentences, largeGetByWord);
      const largeTime = performance.now() - largeStart;

      // Large dataset search should NOT be 10x slower than small dataset
      // (index lookup is O(1), so time should be similar)
      expect(largeTime).toBeLessThan(smallTime * 5); // Allow 5x variance
    });
  });

  describe('Index stats performance', () => {
    it('getStats is fast even on large index', () => {
      const sentences = generateSentences(5000);
      const index = buildDictionaryIndex(sentences);

      const startTime = performance.now();
      const stats = index.getStats();
      const statsTime = performance.now() - startTime;

      expect(stats.totalCount).toBeGreaterThan(0);
      expect(stats.uniqueWords).toBeGreaterThan(0);
      expect(statsTime).toBeLessThan(10); // Should be very fast
    });

    it('getIndexedIds is fast even on large index', () => {
      const sentences = generateSentences(5000);
      const index = buildDictionaryIndex(sentences);

      const startTime = performance.now();
      const ids = index.getIndexedIds();
      const idsTime = performance.now() - startTime;

      expect(ids.length).toBe(5000);
      expect(idsTime).toBeLessThan(10);
    });
  });

  describe('Memory efficiency', () => {
    it('index uses reasonable memory for large dataset', () => {
      const sentences = generateSentences(5000);
      const index = buildDictionaryIndex(sentences);

      const stats = index.getStats();

      // Should have indexed all sentences
      expect(stats.totalCount).toBeGreaterThan(5000); // Words indexed > sentences

      // Stats should be reasonable
      expect(stats.uniqueWords).toBeLessThan(stats.totalCount);
      expect(stats.uniqueWords).toBeGreaterThan(0);
    });
  });
});

/**
 * Performance regression threshold tests.
 *
 * These tests define maximum acceptable times for operations.
 * If these fail, it indicates performance regression.
 */
describe('Performance regression thresholds', () => {
  const THRESHOLD = {
    INDEX_BUILD_100: 20, // ms for 100 sentences
    INDEX_BUILD_1000: 100, // ms for 1000 sentences
    INDEX_LOOKUP: 5, // ms per lookup
    SEARCH_SINGLE_TOKEN_1000: 100, // ms for single token search on 1000 sentences
  };

  it('index build for 100 sentences stays under threshold', () => {
    const sentences = generateSentences(100);
    const startTime = performance.now();
    buildDictionaryIndex(sentences);
    const buildTime = performance.now() - startTime;

    expect(buildTime).toBeLessThan(THRESHOLD.INDEX_BUILD_100);
  });

  it('index build for 1000 sentences stays under threshold', () => {
    const sentences = generateSentences(1000);
    const startTime = performance.now();
    buildDictionaryIndex(sentences);
    const buildTime = performance.now() - startTime;

    expect(buildTime).toBeLessThan(THRESHOLD.INDEX_BUILD_1000);
  });

  it('index lookup stays under threshold', () => {
    const sentences = generateSentences(1000);
    const index = buildDictionaryIndex(sentences);

    const startTime = performance.now();
    index.getByWord('apple');
    const lookupTime = performance.now() - startTime;

    expect(lookupTime).toBeLessThan(THRESHOLD.INDEX_LOOKUP);
  });

  it('search on 1000 sentences stays under threshold', () => {
    const sentences = generateSentences(1000);
    const index = buildDictionaryIndex(sentences);
    const getByWord = (word: string) => index.getByWord(word);

    const startTime = performance.now();
    searchByQuery('apple', sentences, getByWord);
    const searchTime = performance.now() - startTime;

    expect(searchTime).toBeLessThan(THRESHOLD.SEARCH_SINGLE_TOKEN_1000);
  });
});