import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService, storage, type PersistedSession } from '../storage';
import type { PracticeState } from '@/hooks/usePractice';

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

      const parsed = JSON.parse(raw!) as PersistedSession;
      expect(parsed.version).toBe(1);
      expect(parsed.dictionaryId).toBe('dict-1');
      expect(parsed.session).toEqual(session);
      expect(typeof parsed.timestamp).toBe('number');
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
      const setItemSpy = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new Error('QuotaExceededError');
        });

      const session = createMockPracticeState();
      StorageService.saveSession('dict-1', session);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[StorageService] Failed to save session:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
      setItemSpy.mockRestore();
    });
  });

  describe('loadSession', () => {
    it('returns parsed data', () => {
      const session = createMockPracticeState();
      const payload: PersistedSession = {
        version: 1,
        dictionaryId: 'dict-1',
        session,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));

      const result = StorageService.loadSession();
      expect(result).not.toBeNull();
      expect(result!.version).toBe(1);
      expect(result!.dictionaryId).toBe('dict-1');
      expect(result!.session).toEqual(session);
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
});
