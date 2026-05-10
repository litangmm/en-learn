import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useShareMetrics } from '../useShareMetrics';

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

describe('useShareMetrics', () => {
  const SHARE_METRICS_KEY = 'en-learn-share-metrics';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('trackShare', () => {
    it('tracks text format share from result-modal', () => {
      const { result } = renderHook(() => useShareMetrics());

      act(() => {
        result.current.trackShare('text', 'result-modal');
      });

      const metrics = result.current.getMetrics();
      expect(metrics.totalShareCount).toBe(1);
      expect(metrics.formatCounts.text).toBe(1);
      expect(metrics.formatCounts.image).toBe(0);
      expect(metrics.typeCounts['result-modal']).toBe(1);
      expect(metrics.lastShareAt).not.toBeNull();
      expect(metrics.firstShareAt).not.toBeNull();
    });

    it('tracks image format share from levelup-toast', () => {
      const { result } = renderHook(() => useShareMetrics());

      act(() => {
        result.current.trackShare('image', 'levelup-toast');
      });

      const metrics = result.current.getMetrics();
      expect(metrics.totalShareCount).toBe(1);
      expect(metrics.formatCounts.text).toBe(0);
      expect(metrics.formatCounts.image).toBe(1);
      expect(metrics.typeCounts['levelup-toast']).toBe(1);
    });

    it('tracks image format share from badge-toast', () => {
      const { result } = renderHook(() => useShareMetrics());

      act(() => {
        result.current.trackShare('image', 'badge-toast');
      });

      const metrics = result.current.getMetrics();
      expect(metrics.totalShareCount).toBe(1);
      expect(metrics.formatCounts.image).toBe(1);
      expect(metrics.typeCounts['badge-toast']).toBe(1);
    });

    it('accumulates multiple shares', () => {
      const { result } = renderHook(() => useShareMetrics());

      act(() => {
        result.current.trackShare('text', 'result-modal');
      });
      act(() => {
        result.current.trackShare('image', 'levelup-toast');
      });
      act(() => {
        result.current.trackShare('text', 'result-modal');
      });

      const metrics = result.current.getMetrics();
      expect(metrics.totalShareCount).toBe(3);
      expect(metrics.formatCounts.text).toBe(2);
      expect(metrics.formatCounts.image).toBe(1);
      expect(metrics.typeCounts['result-modal']).toBe(2);
      expect(metrics.typeCounts['levelup-toast']).toBe(1);
    });
  });

  describe('getMetrics', () => {
    it('returns empty metrics initially', () => {
      const { result } = renderHook(() => useShareMetrics());

      const metrics = result.current.getMetrics();

      expect(metrics.totalShareCount).toBe(0);
      expect(metrics.formatCounts.text).toBe(0);
      expect(metrics.formatCounts.image).toBe(0);
      expect(metrics.typeCounts).toEqual({});
      expect(metrics.lastShareAt).toBeNull();
      expect(metrics.firstShareAt).toBeNull();
    });

    it('returns persisted metrics', () => {
      // Pre-populate localStorage
      const storedMetrics = {
        totalShareCount: 10,
        formatCounts: { text: 6, image: 4 },
        typeCounts: { 'result-modal': 7, 'levelup-toast': 3 },
        lastShareAt: 1704067200000,
        firstShareAt: 1704000000000,
      };
      localStorage.setItem(SHARE_METRICS_KEY, JSON.stringify(storedMetrics));

      const { result } = renderHook(() => useShareMetrics());
      const metrics = result.current.getMetrics();

      expect(metrics.totalShareCount).toBe(10);
      expect(metrics.formatCounts.text).toBe(6);
      expect(metrics.formatCounts.image).toBe(4);
      expect(metrics.typeCounts['result-modal']).toBe(7);
      expect(metrics.typeCounts['levelup-toast']).toBe(3);
    });
  });

  describe('data persistence', () => {
    it('persists metrics to localStorage', () => {
      const { result } = renderHook(() => useShareMetrics());

      act(() => {
        result.current.trackShare('text', 'result-modal');
      });

      const stored = localStorage.getItem(SHARE_METRICS_KEY);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.totalShareCount).toBe(1);
      expect(parsed.formatCounts.text).toBe(1);
    });

    it('survives re-render', () => {
      const { result } = renderHook(() => useShareMetrics());

      act(() => {
        result.current.trackShare('image', 'levelup-toast');
      });

      // Create new hook instance (simulating re-render)
      const { result: result2 } = renderHook(() => useShareMetrics());
      const metrics = result2.current.getMetrics();

      expect(metrics.totalShareCount).toBe(1);
      expect(metrics.formatCounts.image).toBe(1);
      expect(metrics.typeCounts['levelup-toast']).toBe(1);
    });
  });
});