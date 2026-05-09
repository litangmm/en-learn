import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService } from '../storage';
import type { Mistake } from '@/data/types';

const SESSION_KEY = 'en-learn-session';
const MISTAKES_KEY = 'en-learn-mistakes';

function createMockMistake(overrides: Partial<Mistake> = {}): Mistake {
  return {
    sentenceId: 's1',
    wrongAnswers: ['wrong'],
    correctAnswers: ['correct'],
    attempts: 2,
    timestamp: Date.now(),
    dictionaryId: 'dict-a',
    reviewedCount: 0,
    ...overrides,
  };
}

describe('StorageService Mistakes', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('V1 to V2 backward compatibility', () => {
    it('loads V1 session data and exposes empty mistakes', () => {
      const v1Payload = {
        version: 1,
        dictionaryId: 'dict-1',
        session: {
          currentIndex: 0,
          userAnswers: [],
          currentInputs: ['hello'],
          showResult: false,
          isCorrect: false,
          attempts: 0,
          isComplete: false,
          score: 0,
        },
        timestamp: Date.now(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(v1Payload));

      const result = StorageService.loadSession();
      expect(result).not.toBeNull();
      expect(result!.version).toBe(2);
      expect(result!.dictionaryId).toBe('dict-1');
      expect(result!.mistakes).toEqual([]);
    });

    it('saves session as V2 with empty mistakes when no prior mistakes exist', () => {
      const session = {
        currentIndex: 0,
        userAnswers: [],
        currentInputs: ['test'],
        showResult: false,
        isCorrect: false,
        attempts: 0,
        isComplete: false,
        score: 0,
      };
      StorageService.saveSession('dict-1', session);

      const raw = localStorage.getItem(SESSION_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.version).toBe(2);
      expect(parsed.mistakes).toEqual([]);
    });
  });

  describe('addMistake', () => {
    it('adds a new mistake', () => {
      const mistake = createMockMistake({ sentenceId: 's1' });
      StorageService.addMistake(mistake);

      const mistakes = StorageService.getMistakes();
      expect(mistakes).toHaveLength(1);
      expect(mistakes[0].sentenceId).toBe('s1');
    });

    it('updates existing mistake instead of duplicating', () => {
      const mistake1 = createMockMistake({
        sentenceId: 's1',
        wrongAnswers: ['old-wrong'],
        attempts: 1,
        timestamp: 1000,
      });
      StorageService.addMistake(mistake1);

      const mistake2 = createMockMistake({
        sentenceId: 's1',
        wrongAnswers: ['new-wrong'],
        attempts: 3,
        timestamp: 2000,
      });
      StorageService.addMistake(mistake2);

      const mistakes = StorageService.getMistakes();
      expect(mistakes).toHaveLength(1);
      expect(mistakes[0].wrongAnswers).toEqual(['new-wrong']);
      expect(mistakes[0].attempts).toBe(3);
      expect(mistakes[0].timestamp).toBe(2000);
    });

    it('preserves reviewedCount when updating existing mistake', () => {
      const mistake1 = createMockMistake({
        sentenceId: 's1',
        reviewedCount: 2,
      });
      StorageService.addMistake(mistake1);

      const mistake2 = createMockMistake({
        sentenceId: 's1',
        wrongAnswers: ['different'],
        reviewedCount: 0, // should be ignored
      });
      StorageService.addMistake(mistake2);

      const mistakes = StorageService.getMistakes();
      expect(mistakes[0].reviewedCount).toBe(2);
    });

    it('stores multiple mistakes for different sentences', () => {
      StorageService.addMistake(createMockMistake({ sentenceId: 's1' }));
      StorageService.addMistake(createMockMistake({ sentenceId: 's2' }));
      StorageService.addMistake(createMockMistake({ sentenceId: 's3' }));

      const mistakes = StorageService.getMistakes();
      expect(mistakes).toHaveLength(3);
    });
  });

  describe('getMistakes', () => {
    it('returns empty array when no mistakes', () => {
      expect(StorageService.getMistakes()).toEqual([]);
    });

    it('returns all stored mistakes', () => {
      StorageService.addMistake(createMockMistake({ sentenceId: 's1' }));
      StorageService.addMistake(createMockMistake({ sentenceId: 's2' }));

      const mistakes = StorageService.getMistakes();
      expect(mistakes).toHaveLength(2);
    });

    it('filters out invalid mistake entries', () => {
      localStorage.setItem(
        MISTAKES_KEY,
        JSON.stringify([
          { sentenceId: 's1', wrongAnswers: ['w'], correctAnswers: ['c'], attempts: 1, timestamp: 1, dictionaryId: 'd', reviewedCount: 0 },
          { invalid: true },
          { sentenceId: 's2', wrongAnswers: ['w'], correctAnswers: ['c'], attempts: 1, timestamp: 1, dictionaryId: 'd', reviewedCount: 0 },
        ])
      );

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mistakes = StorageService.getMistakes();
      expect(mistakes).toHaveLength(2);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[StorageService] Some mistakes were invalid and filtered out'
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('removeMistake', () => {
    it('removes a mistake by sentenceId', () => {
      StorageService.addMistake(createMockMistake({ sentenceId: 's1' }));
      StorageService.addMistake(createMockMistake({ sentenceId: 's2' }));

      StorageService.removeMistake('s1');

      const mistakes = StorageService.getMistakes();
      expect(mistakes).toHaveLength(1);
      expect(mistakes[0].sentenceId).toBe('s2');
    });

    it('does nothing when sentenceId not found', () => {
      StorageService.addMistake(createMockMistake({ sentenceId: 's1' }));

      StorageService.removeMistake('nonexistent');

      expect(StorageService.getMistakes()).toHaveLength(1);
    });
  });

  describe('clearMistakes', () => {
    it('removes all mistakes', () => {
      StorageService.addMistake(createMockMistake({ sentenceId: 's1' }));
      StorageService.addMistake(createMockMistake({ sentenceId: 's2' }));

      StorageService.clearMistakes();

      expect(StorageService.getMistakes()).toEqual([]);
    });
  });

  describe('getMistakeCount', () => {
    it('returns 0 when no mistakes', () => {
      expect(StorageService.getMistakeCount()).toBe(0);
    });

    it('returns correct count', () => {
      StorageService.addMistake(createMockMistake({ sentenceId: 's1' }));
      StorageService.addMistake(createMockMistake({ sentenceId: 's2' }));

      expect(StorageService.getMistakeCount()).toBe(2);
    });
  });

  describe('incrementReviewedCount', () => {
    it('increments reviewed count for existing mistake', () => {
      StorageService.addMistake(createMockMistake({ sentenceId: 's1', reviewedCount: 0 }));

      StorageService.incrementReviewedCount('s1');

      expect(StorageService.getMistakes()[0].reviewedCount).toBe(1);
    });

    it('does nothing when sentenceId not found', () => {
      StorageService.addMistake(createMockMistake({ sentenceId: 's1' }));

      StorageService.incrementReviewedCount('nonexistent');

      expect(StorageService.getMistakes()[0].reviewedCount).toBe(0);
    });
  });

  describe('corrupted mistakes data', () => {
    it('returns empty array and clears on corrupted JSON', () => {
      localStorage.setItem(MISTAKES_KEY, 'not valid json');

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mistakes = StorageService.getMistakes();
      expect(mistakes).toEqual([]);
      expect(localStorage.getItem(MISTAKES_KEY)).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[StorageService] Corrupted mistakes data, clearing'
      );
      consoleWarnSpy.mockRestore();
    });

    it('returns empty array and clears on non-array data', () => {
      localStorage.setItem(MISTAKES_KEY, JSON.stringify({ foo: 'bar' }));

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mistakes = StorageService.getMistakes();
      expect(mistakes).toEqual([]);
      expect(localStorage.getItem(MISTAKES_KEY)).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[StorageService] Invalid mistakes schema, clearing'
      );
      consoleWarnSpy.mockRestore();
    });
  });

  describe('session and mistakes isolation', () => {
    it('clearSession does not affect mistakes', () => {
      StorageService.addMistake(createMockMistake({ sentenceId: 's1' }));
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

      expect(StorageService.getMistakes()).toHaveLength(1);
    });

    it('saveSession preserves existing mistakes', () => {
      StorageService.addMistake(createMockMistake({ sentenceId: 's1' }));

      StorageService.saveSession('dict-1', {
        currentIndex: 0,
        userAnswers: [],
        currentInputs: ['hello'],
        showResult: false,
        isCorrect: false,
        attempts: 0,
        isComplete: false,
        score: 0,
      });

      const raw = localStorage.getItem(SESSION_KEY);
      const parsed = JSON.parse(raw!);
      expect(parsed.mistakes).toHaveLength(1);
    });
  });
});
