import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService } from '../storage';
import type { SessionHistory } from '@/data/types';

const HISTORY_KEY = 'en-learn-history';

function createMockHistory(overrides: Partial<SessionHistory> = {}): SessionHistory {
  return {
    id: 'test-id-1',
    timestamp: Date.now(),
    duration: 120,
    dictionaryId: 'cet4',
    dictionaryName: 'CET-4',
    score: 85,
    totalQuestions: 10,
    correctCount: 8,
    accuracy: 80,
    ...overrides,
  };
}

describe('StorageService History', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('addHistory', () => {
    it('adds a new history entry', () => {
      const entry = createMockHistory({ id: 'id-1' });
      StorageService.addHistory(entry);

      const history = StorageService.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('id-1');
      expect(history[0].dictionaryName).toBe('CET-4');
    });

    it('prepends new entries (most recent first)', () => {
      StorageService.addHistory(createMockHistory({ id: 'id-1', timestamp: 1000 }));
      StorageService.addHistory(createMockHistory({ id: 'id-2', timestamp: 2000 }));

      const history = StorageService.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].id).toBe('id-2');
      expect(history[1].id).toBe('id-1');
    });

    it('truncates to 100 entries when exceeding limit', () => {
      for (let i = 0; i < 105; i++) {
        StorageService.addHistory(createMockHistory({ id: `id-${i}` }));
      }

      const history = StorageService.getHistory();
      expect(history).toHaveLength(100);
      expect(history[0].id).toBe('id-104');
      expect(history[99].id).toBe('id-5');
    });
  });

  describe('getHistory', () => {
    it('returns empty array when no history', () => {
      expect(StorageService.getHistory()).toEqual([]);
    });

    it('returns all stored history entries', () => {
      StorageService.addHistory(createMockHistory({ id: 'id-1' }));
      StorageService.addHistory(createMockHistory({ id: 'id-2' }));

      const history = StorageService.getHistory();
      expect(history).toHaveLength(2);
    });

    it('filters out invalid history entries', () => {
      localStorage.setItem(
        HISTORY_KEY,
        JSON.stringify([
          { id: 'valid', timestamp: 1, duration: 1, dictionaryId: 'd', dictionaryName: 'D', score: 0, totalQuestions: 1, correctCount: 0, accuracy: 0 },
          { invalid: true },
          { id: 'valid2', timestamp: 2, duration: 2, dictionaryId: 'd', dictionaryName: 'D', score: 0, totalQuestions: 1, correctCount: 0, accuracy: 0 },
        ])
      );

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const history = StorageService.getHistory();
      expect(history).toHaveLength(2);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[StorageService] Some history entries were invalid and filtered out'
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('clearHistory', () => {
    it('removes all history', () => {
      StorageService.addHistory(createMockHistory({ id: 'id-1' }));
      StorageService.addHistory(createMockHistory({ id: 'id-2' }));

      StorageService.clearHistory();

      expect(StorageService.getHistory()).toEqual([]);
      expect(localStorage.getItem(HISTORY_KEY)).toBeNull();
    });
  });

  describe('getHistoryCount', () => {
    it('returns 0 when no history', () => {
      expect(StorageService.getHistoryCount()).toBe(0);
    });

    it('returns correct count', () => {
      StorageService.addHistory(createMockHistory({ id: 'id-1' }));
      StorageService.addHistory(createMockHistory({ id: 'id-2' }));

      expect(StorageService.getHistoryCount()).toBe(2);
    });
  });

  describe('corrupted history data', () => {
    it('returns empty array and clears on corrupted JSON', () => {
      localStorage.setItem(HISTORY_KEY, 'not valid json');

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const history = StorageService.getHistory();
      expect(history).toEqual([]);
      expect(localStorage.getItem(HISTORY_KEY)).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[StorageService] Corrupted history data, clearing'
      );
      consoleWarnSpy.mockRestore();
    });

    it('returns empty array and clears on non-array data', () => {
      localStorage.setItem(HISTORY_KEY, JSON.stringify({ foo: 'bar' }));

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const history = StorageService.getHistory();
      expect(history).toEqual([]);
      expect(localStorage.getItem(HISTORY_KEY)).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[StorageService] Invalid history schema, clearing'
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('history and session isolation', () => {
    it('clearSession does not affect history', () => {
      StorageService.addHistory(createMockHistory({ id: 'id-1' }));
      StorageService.saveSession('dict-1', {
        currentIndex: 0,
        userAnswers: [],
        currentInputs: [],
        showResult: false,
        isCorrect: false,
        attempts: 0,
        isComplete: false,
        score: 0,
      });

      StorageService.clearSession();

      expect(StorageService.getHistory()).toHaveLength(1);
    });

    it('clearHistory does not affect session or mistakes', () => {
      StorageService.addHistory(createMockHistory({ id: 'id-1' }));
      StorageService.saveSession('dict-1', {
        currentIndex: 0,
        userAnswers: [],
        currentInputs: [],
        showResult: false,
        isCorrect: false,
        attempts: 0,
        isComplete: false,
        score: 0,
      });

      StorageService.clearHistory();

      expect(StorageService.getHistory()).toEqual([]);
      // Session should still exist
      expect(StorageService.loadSession()).not.toBeNull();
    });
  });
});
