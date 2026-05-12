import { describe, it, expect } from 'vitest';
import { buildPersonalWordIndex, personalWordToSentence } from '../personalWordIndex';
import type { PersonalWord } from '../types';

describe('personalWordIndex', () => {
  describe('buildPersonalWordIndex', () => {
    it('creates empty index for empty array', () => {
      const index = buildPersonalWordIndex([]);

      expect(index.hasWord('hello')).toBe(false);
      expect(index.getByWord('hello')).toBeUndefined();
      expect(index.getByPrefix('hel')).toEqual([]);
      expect(index.getAllAsSentences()).toEqual([]);
    });

    it('indexes single personal word correctly', () => {
      const words: PersonalWord[] = [
        {
          word: 'hello',
          translation: '你好',
          exampleSentence: 'Say hello to everyone',
          exampleSentenceCn: '向大家问好',
          marked: true,
          markedAt: 1234567890,
        },
      ];

      const index = buildPersonalWordIndex(words);

      expect(index.hasWord('hello')).toBe(true);
      expect(index.hasWord('HELLO')).toBe(true); // case-insensitive
      expect(index.hasWord('world')).toBe(false);

      const entry = index.getByWord('hello');
      expect(entry).toBeDefined();
      expect(entry!.personalWord.word).toBe('hello');
      expect(entry!.personalWord.translation).toBe('你好');

      // Example sentence words are also indexed
      expect(index.hasWord('say')).toBe(true);
      expect(index.hasWord('everyone')).toBe(true);
    });

    it('handles duplicate words (case-insensitive)', () => {
      const words: PersonalWord[] = [
        { word: 'hello', translation: '你好', exampleSentence: 'Say hello', exampleSentenceCn: '问好', marked: false, markedAt: 0 },
        { word: 'HELLO', translation: '哈喽', exampleSentence: 'Say HELLO', exampleSentenceCn: '打招呼', marked: false, markedAt: 0 },
        { word: 'Hello', translation: '嗨', exampleSentence: 'Say Hello', exampleSentenceCn: '嗨', marked: false, markedAt: 0 },
      ];

      const index = buildPersonalWordIndex(words);

      // Last one wins
      expect(index.getByWord('hello')!.personalWord.translation).toBe('嗨');
    });

    it('getByPrefix returns correct matches', () => {
      const words: PersonalWord[] = [
        { word: 'hello', translation: '你好', exampleSentence: 'Say hello', exampleSentenceCn: '问好', marked: false, markedAt: 0 },
        { word: 'help', translation: '帮助', exampleSentence: 'I need help', exampleSentenceCn: '需要帮助', marked: false, markedAt: 0 },
        { word: 'hero', translation: '英雄', exampleSentence: 'Be a hero', exampleSentenceCn: '成为英雄', marked: false, markedAt: 0 },
        { word: 'world', translation: '世界', exampleSentence: 'Hello world', exampleSentenceCn: '你好世界', marked: false, markedAt: 0 },
      ];

      const index = buildPersonalWordIndex(words);

      const heResults = index.getByPrefix('he');
      expect(heResults.length).toBe(3); // hello, help, hero
      expect(heResults.map((r) => r.personalWord.word)).toContain('hello');
      expect(heResults.map((r) => r.personalWord.word)).toContain('help');
      expect(heResults.map((r) => r.personalWord.word)).toContain('hero');

      // "hel" matches hello and help
      const helResults = index.getByPrefix('hel');
      expect(helResults.length).toBe(2);
      expect(helResults.map((r) => r.personalWord.word).sort()).toEqual(['hello', 'help'].sort());
    });

    it('getAllAsSentences returns deduplicated sentences', () => {
      const words: PersonalWord[] = [
        { word: 'hello', translation: '你好', exampleSentence: 'Say hello', exampleSentenceCn: '问好', marked: false, markedAt: 0 },
        { word: 'help', translation: '帮助', exampleSentence: 'I need help', exampleSentenceCn: '需要帮助', marked: false, markedAt: 0 },
      ];

      const index = buildPersonalWordIndex(words);
      const sentences = index.getAllAsSentences();

      expect(sentences.length).toBe(2);
      expect(sentences.some((s) => s.blanks[0].word === 'hello')).toBe(true);
      expect(sentences.some((s) => s.blanks[0].word === 'help')).toBe(true);
    });

    it('handles words with special characters', () => {
      const words: PersonalWord[] = [
        { word: "can't", translation: '不能', exampleSentence: "I can't do it", exampleSentenceCn: '我做不到', marked: false, markedAt: 0 },
      ];

      const index = buildPersonalWordIndex(words);

      expect(index.hasWord("can't")).toBe(true);
      // Special characters are kept as-is in the word
      expect(index.hasWord("cant")).toBe(false);
    });

    it('returns example sentence words in entry', () => {
      const words: PersonalWord[] = [
        { word: 'hello', translation: '你好', exampleSentence: 'Say hello to the world', exampleSentenceCn: '向世界问好', marked: false, markedAt: 0 },
      ];

      const index = buildPersonalWordIndex(words);
      const entry = index.getByWord('hello');

      expect(entry).toBeDefined();
      expect(entry!.exampleSentenceWords).toContain('say');
      expect(entry!.exampleSentenceWords).toContain('hello');
      expect(entry!.exampleSentenceWords).toContain('world');
      expect(entry!.exampleSentenceWords).toContain('the');
    });
  });

  describe('personalWordToSentence', () => {
    it('converts personal word to sentence correctly', () => {
      const word: PersonalWord = {
        word: 'hello',
        translation: '你好',
        exampleSentence: 'Say hello to everyone',
        exampleSentenceCn: '向大家问好',
        marked: true,
        markedAt: 1234567890,
      };

      const sentence = personalWordToSentence(word, 'pw-1');

      expect(sentence.id).toBe('pw-1');
      expect(sentence.english).toBe('Say hello to everyone');
      expect(sentence.chinese).toBe('你好');
      expect(sentence.blanks).toEqual([{ word: 'hello' }]);
      expect(sentence.level).toBe('personal');
    });
  });
});