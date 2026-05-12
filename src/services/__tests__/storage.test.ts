import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService, storage, type StorageSchemaV1, type StorageSchemaV2 } from '../storage';
import type { PracticeState } from '@/hooks/usePractice';
// Import the mock control from vitest.setup.ts
import { __mockLocalStorage__ } from '../../../vitest.setup';

const STORAGE_KEY = 'en-learn-session';

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

describe('StorageService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('saveSession', () => {
    it('stores data correctly', () => {
      const session = createMockPracticeState();
      StorageService.saveSession('dict-1', session);

      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).not.toBeNull();

      const parsed = JSON.parse(raw!) as StorageSchemaV2;
      expect(parsed.version).toBe(2);
      expect(parsed.dictionaryId).toBe('dict-1');
      expect(parsed.session).toEqual(session);
      expect(typeof parsed.timestamp).toBe('number');
      expect(parsed.mistakes).toEqual([]);
    });

    it('clears storage when session.isComplete is true', () => {
      const incompleteSession = createMockPracticeState({ isComplete: false });
      StorageService.saveSession('dict-1', incompleteSession);
      expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

      const completeSession = createMockPracticeState({ isComplete: true });
      StorageService.saveSession('dict-1', completeSession);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('handles quota exceeded gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // Enable the mock's throw behavior
      __mockLocalStorage__.storage.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const session = createMockPracticeState();
      StorageService.saveSession('dict-1', session);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[StorageService] Failed to save session:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
      // Restore the mock to its original implementation
      __mockLocalStorage__.storage.setItem.mockImplementation((key: string, value: string) => {
        __mockLocalStorage__.mock.setItem(key, value);
      });
    });
  });

  describe('loadSession', () => {
    it('returns parsed data', () => {
      const session = createMockPracticeState();
      const payload: StorageSchemaV1 = {
        version: 1,
        dictionaryId: 'dict-1',
        session,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

      const result = StorageService.loadSession();
      expect(result).not.toBeNull();
      expect(result!.version).toBe(2);
      expect(result!.dictionaryId).toBe('dict-1');
      expect(result!.session).toEqual(session);
      expect(result!.mistakes).toEqual([]);
    });

    it('returns null when no data', () => {
      const result = StorageService.loadSession();
      expect(result).toBeNull();
    });

    it('returns null on corrupted JSON', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem(STORAGE_KEY, 'not valid json');

      const result = StorageService.loadSession();
      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[StorageService] Corrupted session data, clearing'
      );

      consoleWarnSpy.mockRestore();
    });

    it('returns null on missing required fields', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1 }));

      const result = StorageService.loadSession();
      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[StorageService] Invalid session schema, clearing'
      );

      consoleWarnSpy.mockRestore();
    });

    it('returns null on version mismatch', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          version: 99,
          dictionaryId: 'dict-1',
          session: createMockPracticeState(),
          timestamp: Date.now(),
        })
      );

      const result = StorageService.loadSession();
      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[StorageService] Invalid session schema, clearing'
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('clearSession', () => {
    it('removes data', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1 }));
      StorageService.clearSession();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });

  describe('hasActiveSession', () => {
    it('returns true for incomplete session', () => {
      const session = createMockPracticeState({ isComplete: false });
      StorageService.saveSession('dict-1', session);
      expect(StorageService.hasActiveSession()).toBe(true);
    });

    it('returns false for complete session', () => {
      const session = createMockPracticeState({ isComplete: true });
      StorageService.saveSession('dict-1', session);
      expect(StorageService.hasActiveSession()).toBe(false);
    });

    it('returns false when no session', () => {
      expect(StorageService.hasActiveSession()).toBe(false);
    });
  });

  describe('getStoredDictionaryId', () => {
    it('returns correct id', () => {
      const session = createMockPracticeState();
      StorageService.saveSession('dict-abc', session);
      expect(StorageService.getStoredDictionaryId()).toBe('dict-abc');
    });

    it('returns null when no session', () => {
      expect(StorageService.getStoredDictionaryId()).toBeNull();
    });
  });

  describe('storage singleton', () => {
    it('exports the same StorageService object', () => {
      expect(storage).toBe(StorageService);
    });
  });

  describe('PersonalDictionary CRUD', () => {
    const PERSONAL_DICTIONARY_KEY = 'en-learn-personal-dictionary';

    it('getPersonalDictionary returns null when no data', () => {
      localStorage.removeItem(PERSONAL_DICTIONARY_KEY);
      expect(StorageService.getPersonalDictionary()).toBeNull();
    });

    it('savePersonalDictionary stores data', () => {
      const pd = { activeSentenceIds: ['pw-0', 'pw-1'], lastPracticedAt: Date.now() };
      StorageService.savePersonalDictionary(pd);

      const raw = localStorage.getItem(PERSONAL_DICTIONARY_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.activeSentenceIds).toEqual(['pw-0', 'pw-1']);
    });

    it('getPersonalDictionary returns stored data', () => {
      const pd = { activeSentenceIds: ['pw-0'], lastPracticedAt: 1234567890 };
      localStorage.setItem(PERSONAL_DICTIONARY_KEY, JSON.stringify(pd));

      const result = StorageService.getPersonalDictionary();
      expect(result).not.toBeNull();
      expect(result!.activeSentenceIds).toEqual(['pw-0']);
      expect(result!.lastPracticedAt).toBe(1234567890);
    });

    it('getPersonalDictionary returns null for corrupted data', () => {
      localStorage.setItem(PERSONAL_DICTIONARY_KEY, 'not valid json');
      expect(StorageService.getPersonalDictionary()).toBeNull();
    });

    it('getPersonalDictionary returns null for invalid schema', () => {
      localStorage.setItem(PERSONAL_DICTIONARY_KEY, JSON.stringify({ wrong: 'schema' }));
      expect(StorageService.getPersonalDictionary()).toBeNull();
    });

    it('updatePersonalDictionary updates existing state', () => {
      const initial = { activeSentenceIds: ['pw-0'], lastPracticedAt: null };
      localStorage.setItem(PERSONAL_DICTIONARY_KEY, JSON.stringify(initial));

      const updated = StorageService.updatePersonalDictionary((prev) => ({
        ...prev,
        lastPracticedAt: Date.now(),
      }));

      expect(updated.lastPracticedAt).not.toBeNull();
      expect(updated.activeSentenceIds).toEqual(['pw-0']);
    });

    it('updatePersonalDictionary creates default when no data', () => {
      localStorage.removeItem(PERSONAL_DICTIONARY_KEY);

      const updated = StorageService.updatePersonalDictionary((prev) => ({
        ...prev,
        activeSentenceIds: ['pw-new'],
      }));

      expect(updated.activeSentenceIds).toEqual(['pw-new']);
      expect(updated.lastPracticedAt).toBeNull();
    });
  });
});
