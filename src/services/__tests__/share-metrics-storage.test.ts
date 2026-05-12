import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storage } from '../storage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Share Metrics Storage', () => {
  const SHARE_METRICS_KEY = 'en-learn-share-metrics';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getShareMetrics', () => {
    it('returns empty metrics when no data exists', () => {
      const metrics = storage.getShareMetrics();

      expect(metrics.totalShareCount).toBe(0);
      expect(metrics.formatCounts.text).toBe(0);
      expect(metrics.formatCounts.image).toBe(0);
      expect(metrics.typeCounts).toEqual({});
      expect(metrics.lastShareAt).toBeNull();
      expect(metrics.firstShareAt).toBeNull();
    });

    it('returns stored metrics when data exists', () => {
      const storedMetrics = {
        totalShareCount: 5,
        formatCounts: { text: 3, image: 2 },
        typeCounts: { 'result-modal': 4, 'levelup-toast': 1 },
        lastShareAt: 1704067200000,
        firstShareAt: 1704000000000,
      };
      localStorage.setItem(SHARE_METRICS_KEY, JSON.stringify(storedMetrics));

      const metrics = storage.getShareMetrics();

      expect(metrics.totalShareCount).toBe(5);
      expect(metrics.formatCounts.text).toBe(3);
      expect(metrics.formatCounts.image).toBe(2);
      expect(metrics.typeCounts['result-modal']).toBe(4);
      expect(metrics.typeCounts['levelup-toast']).toBe(1);
      expect(metrics.lastShareAt).toBe(1704067200000);
      expect(metrics.firstShareAt).toBe(1704000000000);
    });

    it('resets corrupted data', () => {
      localStorage.setItem(SHARE_METRICS_KEY, 'invalid json');

      const metrics = storage.getShareMetrics();

      expect(metrics.totalShareCount).toBe(0);
      expect(localStorage.getItem(SHARE_METRICS_KEY)).toBeNull();
    });
  });

  describe('initShareMetrics', () => {
    it('initializes empty metrics when not exists', () => {
      expect(localStorage.getItem(SHARE_METRICS_KEY)).toBeNull();

      storage.initShareMetrics();

      const metrics = JSON.parse(localStorage.getItem(SHARE_METRICS_KEY)!);
      expect(metrics.totalShareCount).toBe(0);
      expect(metrics.formatCounts.text).toBe(0);
      expect(metrics.formatCounts.image).toBe(0);
    });

    it('does not overwrite existing metrics', () => {
      const existingMetrics = {
        totalShareCount: 10,
        formatCounts: { text: 5, image: 5 },
        typeCounts: { 'result-modal': 10 },
        lastShareAt: 1704067200000,
        firstShareAt: 1704000000000,
      };
      localStorage.setItem(SHARE_METRICS_KEY, JSON.stringify(existingMetrics));

      storage.initShareMetrics();

      const metrics = JSON.parse(localStorage.getItem(SHARE_METRICS_KEY)!);
      expect(metrics.totalShareCount).toBe(10);
    });
  });

  describe('updateShareMetrics', () => {
    it('increments totalShareCount', () => {
      const result = storage.updateShareMetrics((prev) => ({
        totalShareCount: prev.totalShareCount + 1,
      }));

      expect(result.totalShareCount).toBe(1);
    });

    it('increments text format count', () => {
      const result = storage.updateShareMetrics((prev) => ({
        formatCounts: {
          text: prev.formatCounts.text + 1,
          image: prev.formatCounts.image,
        },
      }));

      expect(result.formatCounts.text).toBe(1);
      expect(result.formatCounts.image).toBe(0);
    });

    it('increments image format count', () => {
      const result = storage.updateShareMetrics((prev) => ({
        formatCounts: {
          text: prev.formatCounts.text,
          image: prev.formatCounts.image + 1,
        },
      }));

      expect(result.formatCounts.text).toBe(0);
      expect(result.formatCounts.image).toBe(1);
    });

    it('increments type counts', () => {
      const result = storage.updateShareMetrics((prev) => ({
        typeCounts: {
          ...prev.typeCounts,
          'result-modal': (prev.typeCounts['result-modal'] || 0) + 1,
        },
      }));

      expect(result.typeCounts['result-modal']).toBe(1);
    });

    it('accumulates type counts across multiple updates', () => {
      storage.updateShareMetrics((prev) => ({
        typeCounts: {
          ...prev.typeCounts,
          'result-modal': (prev.typeCounts['result-modal'] || 0) + 1,
        },
      }));

      const result = storage.updateShareMetrics((prev) => ({
        typeCounts: {
          ...prev.typeCounts,
          'result-modal': (prev.typeCounts['result-modal'] || 0) + 1,
          'levelup-toast': (prev.typeCounts['levelup-toast'] || 0) + 1,
        },
      }));

      expect(result.typeCounts['result-modal']).toBe(2);
      expect(result.typeCounts['levelup-toast']).toBe(1);
    });

    it('updates lastShareAt timestamp', () => {
      const now = Date.now();
      const result = storage.updateShareMetrics(() => ({
        lastShareAt: now,
      }));

      expect(result.lastShareAt).toBe(now);
    });

    it('sets firstShareAt only on first share', () => {
      const now = Date.now();

      const result1 = storage.updateShareMetrics(() => ({
        lastShareAt: now,
        firstShareAt: now,
      }));
      expect(result1.firstShareAt).toBe(now);

      const later = now + 1000;
      const result2 = storage.updateShareMetrics((prev) => ({
        lastShareAt: later,
        firstShareAt: prev.firstShareAt,
      }));
      expect(result2.firstShareAt).toBe(now);
    });
  });

  describe('trackShare integration scenario', () => {
    it('correctly tracks a complete share flow', () => {
      // Simulate trackShare behavior
      const now = Date.now();

      // First share - text format from result modal
      let result = storage.updateShareMetrics((prev) => {
        const newTypeCounts = { ...prev.typeCounts };
        newTypeCounts['result-modal'] = (newTypeCounts['result-modal'] || 0) + 1;

        return {
          totalShareCount: prev.totalShareCount + 1,
          formatCounts: {
            text: prev.formatCounts.text + 1,
            image: prev.formatCounts.image,
          },
          typeCounts: newTypeCounts,
          lastShareAt: now,
          firstShareAt: prev.firstShareAt ?? now,
        };
      });

      expect(result.totalShareCount).toBe(1);
      expect(result.formatCounts.text).toBe(1);
      expect(result.typeCounts['result-modal']).toBe(1);

      // Second share - image format from levelup toast
      const later = now + 5000;
      result = storage.updateShareMetrics((prev) => {
        const newTypeCounts = { ...prev.typeCounts };
        newTypeCounts['levelup-toast'] = (newTypeCounts['levelup-toast'] || 0) + 1;

        return {
          totalShareCount: prev.totalShareCount + 1,
          formatCounts: {
            text: prev.formatCounts.text,
            image: prev.formatCounts.image + 1,
          },
          typeCounts: newTypeCounts,
          lastShareAt: later,
          firstShareAt: prev.firstShareAt ?? later,
        };
      });

      expect(result.totalShareCount).toBe(2);
      expect(result.formatCounts.text).toBe(1);
      expect(result.formatCounts.image).toBe(1);
      expect(result.typeCounts['result-modal']).toBe(1);
      expect(result.typeCounts['levelup-toast']).toBe(1);
      expect(result.lastShareAt).toBe(later);
    });
  });
});