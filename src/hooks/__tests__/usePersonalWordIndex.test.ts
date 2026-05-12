import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePersonalWordIndex } from '../usePersonalWordIndex';
import { storage } from '@/services/storage';
import type { PersonalWord } from '@/data/types';

// Mock storage
vi.mock('@/services/storage', () => ({
  storage: {
    getPersonalWords: vi.fn(),
  },
}));

describe('usePersonalWordIndex', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty results when no personal words exist', () => {
    vi.mocked(storage.getPersonalWords).mockReturnValue([]);

    const { result } = renderHook(() => usePersonalWordIndex());

    expect(result.current.hasWord('hello')).toBe(false);
    expect(result.current.getByWord('hello')).toBeUndefined();
    expect(result.current.getByPrefix('hel')).toEqual([]);
    expect(result.current.getAllAsSentences()).toEqual([]);
  });

  it('indexes personal words and provides O(1) lookups', () => {
    const words: PersonalWord[] = [
      { word: 'hello', translation: '你好', exampleSentence: 'Say hello', exampleSentenceCn: '问好', marked: true, markedAt: 1234567890 },
      { word: 'world', translation: '世界', exampleSentence: 'Hello world', exampleSentenceCn: '你好世界', marked: false, markedAt: 0 },
    ];
    vi.mocked(storage.getPersonalWords).mockReturnValue(words);

    const { result } = renderHook(() => usePersonalWordIndex());

    expect(result.current.hasWord('hello')).toBe(true);
    expect(result.current.hasWord('HELLO')).toBe(true); // case-insensitive
    expect(result.current.hasWord('world')).toBe(true);
    expect(result.current.hasWord('foo')).toBe(false);

    const entry = result.current.getByWord('hello');
    expect(entry).toBeDefined();
    expect(entry!.personalWord.word).toBe('hello');
  });

  it('provides prefix search functionality', () => {
    const words: PersonalWord[] = [
      { word: 'hello', translation: '你好', exampleSentence: 'Say hello', exampleSentenceCn: '问好', marked: false, markedAt: 0 },
      { word: 'help', translation: '帮助', exampleSentence: 'I need help', exampleSentenceCn: '需要帮助', marked: false, markedAt: 0 },
      { word: 'hero', translation: '英雄', exampleSentence: 'Be a hero', exampleSentenceCn: '成为英雄', marked: false, markedAt: 0 },
    ];
    vi.mocked(storage.getPersonalWords).mockReturnValue(words);

    const { result } = renderHook(() => usePersonalWordIndex());

    const heResults = result.current.getByPrefix('he');
    expect(heResults.length).toBe(3);
    expect(heResults.map((r) => r.personalWord.word).sort()).toEqual(['hello', 'help', 'hero'].sort());
  });

  it('returns all sentences for practice mode', () => {
    const words: PersonalWord[] = [
      { word: 'hello', translation: '你好', exampleSentence: 'Say hello', exampleSentenceCn: '问好', marked: false, markedAt: 0 },
      { word: 'help', translation: '帮助', exampleSentence: 'I need help', exampleSentenceCn: '需要帮助', marked: false, markedAt: 0 },
    ];
    vi.mocked(storage.getPersonalWords).mockReturnValue(words);

    const { result } = renderHook(() => usePersonalWordIndex());

    const sentences = result.current.getAllAsSentences();
    expect(sentences.length).toBe(2);
    expect(sentences.some((s) => s.blanks[0].word === 'hello')).toBe(true);
    expect(sentences.some((s) => s.blanks[0].word === 'help')).toBe(true);
  });

  it('reload returns fresh index from storage', () => {
    vi.mocked(storage.getPersonalWords).mockReturnValue([]);

    const { result } = renderHook(() => usePersonalWordIndex());

    // Initially empty
    expect(result.current.hasWord('hello')).toBe(false);

    // Simulate storage update
    vi.mocked(storage.getPersonalWords).mockReturnValue([
      { word: 'hello', translation: '你好', exampleSentence: 'Say hello', exampleSentenceCn: '问好', marked: false, markedAt: 0 },
    ]);

    // reload() returns a new index, use it to query
    const newIndex = result.current.reload();
    expect(newIndex.hasWord('hello')).toBe(true);
  });
});