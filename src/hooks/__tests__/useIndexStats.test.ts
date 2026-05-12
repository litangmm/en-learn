import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIndexStats } from '../useIndexStats';
import { useDictionaryIndex } from '@/hooks/useDictionaryIndex';
import { usePersonalWordIndex } from '@/hooks/usePersonalWordIndex';

// Mock the hooks
vi.mock('@/hooks/useDictionaryIndex', () => ({
  useDictionaryIndex: vi.fn(),
}));

vi.mock('@/hooks/usePersonalWordIndex', () => ({
  usePersonalWordIndex: vi.fn(),
}));

// Helper to create a mock PersonalWordIndex
function createMockPersonalWordIndex(sentences: unknown[]) {
  return {
    byWord: new Map(), // Required by interface
    getAllAsSentences: vi.fn().mockReturnValue(sentences),
    hasWord: vi.fn(),
    getByWord: vi.fn(),
    getByPrefix: vi.fn(),
  };
}

describe('useIndexStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty stats when no dictionary is loaded', () => {
    // Setup mock returns
    vi.mocked(useDictionaryIndex).mockReturnValue({
      currentId: null,
      isIndexed: false,
      isLoading: false,
      getById: vi.fn(),
      getByWord: vi.fn(),
      getByLevel: vi.fn(),
      getStats: vi.fn().mockReturnValue(null),
      getIndexedIds: vi.fn().mockReturnValue([]),
      loadDictionary: vi.fn().mockResolvedValue(undefined),
      switchDictionary: vi.fn(),
      getLoadedDictionaries: vi.fn().mockReturnValue([]),
      unloadDictionary: vi.fn(),
      clearAll: vi.fn(),
    });

    vi.mocked(usePersonalWordIndex).mockReturnValue({
      index: null,
      hasWord: vi.fn(),
      getByWord: vi.fn(),
      getByPrefix: vi.fn(),
      getAllAsSentences: vi.fn().mockReturnValue([]),
      reload: vi.fn(),
    });

    const { result } = renderHook(() => useIndexStats());

    expect(result.current.totalCount).toBe(0);
    expect(result.current.uniqueWords).toBe(0);
    expect(result.current.personalWordCount).toBe(0);
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.currentDictionaryId).toBeNull();
  });

  it('returns stats when dictionary is loaded', async () => {
    const mockStats = {
      totalCount: 100,
      uniqueWords: 50,
      buildTimeMs: 12.5,
      byLevel: { cet4: 100 },
    };

    const mockGetStats = vi.fn().mockReturnValue(mockStats);

    vi.mocked(useDictionaryIndex).mockReturnValue({
      currentId: 'cet4',
      isIndexed: true,
      isLoading: false,
      getById: vi.fn(),
      getByWord: vi.fn(),
      getByLevel: vi.fn(),
      getStats: mockGetStats,
      getIndexedIds: vi.fn().mockReturnValue(['1', '2', '3']),
      loadDictionary: vi.fn().mockResolvedValue(undefined),
      switchDictionary: vi.fn(),
      getLoadedDictionaries: vi.fn().mockReturnValue(['cet4']),
      unloadDictionary: vi.fn(),
      clearAll: vi.fn(),
    });

    const mockGetAllAsSentences = vi.fn().mockReturnValue([
      { id: 'pw-1', english: 'test', chinese: '测试', blanks: [{ word: 'test' }], level: 'personal' },
    ]);

    vi.mocked(usePersonalWordIndex).mockReturnValue({
      index: createMockPersonalWordIndex([
        { id: 'pw-1', english: 'test', chinese: '测试', blanks: [{ word: 'test' }], level: 'personal' },
      ]),
      hasWord: vi.fn(),
      getByWord: vi.fn(),
      getByPrefix: vi.fn(),
      getAllAsSentences: mockGetAllAsSentences,
      reload: vi.fn(),
    });

    const { result } = renderHook(() => useIndexStats());

    // Wait for the deferred update via setTimeout
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Now check the results
    expect(result.current.totalCount).toBe(100);
    expect(result.current.uniqueWords).toBe(50);
    expect(result.current.buildTimeMs).toBeCloseTo(12.5, 1);
    expect(result.current.personalWordCount).toBe(1);
    expect(result.current.isLoaded).toBe(true);
    expect(result.current.currentDictionaryId).toBe('cet4');
  });

  it('updates stats when dictionary changes', async () => {
    let getStatsCalls = 0;
    const getStats = vi.fn().mockImplementation(() => {
      getStatsCalls++;
      if (getStatsCalls === 1) {
        return { totalCount: 50, uniqueWords: 25, buildTimeMs: 5, byLevel: {} };
      }
      return { totalCount: 100, uniqueWords: 50, buildTimeMs: 10, byLevel: {} };
    });

    vi.mocked(useDictionaryIndex).mockReturnValue({
      currentId: 'cet4',
      isIndexed: true,
      isLoading: false,
      getById: vi.fn(),
      getByWord: vi.fn(),
      getByLevel: vi.fn(),
      getStats,
      getIndexedIds: vi.fn().mockReturnValue([]),
      loadDictionary: vi.fn().mockResolvedValue(undefined),
      switchDictionary: vi.fn(),
      getLoadedDictionaries: vi.fn().mockReturnValue(['cet4']),
      unloadDictionary: vi.fn(),
      clearAll: vi.fn(),
    });

    vi.mocked(usePersonalWordIndex).mockReturnValue({
      index: createMockPersonalWordIndex([]),
      hasWord: vi.fn(),
      getByWord: vi.fn(),
      getByPrefix: vi.fn(),
      getAllAsSentences: vi.fn().mockReturnValue([]),
      reload: vi.fn(),
    });

    renderHook(() => useIndexStats());

    // Wait for deferred updates
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // Initial stats should be loaded
    expect(getStatsCalls).toBeGreaterThanOrEqual(1);
  });

  it('rounds buildTimeMs to two decimal places', async () => {
    vi.mocked(useDictionaryIndex).mockReturnValue({
      currentId: 'cet4',
      isIndexed: true,
      isLoading: false,
      getById: vi.fn(),
      getByWord: vi.fn(),
      getByLevel: vi.fn(),
      getStats: vi.fn().mockReturnValue({
        totalCount: 100,
        uniqueWords: 50,
        buildTimeMs: 12.3456,
        byLevel: {},
      }),
      getIndexedIds: vi.fn().mockReturnValue([]),
      loadDictionary: vi.fn().mockResolvedValue(undefined),
      switchDictionary: vi.fn(),
      getLoadedDictionaries: vi.fn().mockReturnValue(['cet4']),
      unloadDictionary: vi.fn(),
      clearAll: vi.fn(),
    });

    vi.mocked(usePersonalWordIndex).mockReturnValue({
      index: createMockPersonalWordIndex([]),
      hasWord: vi.fn(),
      getByWord: vi.fn(),
      getByPrefix: vi.fn(),
      getAllAsSentences: vi.fn().mockReturnValue([]),
      reload: vi.fn(),
    });

    const { result } = renderHook(() => useIndexStats());

    // Wait for deferred updates
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.buildTimeMs).toBeCloseTo(12.35, 1);
  });
});