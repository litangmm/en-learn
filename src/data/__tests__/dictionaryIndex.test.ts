 
import { describe, it, expect, beforeEach } from 'vitest';
import { splitIntoWords, buildDictionaryIndex, getSentenceIdsByWord, searchByQuery } from '../dictionaryIndex';
import type { Sentence } from '../types';

describe('dictionaryIndex', () => {
  describe('splitIntoWords', () => {
    it('returns empty array for empty string', () => {
      expect(splitIntoWords('')).toEqual([]);
    });

    it('returns single word for single word input', () => {
      expect(splitIntoWords('hello')).toEqual(['hello']);
    });

    it('returns multiple words for multiple word input', () => {
      expect(splitIntoWords('hello world')).toEqual(['hello', 'world']);
    });

    it('returns lowercase words for mixed case input', () => {
      expect(splitIntoWords('Hello WORLD Test')).toEqual(['hello', 'world', 'test']);
    });

    it('extracts numbers from text', () => {
      expect(splitIntoWords('abc123 def456')).toEqual(['abc123', 'def456']);
    });

    it('handles special characters by ignoring them', () => {
      expect(splitIntoWords('hello, world! how are you?')).toEqual([
        'hello',
        'world',
        'how',
        'are',
        'you',
      ]);
    });

    it('handles punctuation attached to words', () => {
      expect(splitIntoWords("it's a test, isn't it?")).toEqual([
        'it',
        's',
        'a',
        'test',
        'isn',
        't',
        'it',
      ]);
    });

    it('handles whitespace-only input', () => {
      expect(splitIntoWords('   ')).toEqual([]);
    });

    it('handles text with newlines and tabs', () => {
      expect(splitIntoWords('hello\nworld\ttest')).toEqual(['hello', 'world', 'test']);
    });
  });

  describe('buildDictionaryIndex', () => {
    it('creates empty index for empty sentences array', () => {
      const index = buildDictionaryIndex([]);

      expect(index.getById('any-id')).toBeUndefined();
      expect(index.getByWord('any')).toEqual([]);
      expect(index.getByLevel('any')).toEqual([]);
      expect(index.getStats().totalCount).toBe(0);
      expect(index.getStats().uniqueWords).toBe(0);
      expect(index.getIndexedIds()).toEqual([]);
    });

    it('indexes single sentence correctly', () => {
      const sentences: Sentence[] = [
        {
          id: 's1',
          english: 'hello world',
          chinese: '你好 世界',
          blanks: [{ word: 'hello' }],
          level: 'junior',
        },
      ];

      const index = buildDictionaryIndex(sentences);

      // Verify byId lookup
      expect(index.getById('s1')).toBe('hello world');
      expect(index.getById('nonexistent')).toBeUndefined();

      // Verify byLevel lookup
      expect(index.getByLevel('junior')).toEqual(['s1']);
      expect(index.getByLevel('senior')).toEqual([]);

      // Verify byWord lookup
      expect(index.getByWord('hello')).toEqual(['s1']);
      expect(index.getByWord('world')).toEqual(['s1']);

      // Verify getIndexedIds
      expect(index.getIndexedIds()).toEqual(['s1']);
    });

    it('indexes multiple sentences correctly', () => {
      const sentences: Sentence[] = [
        {
          id: 's1',
          english: 'hello world',
          chinese: '你好 世界',
          blanks: [{ word: 'hello' }],
          level: 'junior',
        },
        {
          id: 's2',
          english: 'good morning',
          chinese: '早上好',
          blanks: [{ word: 'morning' }],
          level: 'junior',
        },
        {
          id: 's3',
          english: 'good night',
          chinese: '晚安',
          blanks: [{ word: 'night' }],
          level: 'senior',
        },
      ];

      const index = buildDictionaryIndex(sentences);

      // Verify byId lookup for all sentences
      expect(index.getById('s1')).toBe('hello world');
      expect(index.getById('s2')).toBe('good morning');
      expect(index.getById('s3')).toBe('good night');

      // Verify byLevel grouping
      expect(index.getByLevel('junior')).toContain('s1');
      expect(index.getByLevel('junior')).toContain('s2');
      expect(index.getByLevel('junior').length).toBe(2);
      expect(index.getByLevel('senior')).toEqual(['s3']);

      // Verify word indexing - 'good' appears in both s2 and s3
      expect(index.getByWord('good')).toContain('s2');
      expect(index.getByWord('good')).toContain('s3');
      expect(index.getByWord('good').length).toBe(2);

      // Verify individual words
      expect(index.getByWord('hello')).toEqual(['s1']);
      expect(index.getByWord('world')).toEqual(['s1']);
      expect(index.getByWord('morning')).toEqual(['s2']);
      expect(index.getByWord('night')).toEqual(['s3']);

      // Verify stats
      expect(index.getStats().uniqueWords).toBeGreaterThan(0);
      expect(index.getStats().byLevel.junior).toBe(2);
      expect(index.getStats().byLevel.senior).toBe(1);
    });

    it('indexes sentences with multiple blanks', () => {
      const sentences: Sentence[] = [
        {
          id: 's1',
          english: 'the quick brown fox jumps',
          chinese: '敏捷的棕色狐狸跳',
          blanks: [
            { word: 'quick' },
            { word: 'brown' },
            { word: 'fox' },
          ],
          level: 'cet4',
        },
      ];

      const index = buildDictionaryIndex(sentences);

      // Each blank word should be indexed
      expect(index.getByWord('quick')).toEqual(['s1']);
      expect(index.getByWord('brown')).toEqual(['s1']);
      expect(index.getByWord('fox')).toEqual(['s1']);

      // Other words in sentence should also be indexed
      expect(index.getByWord('the')).toEqual(['s1']);
      expect(index.getByWord('jumps')).toEqual(['s1']);
    });

    it('tracks word positions correctly', () => {
      const sentences: Sentence[] = [
        {
          id: 's1',
          english: 'hello world hello',
          chinese: '你好 世界 你好',
          blanks: [{ word: 'hello' }],
          level: 'junior',
        },
      ];

      const index = buildDictionaryIndex(sentences);

      // Access the internal byWord map to check positions
      const entries = index.byWord.get('hello');
      expect(entries).toBeDefined();
      expect(entries!.length).toBe(1);
      expect(entries![0].sentenceId).toBe('s1');
      // 'hello' appears at positions 0 and 12 in 'hello world hello'
      expect(entries![0].wordPositions).toContain(0);
      expect(entries![0].wordPositions).toContain(12);
    });

    it('handles case insensitive word matching in blanks', () => {
      const sentences: Sentence[] = [
        {
          id: 's1',
          english: 'HELLO world',
          chinese: '你好 世界',
          blanks: [{ word: 'Hello' }],
          level: 'junior',
        },
      ];

      const index = buildDictionaryIndex(sentences);

      // Should be indexed as lowercase
      expect(index.getByWord('hello')).toEqual(['s1']);
      expect(index.getByWord('HELLO')).toEqual(['s1']);
      expect(index.getByWord('world')).toEqual(['s1']);
    });

    it('indexes words with mixed case', () => {
      const sentences: Sentence[] = [
        {
          id: 's1',
          english: 'Apple Banana apple BANANA',
          chinese: '苹果 香蕉',
          blanks: [],
          level: 'cet4',
        },
      ];

      const index = buildDictionaryIndex(sentences);

      // All should be indexed as lowercase
      expect(index.getByWord('apple')).toEqual(['s1']);
      expect(index.getByWord('APPLE')).toEqual(['s1']);
      expect(index.getByWord('banana')).toEqual(['s1']);
      expect(index.getByWord('BANANA')).toEqual(['s1']);
    });

    it('builds stats correctly', () => {
      const sentences: Sentence[] = [
        {
          id: 's1',
          english: 'hello world',
          chinese: '你好 世界',
          blanks: [{ word: 'hello' }],
          level: 'junior',
        },
        {
          id: 's2',
          english: 'good morning',
          chinese: '早上好',
          blanks: [{ word: 'morning' }],
          level: 'junior',
        },
      ];

      const index = buildDictionaryIndex(sentences);
      const stats = index.getStats();

      expect(stats.totalCount).toBeGreaterThan(0);
      expect(stats.uniqueWords).toBeGreaterThan(0);
      expect(stats.byLevel.junior).toBe(2);
      expect(stats.buildTimeMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getSentenceIdsByWord', () => {
    let index: ReturnType<typeof buildDictionaryIndex>;

    beforeEach(() => {
      const sentences: Sentence[] = [
        {
          id: 's1',
          english: 'hello world',
          chinese: '你好 世界',
          blanks: [{ word: 'hello' }],
          level: 'junior',
        },
        {
          id: 's2',
          english: 'hello there',
          chinese: '你好 那里',
          blanks: [{ word: 'there' }],
          level: 'senior',
        },
        {
          id: 's3',
          english: 'good morning',
          chinese: '早上好',
          blanks: [{ word: 'morning' }],
          level: 'cet4',
        },
      ];

      index = buildDictionaryIndex(sentences);
    });

    it('returns sentence IDs when word exists in index', () => {
      const result = getSentenceIdsByWord('hello', index);
      expect(result).toContain('s1');
      expect(result).toContain('s2');
      expect(result.length).toBe(2);
    });

    it('returns empty array when word does not exist', () => {
      const result = getSentenceIdsByWord('nonexistent', index);
      expect(result).toEqual([]);
    });

    it('performs case insensitive lookup', () => {
      expect(getSentenceIdsByWord('hello', index)).toContain('s1');
      expect(getSentenceIdsByWord('HELLO', index)).toContain('s1');
      expect(getSentenceIdsByWord('Hello', index)).toContain('s1');
    });

    it('returns correct result for single word match', () => {
      const result = getSentenceIdsByWord('morning', index);
      expect(result).toEqual(['s3']);
    });

    it('returns correct result for word that appears only once', () => {
      const result = getSentenceIdsByWord('world', index);
      expect(result).toEqual(['s1']);
    });

    it('returns empty array for empty word', () => {
      const result = getSentenceIdsByWord('', index);
      expect(result).toEqual([]);
    });

    it('handles special characters in word', () => {
      const result = getSentenceIdsByWord('!@#$', index);
      expect(result).toEqual([]);
    });

    it('matches partial words correctly', () => {
      // 'there' should match, 'the' should not match as it's not a separate word
      expect(getSentenceIdsByWord('there', index)).toEqual(['s2']);
    });
  });

  describe('edge cases', () => {
    it('handles sentence with empty blanks array', () => {
      const sentences: Sentence[] = [
        {
          id: 's1',
          english: 'just a regular sentence',
          chinese: '只是一个普通句子',
          blanks: [],
          level: 'junior',
        },
      ];

      const index = buildDictionaryIndex(sentences);
      expect(index.getById('s1')).toBe('just a regular sentence');
      expect(index.getByWord('just')).toEqual(['s1']);
    });

    it('handles blank with empty word', () => {
      const sentences: Sentence[] = [
        {
          id: 's1',
          english: 'test sentence',
          chinese: '测试句子',
          blanks: [{ word: '' }],
          level: 'junior',
        },
      ];

      const index = buildDictionaryIndex(sentences);
      expect(index.getById('s1')).toBe('test sentence');
      expect(index.getByWord('test')).toEqual(['s1']);
    });

    it('handles blank with whitespace-only word', () => {
      const sentences: Sentence[] = [
        {
          id: 's1',
          english: 'test sentence',
          chinese: '测试句子',
          blanks: [{ word: '   ' }],
          level: 'junior',
        },
      ];

      const index = buildDictionaryIndex(sentences);
      expect(index.getById('s1')).toBe('test sentence');
    });

    it('handles very long sentence', () => {
      const longText = 'word '.repeat(1000).trim();
      const sentences: Sentence[] = [
        {
          id: 's1',
          english: longText,
          chinese: '长句子',
          blanks: [],
          level: 'junior',
        },
      ];

      const index = buildDictionaryIndex(sentences);
      expect(index.getByWord('word').length).toBe(1);
      expect(index.getIndexedIds()).toEqual(['s1']);
    });

    it('handles sentence with only special characters', () => {
      const sentences: Sentence[] = [
        {
          id: 's1',
          english: '!!! ??? ...',
          chinese: '符号',
          blanks: [],
          level: 'junior',
        },
      ];

      const index = buildDictionaryIndex(sentences);
      expect(index.getStats().uniqueWords).toBe(0);
      expect(index.getIndexedIds()).toEqual(['s1']);
    });

    it('handles multiple sentences with same word at different positions', () => {
      const sentences: Sentence[] = [
        {
          id: 's1',
          english: 'the quick brown fox',
          chinese: '测试',
          blanks: [],
          level: 'junior',
        },
        {
          id: 's2',
          english: 'brown bear is big',
          chinese: '测试',
          blanks: [],
          level: 'senior',
        },
        {
          id: 's3',
          english: 'the brown dog',
          chinese: '测试',
          blanks: [],
          level: 'cet4',
        },
      ];

      const index = buildDictionaryIndex(sentences);

      // 'brown' appears in all three sentences
      const brownIds = index.getByWord('brown');
      expect(brownIds).toContain('s1');
      expect(brownIds).toContain('s2');
      expect(brownIds).toContain('s3');
      expect(brownIds.length).toBe(3);

      // 'the' appears in s1 and s3
      const theIds = index.getByWord('the');
      expect(theIds).toContain('s1');
      expect(theIds).toContain('s3');
      expect(theIds.length).toBe(2);
    });
  });

  describe('searchByQuery', () => {
    let sentences: Sentence[];
    let index: ReturnType<typeof buildDictionaryIndex>;
     
    let getByWord: (_word: string) => string[];

    beforeEach(() => {
      sentences = [
        {
          id: 's1',
          english: 'hello world',
          chinese: '你好 世界',
          blanks: [{ word: 'hello' }],
          level: 'junior',
        },
        {
          id: 's2',
          english: 'hello there',
          chinese: '你好 那里',
          blanks: [{ word: 'there' }],
          level: 'senior',
        },
        {
          id: 's3',
          english: 'good morning',
          chinese: '早上好',
          blanks: [{ word: 'morning' }],
          level: 'cet4',
        },
        {
          id: 's4',
          english: 'the quick brown fox',
          chinese: '快速的棕色狐狸',
          blanks: [{ word: 'quick' }],
          level: 'cet6',
        },
      ];
      index = buildDictionaryIndex(sentences);
      getByWord = (_word: string) => index.getByWord(_word);
    });

    it('returns all sentences for empty query', () => {
      const result = searchByQuery('', sentences, (word) => index.getByWord(word));
      expect(result).toHaveLength(4);
    });

    it('returns all sentences for whitespace-only query', () => {
      const result = searchByQuery('   ', sentences, (word) => index.getByWord(word));
      expect(result).toHaveLength(4);
    });

    it('returns sentences matching single token', () => {
      const result = searchByQuery('hello', sentences, getByWord);
      expect(result.map(s => s.id)).toContain('s1');
      expect(result.map(s => s.id)).toContain('s2');
      expect(result).toHaveLength(2);
    });

    it('returns sentences matching single token case-insensitive', () => {
      const result = searchByQuery('HELLO', sentences, getByWord);
      expect(result).toHaveLength(2);
    });

    it('returns sentences matching single token from blank word', () => {
      const result = searchByQuery('morning', sentences, getByWord);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s3');
    });

    it('returns sentences matching single token from english sentence', () => {
      const result = searchByQuery('quick', sentences, getByWord);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s4');
    });

    it('returns sentences matching single Chinese token', () => {
      const result = searchByQuery('早上好', sentences, getByWord);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s3');
    });

    it('returns sentences matching single Chinese token in mixed content', () => {
      const result = searchByQuery('你好', sentences, getByWord);
      expect(result).toHaveLength(2);
    });

    it('returns sentences matching multiple tokens with AND logic', () => {
      // 'hello' is in s1, s2; 'world' is only in s1
      // Intersection = s1
      const result = searchByQuery('hello world', sentences, getByWord);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s1');
    });

    it('returns empty array when no sentence matches all tokens', () => {
      const result = searchByQuery('hello morning', sentences, getByWord);
      expect(result).toHaveLength(0);
    });

    it('returns empty array for non-existent token', () => {
      const result = searchByQuery('nonexistent', sentences, getByWord);
      expect(result).toHaveLength(0);
    });

    it('handles multiple whitespace-separated tokens', () => {
      // 'quick brown' - s4 has both
      const result = searchByQuery('quick brown', sentences, getByWord);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s4');
    });

    it('handles mixed English and Chinese tokens', () => {
      // 'hello 你好' - s1 has both, s2 also has both ("hello" in english, "你好" in chinese)
      const result = searchByQuery('hello 你好', sentences, getByWord);
      expect(result).toHaveLength(2);
      expect(result.map(s => s.id)).toContain('s1');
      expect(result.map(s => s.id)).toContain('s2');
    });

    it('escapes special regex characters in token', () => {
      // Tokens like "morning." should not cause regex errors
      // "morning." → stripped to "morning" for index, but exact regex "morning\\." doesn't match "morning"
      const result = searchByQuery('morning.', sentences, getByWord);
      expect(result).toHaveLength(0);
    });

    it('handles token with dots by stripping non-alphanumeric for index', () => {
      // "v.i.p." → stripped to "vip" for index lookup
      // Index stores 'v', 'i', 'p' separately, not 'vip' → no index match
      // Falls back to all sentences, then exact regex "v.i.p." matches "v.i.p." in english
      const sentencesWithDot: Sentence[] = [
        {
          id: 's1',
          english: 'v.i.p.',
          chinese: '贵宾',
          blanks: [{ word: 'v.i.p.' }],
          level: 'junior',
        },
      ];
      const idx = buildDictionaryIndex(sentencesWithDot);
      const result = searchByQuery('v.i.p.', sentencesWithDot, (w) => idx.getByWord(w));
      expect(result).toHaveLength(1);
    });

    it('handles token with parentheses by stripping for index lookup', () => {
      // "stop (verb)" → stripped to "stopverb" for index → not in index
      // Falls back to all sentences, then exact regex "stop \\(verb\\)" matches "stop (verb)"
      const sentencesWithParens: Sentence[] = [
        {
          id: 's1',
          english: 'stop (verb)',
          chinese: '停止',
          blanks: [{ word: 'stop' }],
          level: 'junior',
        },
      ];
      const idx = buildDictionaryIndex(sentencesWithParens);
      const result = searchByQuery('stop (verb)', sentencesWithParens, (w) => idx.getByWord(w));
      expect(result).toHaveLength(1);
    });

    it('returns correct results for single word match in blank', () => {
      const result = searchByQuery('there', sentences, getByWord);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s2');
    });

    it('returns empty array for empty sentence array', () => {
      const result = searchByQuery('hello', [], getByWord);
      expect(result).toHaveLength(0);
    });

    it('searches across all fields for ambiguous tokens', () => {
      // If token could be in blank, english, or chinese, matches any
      const result = searchByQuery('the', sentences, getByWord);
      // s4 has 'the' in english text
      expect(result.some(s => s.id === 's4')).toBe(true);
    });

    it('handles many tokens with AND logic', () => {
      // 'the quick' - only s4 has both
      const result = searchByQuery('the quick', sentences, getByWord);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('s4');
    });

    it('returns empty when English token has no index match and no text match', () => {
      // 'xyzzy 你好' - 'xyzzy' not in index, falls back to all sentences
      // then exact regex "xyzzy" doesn't match any sentence text
      const result = searchByQuery('xyzzy 你好', sentences, getByWord);
      expect(result).toHaveLength(0); // "xyzzy" not in any sentence field
    });
  });
});
