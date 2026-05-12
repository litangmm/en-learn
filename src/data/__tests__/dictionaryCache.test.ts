import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getCachedDictionary, prefetchDictionary, clearDictionaryCache, removeDictionaryFromCache } from '../dictionaryCache';
import { loadDictionary } from '../loader';

// Mock all dictionary modules with fake data
vi.mock('../junior', async () => ({
  sentences: [{ id: 'j1', english: 'junior test', chinese: '初中测试', blanks: [{ word: 'junior' }], level: 'junior' }],
}));
vi.mock('../senior', async () => ({
  sentences: [{ id: 's1', english: 'senior test', chinese: '高中测试', blanks: [{ word: 'senior' }], level: 'senior' }],
}));
vi.mock('../cet4', async () => ({
  sentences: [{ id: 'c1', english: 'cet4 test', chinese: '四级测试', blanks: [{ word: 'cet4' }], level: 'cet4' }],
}));
vi.mock('../cet6', async () => ({
  sentences: [{ id: 'c2', english: 'cet6 test', chinese: '六级测试', blanks: [{ word: 'cet6' }], level: 'cet6' }],
}));
vi.mock('../ielts', async () => ({
  sentences: [{ id: 'i1', english: 'ielts test', chinese: '雅思测试', blanks: [{ word: 'ielts' }], level: 'ielts' }],
}));
vi.mock('../toefl', async () => ({
  sentences: [{ id: 't1', english: 'toefl test', chinese: '托福测试', blanks: [{ word: 'toefl' }], level: 'toefl' }],
}));
vi.mock('../gre', async () => ({
  sentences: [{ id: 'g1', english: 'gre test', chinese: 'GRE测试', blanks: [{ word: 'gre' }], level: 'gre' }],
}));

// Helper to wait for microtasks to complete (allows async cache population)
const flushMicrotasks = () => new Promise(resolve => setTimeout(resolve, 0));

describe('dictionaryCache', () => {
  beforeEach(() => {
    clearDictionaryCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    clearDictionaryCache();
  });

  describe('clearDictionaryCache', () => {
    it('is idempotent - calling on empty cache does not throw', () => {
      expect(() => clearDictionaryCache()).not.toThrow();
    });

    it('clears cache and subsequent getCachedDictionary returns undefined', async () => {
      // Pre-populate cache
      await loadDictionary('junior');
      await flushMicrotasks();
      expect(getCachedDictionary('junior')).toBeDefined();

      // Clear
      clearDictionaryCache();

      // Verify empty
      expect(getCachedDictionary('junior')).toBeUndefined();
    });

    it('can be called multiple times without error', () => {
      clearDictionaryCache();
      clearDictionaryCache();
      clearDictionaryCache();
    });
  });

  describe('getCachedDictionary - cache miss', () => {
    it('returns undefined when dictionary is not cached', () => {
      expect(getCachedDictionary('junior')).toBeUndefined();
    });

    it('returns undefined for unknown dictionary', () => {
      expect(getCachedDictionary('nonexistent')).toBeUndefined();
    });
  });

  describe('getCachedDictionary - cache hit', () => {
    it('returns cached data after loadDictionary populates cache', async () => {
      // Load and wait for cache to be populated
      const data = await loadDictionary('junior');
      await flushMicrotasks();

      // Should be cached now
      const cached = getCachedDictionary('junior');
      expect(cached).toBeDefined();
      expect(cached).toEqual(data);
    });

    it('marks entry as recently used on cache hit', async () => {
      // Load 5 dictionaries to fill cache
      await loadDictionary('junior');
      await loadDictionary('senior');
      await loadDictionary('cet4');
      await loadDictionary('cet6');
      await loadDictionary('ielts');
      await flushMicrotasks();

      // Cache: [junior, senior, cet4, cet6, ielts] — junior is LRU

      // Access junior via getCachedDictionary (moves to end)
      getCachedDictionary('junior');
      // Cache: [senior, cet4, cet6, ielts, junior] — senior is now LRU

      // Load 6th dictionary — should evict senior (LRU), not junior
      await loadDictionary('toefl');
      await flushMicrotasks();

      // senior should be evicted (was LRU after junior was touched)
      expect(getCachedDictionary('senior')).toBeUndefined();
      // junior should still be cached (was touched, moved to end)
      expect(getCachedDictionary('junior')).toBeDefined();
    });

    it('returns correct data for multiple cached dictionaries', async () => {
      await loadDictionary('junior');
      await loadDictionary('cet4');
      await flushMicrotasks();

      expect(getCachedDictionary('junior')).toBeDefined();
      expect(getCachedDictionary('cet4')).toBeDefined();
      expect(getCachedDictionary('senior')).toBeUndefined(); // Not loaded
    });
  });

  describe('LRU eviction', () => {
    it('evicts LRU entry when cache exceeds maxSize (5)', async () => {
      // Load 5 dictionaries
      await loadDictionary('junior');
      await flushMicrotasks();
      await loadDictionary('senior');
      await flushMicrotasks();
      await loadDictionary('cet4');
      await flushMicrotasks();
      await loadDictionary('cet6');
      await flushMicrotasks();
      await loadDictionary('ielts');
      await flushMicrotasks();

      // Cache: [junior, senior, cet4, cet6, ielts] — junior is LRU

      // Add 6th - should evict junior
      await loadDictionary('toefl');
      await flushMicrotasks();

      // junior (oldest) should be evicted
      expect(getCachedDictionary('junior')).toBeUndefined();
      // toefl should be in cache
      expect(getCachedDictionary('toefl')).toBeDefined();
      // Others should still be cached
      expect(getCachedDictionary('senior')).toBeDefined();
      expect(getCachedDictionary('cet4')).toBeDefined();
      expect(getCachedDictionary('cet6')).toBeDefined();
      expect(getCachedDictionary('ielts')).toBeDefined();
    });

    it('LRU order maintained after multiple loads and evictions', async () => {
      // Load 5
      await loadDictionary('junior');
      await loadDictionary('senior');
      await loadDictionary('cet4');
      await loadDictionary('cet6');
      await loadDictionary('ielts');
      await flushMicrotasks();

      // Load 6th - evicts junior
      await loadDictionary('toefl');
      await flushMicrotasks();

      // Load 7th - evicts senior
      await loadDictionary('gre');
      await flushMicrotasks();

      // Verify: junior and senior evicted, rest present
      expect(getCachedDictionary('junior')).toBeUndefined();
      expect(getCachedDictionary('senior')).toBeUndefined();
      expect(getCachedDictionary('cet4')).toBeDefined();
      expect(getCachedDictionary('cet6')).toBeDefined();
      expect(getCachedDictionary('ielts')).toBeDefined();
      expect(getCachedDictionary('toefl')).toBeDefined();
      expect(getCachedDictionary('gre')).toBeDefined();
    });

    it('repeatedly accessing same dictionary keeps it in cache', async () => {
      // Load 5
      await loadDictionary('junior');
      await loadDictionary('senior');
      await loadDictionary('cet4');
      await loadDictionary('cet6');
      await loadDictionary('ielts');
      await flushMicrotasks();

      // Access junior 3 times (moves to end each time)
      getCachedDictionary('junior');
      getCachedDictionary('junior');
      getCachedDictionary('junior');

      // Load 6th - should evict senior (least recently used now)
      await loadDictionary('toefl');
      await flushMicrotasks();

      // junior should still be cached (frequently accessed)
      expect(getCachedDictionary('junior')).toBeDefined();
      // senior should be evicted
      expect(getCachedDictionary('senior')).toBeUndefined();
    });
  });

  describe('prefetchDictionary', () => {
    it('returns void (fire-and-forget)', () => {
      const result = prefetchDictionary('junior');
      expect(result).toBeUndefined();
    });

    it('prefetch populates cache for future getCachedDictionary calls', async () => {
      // Prefetch a dictionary (doesn't return data)
      prefetchDictionary('junior');
      await flushMicrotasks();

      // Should be cached now
      const cached = getCachedDictionary('junior');
      expect(cached).toBeDefined();
      expect(cached).toHaveLength(1);
      expect(cached![0].id).toBe('j1');
    });

    it('prefetch refreshes LRU position if already cached', async () => {
      // First load 4 dictionaries
      await loadDictionary('junior');
      await loadDictionary('senior');
      await loadDictionary('cet4');
      await loadDictionary('cet6');
      await flushMicrotasks();

      // Cache: [junior, senior, cet4, cet6] — junior is LRU
      // Prefetch junior (moves to end)
      prefetchDictionary('junior');
      await flushMicrotasks();

      // Load 5th to fill cache
      await loadDictionary('ielts');
      await flushMicrotasks();
      // Cache: [senior, cet4, cet6, junior, ielts] — senior is LRU

      // Load 6th - should evict senior, not junior (junior was prefetched/refreshed)
      await loadDictionary('toefl');
      await flushMicrotasks();

      // junior should still be cached (was refreshed via prefetch)
      expect(getCachedDictionary('junior')).toBeDefined();
      // senior should be evicted
      expect(getCachedDictionary('senior')).toBeUndefined();
    });

    it('prefetch for unknown dictionary does not throw (fire-and-forget)', () => {
      // The promise rejects but it's fire-and-forget, so we just verify no sync throw
      expect(() => prefetchDictionary('unknown')).not.toThrow();
      // Note: the fire-and-forget promise will reject, which we accept as expected behavior
    });
  });

  describe('removeDictionaryFromCache', () => {
    it('removes a specific dictionary from cache', async () => {
      await loadDictionary('junior');
      await loadDictionary('cet4');
      await flushMicrotasks();

      expect(getCachedDictionary('junior')).toBeDefined();

      removeDictionaryFromCache('junior');

      expect(getCachedDictionary('junior')).toBeUndefined();
      expect(getCachedDictionary('cet4')).toBeDefined(); // Other entries remain
    });

    it('is idempotent - removing non-existent entry does not throw', () => {
      expect(() => removeDictionaryFromCache('nonexistent')).not.toThrow();
    });

    it('allows reloading after removal', async () => {
      await loadDictionary('junior');
      await flushMicrotasks();

      expect(getCachedDictionary('junior')).toBeDefined();

      removeDictionaryFromCache('junior');

      expect(getCachedDictionary('junior')).toBeUndefined();

      // Can reload after removal
      await loadDictionary('junior');
      await flushMicrotasks();

      expect(getCachedDictionary('junior')).toBeDefined();
    });

    it('clears entry and allows subsequent reload', async () => {
      // Load 5 to fill cache
      await loadDictionary('junior');
      await flushMicrotasks();
      await loadDictionary('senior');
      await flushMicrotasks();
      await loadDictionary('cet4');
      await flushMicrotasks();
      await loadDictionary('cet6');
      await flushMicrotasks();
      await loadDictionary('ielts');
      await flushMicrotasks();

      // Cache is now full (junior is LRU)
      expect(getCachedDictionary('junior')).toBeDefined();

      // Remove junior (LRU)
      removeDictionaryFromCache('junior');

      // junior should be removed
      expect(getCachedDictionary('junior')).toBeUndefined();

      // Load a 6th dictionary - junior is gone so it shouldn't be evicted
      await loadDictionary('toefl');
      await flushMicrotasks();

      // toefl should be in cache
      expect(getCachedDictionary('toefl')).toBeDefined();
    });
  });
});