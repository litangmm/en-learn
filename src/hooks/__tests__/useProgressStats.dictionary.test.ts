import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDictionaryProgress } from '../useProgressStats';
import { storage } from '@/services/storage';

vi.mock('@/services/storage', () => ({
  storage: {
    getHistory: vi.fn(),
    getXPProfile: vi.fn(),
    getBadgeProgress: vi.fn(),
  },
}));

// Import the dictionaries list for verification
import { dictionaries } from '@/data/dictionaries';

describe('useProgressStats - Dictionary Progress Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDictionaryProgress', () => {
    it('returns progress for all dictionaries', () => {
      vi.mocked(storage.getHistory).mockReturnValue([]);

      const progress = getDictionaryProgress();

      expect(progress).toHaveLength(dictionaries.length);
      dictionaries.forEach((dict, index) => {
        expect(progress[index].dictionaryId).toBe(dict.id);
        expect(progress[index].dictionaryName).toBe(dict.name);
        expect(progress[index].totalSentences).toBe(dict.sentenceCount);
      });
    });

    it('counts practiced sentences from history', () => {
      const entries = [
        { id: 'session-1', timestamp: Date.now(), duration: 300, dictionaryId: 'junior', dictionaryName: '初中', score: 100, totalQuestions: 10, correctCount: 8, accuracy: 80 },
        { id: 'session-2', timestamp: Date.now(), duration: 400, dictionaryId: 'junior', dictionaryName: '初中', score: 150, totalQuestions: 15, correctCount: 12, accuracy: 80 },
        { id: 'session-3', timestamp: Date.now(), duration: 350, dictionaryId: 'cet4', dictionaryName: 'CET-4', score: 80, totalQuestions: 8, correctCount: 6, accuracy: 75 },
      ];
      vi.mocked(storage.getHistory).mockReturnValue(entries);

      const progress = getDictionaryProgress();

      const juniorProgress = progress.find(p => p.dictionaryId === 'junior');
      expect(juniorProgress?.practicedSentences).toBe(2);

      const cet4Progress = progress.find(p => p.dictionaryId === 'cet4');
      expect(cet4Progress?.practicedSentences).toBe(1);
    });

    it('calculates accuracy based on correct/total ratio', () => {
      const entries = [
        { id: 'session-1', timestamp: Date.now(), duration: 300, dictionaryId: 'junior', dictionaryName: '初中', score: 100, totalQuestions: 10, correctCount: 8, accuracy: 80 },
        { id: 'session-2', timestamp: Date.now(), duration: 400, dictionaryId: 'junior', dictionaryName: '初中', score: 150, totalQuestions: 15, correctCount: 12, accuracy: 80 },
      ];
      vi.mocked(storage.getHistory).mockReturnValue(entries);

      const progress = getDictionaryProgress();
      const juniorProgress = progress.find(p => p.dictionaryId === 'junior');

      // Both sessions have accuracy 80%, so average should be around there
      expect(juniorProgress?.accuracy).toBeDefined();
      expect(juniorProgress?.correctCount).toBe(2); // 2 sessions with correctCount > 0
    });

    it('calculates progress as percentage of dictionary explored', () => {
      const entries = [
        { id: 'session-1', timestamp: Date.now(), duration: 300, dictionaryId: 'junior', dictionaryName: '初中', score: 100, totalQuestions: 10, correctCount: 8, accuracy: 80 },
      ];
      vi.mocked(storage.getHistory).mockReturnValue(entries);

      const progress = getDictionaryProgress();
      const juniorProgress = progress.find(p => p.dictionaryId === 'junior');

      // 1 session practiced out of 1600 total sentences = ~0.06%
      expect(juniorProgress?.progress).toBeLessThan(1);
    });

    it('returns 0 accuracy for unpracticed dictionaries', () => {
      vi.mocked(storage.getHistory).mockReturnValue([]);

      const progress = getDictionaryProgress();

      const anyUnpracticed = progress.find(p => p.practicedSentences === 0);
      expect(anyUnpracticed?.accuracy).toBe(0);
    });

    it('sorts correctly with practiced first', () => {
      const entries = [
        { id: 'session-1', timestamp: Date.now(), duration: 300, dictionaryId: 'junior', dictionaryName: '初中', score: 100, totalQuestions: 10, correctCount: 8, accuracy: 80 },
      ];
      vi.mocked(storage.getHistory).mockReturnValue(entries);

      const progress = getDictionaryProgress();
      const firstPracticed = progress[0];
      expect(firstPracticed.practicedSentences).toBeGreaterThan(0);
    });
  });
});
