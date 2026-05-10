import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService, type ExportData } from '../storage';
import type { Mistake, SessionHistory } from '@/data/types';

function createMockPracticeState(overrides: Record<string, unknown> = {}) {
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

describe('StorageService Export/Import', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('exportAllData', () => {
    it('returns correct structure with version and exportedAt', () => {
      const result = StorageService.exportAllData();

      expect(result.version).toBe(1);
      expect(typeof result.exportedAt).toBe('string');
      expect(result.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(result.data).toBeDefined();
    });

    it('includes session data when available', () => {
      const session = createMockPracticeState();
      StorageService.saveSession('dict-1', session);

      const result = StorageService.exportAllData();
      expect(result.data.session).not.toBeNull();
      expect(result.data.session!.dictionaryId).toBe('dict-1');
    });

    it('includes null session when no active session', () => {
      const result = StorageService.exportAllData();
      expect(result.data.session).toBeNull();
    });

    it('includes mistakes', () => {
      StorageService.addMistake(createMockMistake({ sentenceId: 's1' }));
      StorageService.addMistake(createMockMistake({ sentenceId: 's2' }));

      const result = StorageService.exportAllData();
      expect(result.data.mistakes).toHaveLength(2);
    });

    it('includes history', () => {
      StorageService.addHistory(createMockHistory({ id: 'h1' }));
      StorageService.addHistory(createMockHistory({ id: 'h2' }));

      const result = StorageService.exportAllData();
      expect(result.data.history).toHaveLength(2);
    });

    it('returns empty arrays when no data exists', () => {
      const result = StorageService.exportAllData();
      expect(result.data.mistakes).toEqual([]);
      expect(result.data.history).toEqual([]);
      expect(result.data.session).toBeNull();
    });
  });

  describe('importAllData', () => {
    it('imports valid data and overwrites existing data', () => {
      // Set up existing data
      StorageService.saveSession('old-dict', createMockPracticeState());
      StorageService.addMistake(createMockMistake({ sentenceId: 'old' }));
      StorageService.addHistory(createMockHistory({ id: 'old' }));

      const importPayload: ExportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          session: {
            version: 2,
            dictionaryId: 'new-dict',
            session: createMockPracticeState(),
            timestamp: Date.now(),
            mistakes: [],
          },
          mistakes: [createMockMistake({ sentenceId: 'new' })],
          history: [createMockHistory({ id: 'new' })],
        },
      };

      const result = StorageService.importAllData(importPayload);

      expect(result.success).toBe(true);
      expect(result.importedCounts.session).toBe(1);
      expect(result.importedCounts.mistakes).toBe(1);
      expect(result.importedCounts.history).toBe(1);
      expect(result.importedCounts.xpProfile).toBe(0);

      // Verify data was overwritten
      expect(StorageService.loadSession()!.dictionaryId).toBe('new-dict');
      expect(StorageService.getMistakes()).toHaveLength(1);
      expect(StorageService.getMistakes()[0].sentenceId).toBe('new');
      expect(StorageService.getHistory()).toHaveLength(1);
      expect(StorageService.getHistory()[0].id).toBe('new');
    });

    it('handles null session in import', () => {
      const importPayload: ExportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          session: null,
          mistakes: [],
          history: [],
        },
      };

      StorageService.saveSession('dict-1', createMockPracticeState());

      const result = StorageService.importAllData(importPayload);

      expect(result.success).toBe(true);
      expect(result.importedCounts.session).toBe(0);
      expect(StorageService.loadSession()).toBeNull();
    });

    it('handles empty data gracefully', () => {
      const importPayload: ExportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          session: null,
          mistakes: [],
          history: [],
        },
      };

      const result = StorageService.importAllData(importPayload);

      expect(result.success).toBe(true);
      expect(result.message).toContain('不含任何数据');
      expect(result.importedCounts).toEqual({ session: 0, mistakes: 0, history: 0, xpProfile: 0, dailyChallenges: 0, badgeProgress: 0, badges: 0, personalWords: 0 });
    });

    it('rejects missing version', () => {
      const result = StorageService.importAllData({
        exportedAt: new Date().toISOString(),
        data: { session: null, mistakes: [], history: [] },
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('格式无效');
    });

    it('rejects wrong version', () => {
      const result = StorageService.importAllData({
        version: 2,
        exportedAt: new Date().toISOString(),
        data: { session: null, mistakes: [], history: [] },
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('格式无效');
    });

    it('rejects missing data field', () => {
      const result = StorageService.importAllData({
        version: 1,
        exportedAt: new Date().toISOString(),
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('格式无效');
    });

    it('rejects corrupted session sub-structure', () => {
      const result = StorageService.importAllData({
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          session: { invalid: true },
          mistakes: [],
          history: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('格式无效');
    });

    it('rejects corrupted mistakes sub-structure', () => {
      const result = StorageService.importAllData({
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          session: null,
          mistakes: [{ invalid: true }],
          history: [],
        },
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('格式无效');
    });

    it('rejects corrupted history sub-structure', () => {
      const result = StorageService.importAllData({
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          session: null,
          mistakes: [],
          history: [{ invalid: true }],
        },
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain('格式无效');
    });

    it('rejects non-object input', () => {
      expect(StorageService.importAllData(null).success).toBe(false);
      expect(StorageService.importAllData(undefined).success).toBe(false);
      expect(StorageService.importAllData('string').success).toBe(false);
      expect(StorageService.importAllData(123).success).toBe(false);
      expect(StorageService.importAllData([]).success).toBe(false);
    });

    it('rejects missing exportedAt', () => {
      const result = StorageService.importAllData({
        version: 1,
        data: { session: null, mistakes: [], history: [] },
      });

      expect(result.success).toBe(false);
    });

    it('returns correct message for mixed import', () => {
      const importPayload: ExportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: {
          session: null,
          mistakes: [createMockMistake({ sentenceId: 'm1' }), createMockMistake({ sentenceId: 'm2' })],
          history: [createMockHistory({ id: 'h1' })],
        },
      };

      const result = StorageService.importAllData(importPayload);

      expect(result.success).toBe(true);
      expect(result.message).toContain('2 条错题');
      expect(result.message).toContain('1 条历史记录');
    });
  });
});
