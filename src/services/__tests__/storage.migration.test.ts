import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService, type StorageSchemaV1, type StorageSchemaV2 } from '../storage';
import type { PracticeState } from '@/hooks/usePractice';
import type { PersonalWord } from '@/data/types';
import { clearDictionaryCache } from '@/data/dictionaryCache';

const SESSION_KEY = 'en-learn-session';
const PERSONAL_WORDS_KEY = 'en-learn-personal-words';

function createMockPracticeState(overrides: Partial<PracticeState> = {}): PracticeState {
  return {
    currentIndex: 0,
    userAnswers: [],
    currentInputs: ['hello'],
    showResult: false,
    isCorrect: false,
    attempts: 0,
    isComplete: false,
    score: 0,
    orderedTokenIds: [],
    ...overrides,
  };
}

// Mock the dictionary cache module
vi.mock('@/data/dictionaryCache', () => ({
  clearDictionaryCache: vi.fn(),
  getCachedDictionary: vi.fn().mockReturnValue(null),
  removeDictionaryFromCache: vi.fn(),
}));

// Mock the dictionary index module
vi.mock('@/data/dictionaryIndex', () => ({
  buildDictionaryIndex: vi.fn().mockImplementation((sentences: unknown[]) => ({
    getStats: () => ({
      totalCount: sentences.length,
      uniqueWords: 10,
      buildTimeMs: 1.5,
      byLevel: {},
    }),
  })),
}));

describe('StorageService - Migration & Index', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('V1 → V2 migration (loadSession)', () => {
    it('migrates V1 session to V2 automatically', () => {
      const session = createMockPracticeState();
      const v1Payload: StorageSchemaV1 = {
        version: 1,
        dictionaryId: 'cet4',
        session,
        timestamp: Date.now(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(v1Payload));

      const result = StorageService.loadSession();

      expect(result).not.toBeNull();
      expect(result!.version).toBe(2);
      expect(result!.dictionaryId).toBe('cet4');
      expect(result!.session).toEqual(session);
      expect(Array.isArray(result!.mistakes)).toBe(true);
    });

    it('loads V2 session directly without migration', () => {
      const session = createMockPracticeState();
      const v2Payload: StorageSchemaV2 = {
        version: 2,
        dictionaryId: 'cet4',
        session,
        timestamp: Date.now(),
        mistakes: [],
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(v2Payload));

      const result = StorageService.loadSession();

      expect(result).not.toBeNull();
      expect(result!.version).toBe(2);
      expect(result!.dictionaryId).toBe('cet4');
    });

    it('returns null for corrupted session data', () => {
      localStorage.setItem(SESSION_KEY, 'invalid-json');
      const result = StorageService.loadSession();
      expect(result).toBeNull();
    });

    it('returns null for invalid schema version', () => {
      const session = createMockPracticeState();
      const invalidPayload = {
        version: 99, // Invalid version
        dictionaryId: 'cet4',
        session,
        timestamp: Date.now(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(invalidPayload));

      const result = StorageService.loadSession();
      expect(result).toBeNull();
    });
  });

  describe('clearSession vs clearSessionWithIndex', () => {
    it('clearSession only removes session key', () => {
      const session = createMockPracticeState();
      StorageService.saveSession('cet4', session);
      expect(localStorage.getItem(SESSION_KEY)).not.toBeNull();

      StorageService.clearSession();

      expect(localStorage.getItem(SESSION_KEY)).toBeNull();
      // Other keys should still exist
      expect(localStorage.getItem('en-learn-xp-profile')).toBeNull(); // Not set yet
    });

    it('clearSessionWithIndex removes session and clears dictionary cache', () => {
      const session = createMockPracticeState();
      StorageService.saveSession('cet4', session);
      expect(localStorage.getItem(SESSION_KEY)).not.toBeNull();

      StorageService.clearSessionWithIndex();

      expect(localStorage.getItem(SESSION_KEY)).toBeNull();
      // Verify clearDictionaryCache was called via the mock
      expect(vi.mocked(clearDictionaryCache)).toHaveBeenCalled();
    });
  });

  describe('getIndexStats', () => {
    it('returns empty stats when no dictionary is loaded', () => {
      const stats = StorageService.getIndexStats();

      expect(stats).toHaveProperty('dictionary');
      expect(stats).toHaveProperty('personalWords');
      expect(stats.dictionary.totalCount).toBe(0);
      expect(stats.dictionary.uniqueWords).toBe(0);
    });

    it('returns personal word count from storage', () => {
      // Setup personal words
      const personalWords: PersonalWord[] = [
        {
          word: 'hello',
          translation: '你好',
          exampleSentence: 'Hello world',
          exampleSentenceCn: '你好世界',
          marked: true,
          markedAt: Date.now(),
        },
        {
          word: 'test',
          translation: '测试',
          exampleSentence: 'This is a test',
          exampleSentenceCn: '这是一个测试',
          marked: false,
          markedAt: Date.now(),
        },
      ];
      localStorage.setItem(PERSONAL_WORDS_KEY, JSON.stringify(personalWords));

      const stats = StorageService.getIndexStats();

      expect(stats.personalWords.totalCount).toBe(2);
    });
  });

  describe('Personal word migration (sentence example extraction)', () => {
    it('loads personal words with old format (no example sentence extraction needed)', () => {
      const personalWords: PersonalWord[] = [
        {
          word: 'hello',
          translation: '你好',
          exampleSentence: 'Hello world',
          exampleSentenceCn: '你好世界',
          marked: true,
          markedAt: Date.now(),
        },
      ];
      localStorage.setItem(PERSONAL_WORDS_KEY, JSON.stringify(personalWords));

      const loaded = StorageService.getPersonalWords();

      expect(loaded).toHaveLength(1);
      expect(loaded[0].word).toBe('hello');
    });

    it('returns empty array when no personal words exist', () => {
      const result = StorageService.getPersonalWords();
      expect(result).toEqual([]);
    });
  });
});