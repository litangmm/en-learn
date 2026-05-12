import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDictionaryIndex } from '../useDictionaryIndex';
import { loadDictionary } from '@/data/loader';
import { getCachedDictionary, clearDictionaryCache, removeDictionaryFromCache } from '@/data/dictionaryCache';

// Mock the loader module
vi.mock('@/data/loader', async () => {
  const actual = await vi.importActual('@/data/loader');
  return {
    ...actual,
    loadDictionary: vi.fn(),
  };
});

// Mock the dictionary cache
vi.mock('@/data/dictionaryCache', async () => {
  const actual = await vi.importActual('@/data/dictionaryCache');
  return {
    ...actual,
    getCachedDictionary: vi.fn(() => undefined),
    clearDictionaryCache: vi.fn(),
    removeDictionaryFromCache: vi.fn(),
  };
});

describe('useDictionaryIndex', () => {
  const mockSentences = [
    {
      id: 's1',
      english: 'Hello, world! This is a test sentence.',
      chinese: '你好，世界！这是一个测试句子。',
      blanks: [{ word: 'Hello', hint: 'Greeting' }],
      level: 'easy',
    },
    {
      id: 's2',
      english: 'The quick brown fox jumps over the lazy dog.',
      chinese: '快速的棕色狐狸跳过了懒狗。',
      blanks: [{ word: 'quick', hint: 'Fast' }],
      level: 'medium',
    },
    {
      id: 's3',
      english: 'A journey of a thousand miles begins with a single step.',
      chinese: '千里之行，始于足下。',
      blanks: [{ word: 'journey', hint: 'Travel' }],
      level: 'hard',
    },
    {
      id: 's4',
      english: 'Practice makes perfect.',
      chinese: '熟能生巧。',
      blanks: [{ word: 'Practice', hint: 'Exercise' }],
      level: 'easy',
    },
    {
      id: 's5',
      english: 'The quick brown fox runs very fast.',
      chinese: '快速的棕色狐狸跑得非常快。',
      blanks: [{ word: 'fast', hint: 'Speed' }],
      level: 'medium',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks to default resolved value
    vi.mocked(loadDictionary).mockResolvedValue(mockSentences);
    vi.mocked(clearDictionaryCache).mockImplementation(() => {});
    vi.mocked(removeDictionaryFromCache).mockImplementation(() => {});
    vi.mocked(getCachedDictionary).mockReturnValue(undefined);
  });

  // -------------------------------------------------------------------------
  // Initial State Tests
  // -------------------------------------------------------------------------

  it('starts with null currentId and not indexed', () => {
    const { result } = renderHook(() => useDictionaryIndex());

    expect(result.current.currentId).toBeNull();
    expect(result.current.isIndexed).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('starts with empty lookup methods returning undefined/empty', () => {
    const { result } = renderHook(() => useDictionaryIndex());

    expect(result.current.getById('s1')).toBeUndefined();
    expect(result.current.getByWord('hello')).toEqual([]);
    expect(result.current.getByLevel('easy')).toEqual([]);
    expect(result.current.getStats()).toBeNull();
    expect(result.current.getIndexedIds()).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // Load Dictionary Tests
  // -------------------------------------------------------------------------

  it('loadDictionary builds index and sets currentId', async () => {
    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    expect(result.current.currentId).toBe('cet4');
    expect(result.current.isIndexed).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('loadDictionary calls the loader with correct id', async () => {
    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet6');
    });

    expect(vi.mocked(loadDictionary)).toHaveBeenCalledWith('cet6');
  });

   
  it('loadDictionary sets loading state while fetching', async () => {
    let resolveLoad: (_value: typeof mockSentences) => void;
    vi.mocked(loadDictionary).mockImplementation(
      () => new Promise((resolve) => {
        resolveLoad = resolve;
      })
    );

    const { result } = renderHook(() => useDictionaryIndex());

    let loadPromise: Promise<void>;
    await act(async () => {
      loadPromise = result.current.loadDictionary('cet4') as Promise<void>;
    });

    // During loading - need to check immediately after act
    expect(result.current.isLoading).toBe(true);

    // Resolve
    await act(async () => {
      resolveLoad!(mockSentences);
      await loadPromise;
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Empty Data Tests
  // -------------------------------------------------------------------------

  it('handles empty sentences array', async () => {
    vi.mocked(loadDictionary).mockResolvedValue([]);

    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    expect(result.current.isIndexed).toBe(true);
    expect(result.current.getIndexedIds()).toEqual([]);
    expect(result.current.getStats()).toEqual({
      totalCount: 0,
      byLevel: {},
      uniqueWords: 0,
      buildTimeMs: expect.any(Number),
    });
  });

  // -------------------------------------------------------------------------
  // Single Dictionary Tests
  // -------------------------------------------------------------------------

  it('getById returns sentence text for existing id', async () => {
    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    const text = result.current.getById('s1');
    expect(text).toBe('Hello, world! This is a test sentence.');
  });

  it('getById returns undefined for non-existent id', async () => {
    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    expect(result.current.getById('non-existent')).toBeUndefined();
  });

  it('getByWord returns sentence ids containing the word', async () => {
    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    const ids = result.current.getByWord('quick');
    expect(ids).toContain('s2');
    expect(ids).toContain('s5');
  });

  it('getIndexedIds returns all indexed sentence ids', async () => {
    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    const ids = result.current.getIndexedIds();
    expect(ids).toHaveLength(5);
    expect(ids).toContain('s1');
    expect(ids).toContain('s2');
    expect(ids).toContain('s3');
    expect(ids).toContain('s4');
    expect(ids).toContain('s5');
  });

  // -------------------------------------------------------------------------
  // Case Insensitive Tests
  // -------------------------------------------------------------------------

  it('getByWord works case-insensitively - uppercase input', async () => {
    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    const ids = result.current.getByWord('QUICK');
    expect(ids).toContain('s2');
    expect(ids).toContain('s5');
  });

  it('getByWord works case-insensitively - mixed case input', async () => {
    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    const ids = result.current.getByWord('QuIcK');
    expect(ids).toContain('s2');
    expect(ids).toContain('s5');
  });

  it('getByWord works case-insensitively - lowercase input', async () => {
    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    const ids = result.current.getByWord('hello');
    expect(ids).toContain('s1');
  });

  it('getByWord returns empty array for non-existent word', async () => {
    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    const ids = result.current.getByWord('nonexistentword');
    expect(ids).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // Level Filtering Tests
  // -------------------------------------------------------------------------

  it('getByLevel returns correct sentence ids for easy level', async () => {
    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    const ids = result.current.getByLevel('easy');
    expect(ids).toContain('s1');
    expect(ids).toContain('s4');
    expect(ids).toHaveLength(2);
  });

  it('getByLevel returns correct sentence ids for medium level', async () => {
    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    const ids = result.current.getByLevel('medium');
    expect(ids).toContain('s2');
    expect(ids).toContain('s5');
    expect(ids).toHaveLength(2);
  });

  it('getByLevel returns correct sentence ids for hard level', async () => {
    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    const ids = result.current.getByLevel('hard');
    expect(ids).toContain('s3');
    expect(ids).toHaveLength(1);
  });

  it('getByLevel returns empty array for non-existent level', async () => {
    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    const ids = result.current.getByLevel('expert');
    expect(ids).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // Index Stats Tests
  // -------------------------------------------------------------------------

  it('getStats returns correct statistics', async () => {
    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    const stats = result.current.getStats();
    expect(stats).not.toBeNull();
    expect(stats!.totalCount).toBeGreaterThan(0);
    expect(stats!.uniqueWords).toBeGreaterThan(0);
    expect(stats!.buildTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('getStats returns correct level distribution', async () => {
    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    const stats = result.current.getStats();
    expect(stats!.byLevel).toEqual({
      easy: 2,
      medium: 2,
      hard: 1,
    });
  });

  it('getStats returns correct build time', async () => {
    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    const stats = result.current.getStats();
    expect(stats!.buildTimeMs).toBeGreaterThanOrEqual(0);
    expect(typeof stats!.buildTimeMs).toBe('number');
  });

  // -------------------------------------------------------------------------
  // Multiple Dictionaries Tests
  // -------------------------------------------------------------------------

  it('loadDictionary can load different dictionaries', async () => {
    const cet4Sentences = [
      { id: 'c1', english: 'CET4 sentence', chinese: 'cet4句子', blanks: [], level: 'easy' },
    ];
    const cet6Sentences = [
      { id: 'c2', english: 'CET6 sentence', chinese: 'cet6句子', blanks: [], level: 'medium' },
    ];

    vi.mocked(loadDictionary)
      .mockResolvedValueOnce(cet4Sentences as unknown as typeof mockSentences)
      .mockResolvedValueOnce(cet6Sentences as unknown as typeof mockSentences);

    const { result } = renderHook(() => useDictionaryIndex());

    // Load CET4
    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    expect(result.current.getById('c1')).toBe('CET4 sentence');
    expect(result.current.getById('c2')).toBeUndefined();

    // Load CET6
    await act(async () => {
      await result.current.loadDictionary('cet6');
    });

    // After switching, current index should be CET6
    expect(result.current.getById('c2')).toBe('CET6 sentence');
    expect(result.current.getById('c1')).toBeUndefined();
    expect(result.current.currentId).toBe('cet6');
  });

  it('loading different dictionaries updates the current index', async () => {
    const cet4Sentences = [
      { id: 'c1', english: 'CET4 sentence', chinese: 'cet4句子', blanks: [], level: 'easy' },
    ];
    const cet6Sentences = [
      { id: 'c2', english: 'CET6 sentence', chinese: 'cet6句子', blanks: [], level: 'medium' },
    ];

    vi.mocked(loadDictionary)
      .mockResolvedValueOnce(cet4Sentences as unknown as typeof mockSentences)
      .mockResolvedValueOnce(cet6Sentences as unknown as typeof mockSentences);

    const { result } = renderHook(() => useDictionaryIndex());

    // Load CET4
    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    expect(result.current.currentId).toBe('cet4');
    expect(result.current.getById('c1')).toBe('CET4 sentence');

    // Load CET6
    await act(async () => {
      await result.current.loadDictionary('cet6');
    });

    // Current index should be CET6
    expect(result.current.currentId).toBe('cet6');
    expect(result.current.getById('c2')).toBe('CET6 sentence');
  });

  // -------------------------------------------------------------------------
  // Already Built Skip Tests
  // -------------------------------------------------------------------------

  it('loading same dictionary twice works correctly', async () => {
    const { result } = renderHook(() => useDictionaryIndex());

    // Load CET4 first time
    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    expect(result.current.isIndexed).toBe(true);
    const firstLoadStats = result.current.getStats();

    // Load CET4 second time - index should still be valid
    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    expect(result.current.isIndexed).toBe(true);
    // Stats should be the same (same index, same data)
    expect(result.current.getStats()).toEqual(firstLoadStats);
  });

  it('switching back to previous dictionary works correctly', async () => {
    const cet4Sentences = [
      { id: 'c1', english: 'CET4 sentence', chinese: 'cet4句子', blanks: [], level: 'easy' },
    ];
    const cet6Sentences = [
      { id: 'c2', english: 'CET6 sentence', chinese: 'cet6句子', blanks: [], level: 'medium' },
    ];

    vi.mocked(loadDictionary)
      .mockResolvedValueOnce(cet4Sentences as unknown as typeof mockSentences)
      .mockResolvedValueOnce(cet6Sentences as unknown as typeof mockSentences)
      .mockResolvedValueOnce(cet4Sentences as unknown as typeof mockSentences);

    const { result } = renderHook(() => useDictionaryIndex());

    // Load CET4
    await act(async () => {
      await result.current.loadDictionary('cet4');
    });
    expect(result.current.currentId).toBe('cet4');
    expect(result.current.getById('c1')).toBe('CET4 sentence');

    // Load CET6
    await act(async () => {
      await result.current.loadDictionary('cet6');
    });
    expect(result.current.currentId).toBe('cet6');
    expect(result.current.getById('c2')).toBe('CET6 sentence');

    // Switch back to CET4 - should reload and work
    await act(async () => {
      await result.current.loadDictionary('cet4');
    });
    expect(result.current.currentId).toBe('cet4');
    expect(result.current.getById('c1')).toBe('CET4 sentence');
  });

  // -------------------------------------------------------------------------
  // Clear All Tests
  // -------------------------------------------------------------------------

  it('clearAll removes all cached data and resets state', async () => {
    const { result } = renderHook(() => useDictionaryIndex());

    // Load a dictionary
    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    expect(result.current.isIndexed).toBe(true);
    expect(result.current.currentId).toBe('cet4');

    // Clear all
    act(() => {
      result.current.clearAll();
    });

    // State should be reset
    expect(result.current.currentId).toBeNull();
    expect(result.current.isIndexed).toBe(false);
    expect(result.current.getById('s1')).toBeUndefined();
  });

  it('clearAll calls clearDictionaryCache', () => {
    const { result } = renderHook(() => useDictionaryIndex());

    act(() => {
      result.current.clearAll();
    });

    expect(vi.mocked(clearDictionaryCache)).toHaveBeenCalled();
  });

  it('can load new dictionary after clearAll', async () => {
    const { result } = renderHook(() => useDictionaryIndex());

    // Load initial dictionary
    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    // Clear
    act(() => {
      result.current.clearAll();
    });

    // Load new dictionary
    await act(async () => {
      await result.current.loadDictionary('cet6');
    });

    expect(result.current.isIndexed).toBe(true);
    expect(result.current.currentId).toBe('cet6');
  });

  // -------------------------------------------------------------------------
  // Error Handling Tests
  // -------------------------------------------------------------------------

  it('loadDictionary throws error for unknown dictionary', async () => {
    vi.mocked(loadDictionary).mockRejectedValue(new Error('Unknown dictionary'));

    const { result } = renderHook(() => useDictionaryIndex());

    await expect(
      act(async () => {
        await result.current.loadDictionary('unknown');
      })
    ).rejects.toThrow('Unknown dictionary');
  });

  it('loadDictionary resets loading state on error', async () => {
    let rejectLoad: (_error: Error) => void;
    vi.mocked(loadDictionary).mockImplementation(
      () => new Promise((_, reject) => {
        rejectLoad = reject;
      })
    );

    const { result } = renderHook(() => useDictionaryIndex());

    let loadPromise: Promise<void>;
    await act(async () => {
      loadPromise = result.current.loadDictionary('cet4') as Promise<void>;
    });

    // During loading, isLoading should be true
    expect(result.current.isLoading).toBe(true);

    // Reject with error
    await act(async () => {
      rejectLoad!(new Error('Unknown dictionary'));
      await expect(loadPromise).rejects.toThrow();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Edge Cases
  // -------------------------------------------------------------------------

  it('handles sentences without blanks', async () => {
    const sentencesNoBlanks = [
      { id: 'n1', english: 'No blanks here', chinese: '没有空', blanks: [], level: 'easy' },
    ];

    vi.mocked(loadDictionary).mockResolvedValue(sentencesNoBlanks as unknown as typeof mockSentences);

    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    expect(result.current.getById('n1')).toBe('No blanks here');
    expect(result.current.getIndexedIds()).toContain('n1');
  });

  it('handles blank words that appear multiple times in sentence', async () => {
    const sentencesDup = [
      {
        id: 'dup1',
        english: 'The the the cat cat',
        chinese: '重复的句子',
        blanks: [{ word: 'the', hint: 'Article' }],
        level: 'easy',
      },
    ];

    vi.mocked(loadDictionary).mockResolvedValue(sentencesDup as unknown as typeof mockSentences);

    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    const ids = result.current.getByWord('the');
    expect(ids).toContain('dup1');
  });

  it('getStats works with single sentence', async () => {
    const singleSentence = [
      { id: 'single', english: 'One sentence here', chinese: '一句话', blanks: [], level: 'easy' },
    ];

    vi.mocked(loadDictionary).mockResolvedValue(singleSentence as unknown as typeof mockSentences);

    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    const stats = result.current.getStats();
    expect(stats!.totalCount).toBeGreaterThan(0);
    expect(stats!.byLevel.easy).toBe(1);
  });

  // -------------------------------------------------------------------------
  // switchDictionary Tests
  // -------------------------------------------------------------------------

  it('switchDictionary switches to previously loaded dictionary without reloading', async () => {
    const cet4Sentences = [
      { id: 'c1', english: 'CET4 sentence', chinese: 'cet4句子', blanks: [], level: 'easy' },
    ];
    const cet6Sentences = [
      { id: 'c2', english: 'CET6 sentence', chinese: 'cet6句子', blanks: [], level: 'medium' },
    ];

    vi.mocked(loadDictionary)
      .mockResolvedValueOnce(cet4Sentences as unknown as typeof mockSentences)
      .mockResolvedValueOnce(cet6Sentences as unknown as typeof mockSentences);

    const { result } = renderHook(() => useDictionaryIndex());

    // Load CET4
    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    // Load CET6
    await act(async () => {
      await result.current.loadDictionary('cet6');
    });

    expect(result.current.currentId).toBe('cet6');

    // Switch back to CET4 using switchDictionary
    act(() => {
      result.current.switchDictionary('cet4');
    });

    expect(result.current.currentId).toBe('cet4');
    expect(result.current.getById('c1')).toBe('CET4 sentence');
    // Should NOT have called loadDictionary again
    expect(vi.mocked(loadDictionary)).toHaveBeenCalledTimes(2);
  });

  it('switchDictionary does nothing if dictionary is not loaded', async () => {
    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    // Try to switch to unloaded dictionary
    act(() => {
      result.current.switchDictionary('cet6');
    });

    // Should remain on cet4
    expect(result.current.currentId).toBe('cet4');
    expect(vi.mocked(loadDictionary)).toHaveBeenCalledTimes(1);
  });

  it('switchDictionary preserves isIndexed state', async () => {
    const cet4Sentences = [
      { id: 'c1', english: 'CET4 sentence', chinese: 'cet4句子', blanks: [], level: 'easy' },
    ];
    const cet6Sentences = [
      { id: 'c2', english: 'CET6 sentence', chinese: 'cet6句子', blanks: [], level: 'medium' },
    ];

    vi.mocked(loadDictionary)
      .mockResolvedValueOnce(cet4Sentences as unknown as typeof mockSentences)
      .mockResolvedValueOnce(cet6Sentences as unknown as typeof mockSentences);

    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });
    expect(result.current.isIndexed).toBe(true);

    await act(async () => {
      await result.current.loadDictionary('cet6');
    });
    expect(result.current.isIndexed).toBe(true);

    // Switch back - should remain indexed
    act(() => {
      result.current.switchDictionary('cet4');
    });

    expect(result.current.isIndexed).toBe(true);
  });

  // -------------------------------------------------------------------------
  // getLoadedDictionaries Tests
  // -------------------------------------------------------------------------

  it('getLoadedDictionaries returns empty array initially', () => {
    const { result } = renderHook(() => useDictionaryIndex());

    expect(result.current.getLoadedDictionaries()).toEqual([]);
  });

  it('getLoadedDictionaries returns loaded dictionary IDs', async () => {
    const cet4Sentences = [
      { id: 'c1', english: 'CET4 sentence', chinese: 'cet4句子', blanks: [], level: 'easy' },
    ];
    const cet6Sentences = [
      { id: 'c2', english: 'CET6 sentence', chinese: 'cet6句子', blanks: [], level: 'medium' },
    ];

    vi.mocked(loadDictionary)
      .mockResolvedValueOnce(cet4Sentences as unknown as typeof mockSentences)
      .mockResolvedValueOnce(cet6Sentences as unknown as typeof mockSentences);

    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    expect(result.current.getLoadedDictionaries()).toContain('cet4');
    expect(result.current.getLoadedDictionaries()).toHaveLength(1);

    await act(async () => {
      await result.current.loadDictionary('cet6');
    });

    expect(result.current.getLoadedDictionaries()).toContain('cet4');
    expect(result.current.getLoadedDictionaries()).toContain('cet6');
    expect(result.current.getLoadedDictionaries()).toHaveLength(2);
  });

  it('getLoadedDictionaries does not include unloaded dictionaries', async () => {
    const cet4Sentences = [
      { id: 'c1', english: 'CET4 sentence', chinese: 'cet4句子', blanks: [], level: 'easy' },
    ];
    const cet6Sentences = [
      { id: 'c2', english: 'CET6 sentence', chinese: 'cet6句子', blanks: [], level: 'medium' },
    ];

    vi.mocked(loadDictionary)
      .mockResolvedValueOnce(cet4Sentences as unknown as typeof mockSentences)
      .mockResolvedValueOnce(cet6Sentences as unknown as typeof mockSentences);

    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });
    await act(async () => {
      await result.current.loadDictionary('cet6');
    });

    expect(result.current.getLoadedDictionaries()).toHaveLength(2);

    // Unload CET4
    act(() => {
      result.current.unloadDictionary('cet4');
    });

    expect(result.current.getLoadedDictionaries()).not.toContain('cet4');
    expect(result.current.getLoadedDictionaries()).toContain('cet6');
    expect(result.current.getLoadedDictionaries()).toHaveLength(1);
  });

  it('getLoadedDictionaries returns empty after clearAll', async () => {
    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    expect(result.current.getLoadedDictionaries()).toHaveLength(1);

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.getLoadedDictionaries()).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // unloadDictionary Tests
  // -------------------------------------------------------------------------

  it('unloadDictionary removes dictionary from memory', async () => {
    const cet4Sentences = [
      { id: 'c1', english: 'CET4 sentence', chinese: 'cet4句子', blanks: [], level: 'easy' },
    ];

    vi.mocked(loadDictionary).mockResolvedValue(cet4Sentences as unknown as typeof mockSentences);

    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    expect(result.current.getLoadedDictionaries()).toContain('cet4');

    act(() => {
      result.current.unloadDictionary('cet4');
    });

    expect(result.current.getLoadedDictionaries()).not.toContain('cet4');
  });

  it('unloadDictionary switches currentId if unloading current dictionary', async () => {
    const cet4Sentences = [
      { id: 'c1', english: 'CET4 sentence', chinese: 'cet4句子', blanks: [], level: 'easy' },
    ];
    const cet6Sentences = [
      { id: 'c2', english: 'CET6 sentence', chinese: 'cet6句子', blanks: [], level: 'medium' },
    ];

    vi.mocked(loadDictionary)
      .mockResolvedValueOnce(cet4Sentences as unknown as typeof mockSentences)
      .mockResolvedValueOnce(cet6Sentences as unknown as typeof mockSentences);

    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });
    await act(async () => {
      await result.current.loadDictionary('cet6');
    });

    expect(result.current.currentId).toBe('cet6');

    // Unload the current dictionary (cet6)
    act(() => {
      result.current.unloadDictionary('cet6');
    });

    // Should switch to the first remaining dictionary (cet4)
    expect(result.current.currentId).toBe('cet4');
    expect(result.current.isIndexed).toBe(true);
  });

  it('unloadDictionary sets currentId to null when unloading only dictionary', async () => {
    const cet4Sentences = [
      { id: 'c1', english: 'CET4 sentence', chinese: 'cet4句子', blanks: [], level: 'easy' },
    ];

    vi.mocked(loadDictionary).mockResolvedValue(cet4Sentences as unknown as typeof mockSentences);

    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    expect(result.current.currentId).toBe('cet4');

    act(() => {
      result.current.unloadDictionary('cet4');
    });

    expect(result.current.currentId).toBeNull();
    expect(result.current.isIndexed).toBe(false);
  });

  it('unloadDictionary does nothing for non-loaded dictionary', async () => {
    const cet4Sentences = [
      { id: 'c1', english: 'CET4 sentence', chinese: 'cet4句子', blanks: [], level: 'easy' },
    ];

    vi.mocked(loadDictionary).mockResolvedValue(cet4Sentences as unknown as typeof mockSentences);

    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    // Try to unload non-loaded dictionary
    act(() => {
      result.current.unloadDictionary('cet6');
    });

    // Should not affect current state
    expect(result.current.currentId).toBe('cet4');
    expect(result.current.getLoadedDictionaries()).toHaveLength(1);
  });

  it('can reload unloaded dictionary', async () => {
    const cet4Sentences = [
      { id: 'c1', english: 'CET4 sentence', chinese: 'cet4句子', blanks: [], level: 'easy' },
    ];

    vi.mocked(loadDictionary)
      .mockResolvedValueOnce(cet4Sentences as unknown as typeof mockSentences)
      .mockResolvedValueOnce(cet4Sentences as unknown as typeof mockSentences);

    const { result } = renderHook(() => useDictionaryIndex());

    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    act(() => {
      result.current.unloadDictionary('cet4');
    });

    expect(result.current.currentId).toBeNull();

    // Reload the dictionary
    await act(async () => {
      await result.current.loadDictionary('cet4');
    });

    expect(result.current.currentId).toBe('cet4');
    expect(result.current.isIndexed).toBe(true);
    expect(result.current.getById('c1')).toBe('CET4 sentence');
  });

  // -------------------------------------------------------------------------
  // Integration Tests for New Methods
  // -------------------------------------------------------------------------

  it('switchDictionary and unloadDictionary work together', async () => {
    const cet4Sentences = [
      { id: 'c1', english: 'CET4 sentence', chinese: 'cet4句子', blanks: [], level: 'easy' },
    ];
    const cet6Sentences = [
      { id: 'c2', english: 'CET6 sentence', chinese: 'cet6句子', blanks: [], level: 'medium' },
    ];
    const ieltsSentences = [
      { id: 'i1', english: 'IELTS sentence', chinese: 'ielts句子', blanks: [], level: 'hard' },
    ];

    vi.mocked(loadDictionary)
      .mockResolvedValueOnce(cet4Sentences as unknown as typeof mockSentences)
      .mockResolvedValueOnce(cet6Sentences as unknown as typeof mockSentences)
      .mockResolvedValueOnce(ieltsSentences as unknown as typeof mockSentences);

    const { result } = renderHook(() => useDictionaryIndex());

    // Load all three dictionaries
    await act(async () => {
      await result.current.loadDictionary('cet4');
    });
    await act(async () => {
      await result.current.loadDictionary('cet6');
    });
    await act(async () => {
      await result.current.loadDictionary('ielts');
    });

    expect(result.current.getLoadedDictionaries()).toHaveLength(3);
    expect(result.current.currentId).toBe('ielts');

    // Switch to CET4
    act(() => {
      result.current.switchDictionary('cet4');
    });
    expect(result.current.currentId).toBe('cet4');

    // Unload CET6
    act(() => {
      result.current.unloadDictionary('cet6');
    });
    expect(result.current.getLoadedDictionaries()).toHaveLength(2);
    expect(result.current.getLoadedDictionaries()).not.toContain('cet6');

    // Switch back to IELTS
    act(() => {
      result.current.switchDictionary('ielts');
    });
    expect(result.current.currentId).toBe('ielts');
  });

  // =============================================================================
  // Task 2: Multi-Dictionary Switching Tests
  // =============================================================================

  describe('Multi-dictionary switching scenarios', () => {
    // -------------------------------------------------------------------------
    // 1. Dictionary loading and indexing
    // -------------------------------------------------------------------------

    it('loads multiple dictionaries and builds indices for each', async () => {
      const cet4Sentences = [
        { id: 'c1', english: 'CET4 word', chinese: '四级词汇', blanks: [], level: 'easy' },
        { id: 'c2', english: 'CET4 learning', chinese: '四级学习', blanks: [], level: 'medium' },
      ];
      const cet6Sentences = [
        { id: 'c6_1', english: 'CET6 word', chinese: '六级词汇', blanks: [], level: 'medium' },
        { id: 'c6_2', english: 'CET6 advanced', chinese: '六级进阶', blanks: [], level: 'hard' },
      ];
      const ieltsSentences = [
        { id: 'i1', english: 'IELTS word', chinese: '雅思词汇', blanks: [], level: 'hard' },
        { id: 'i2', english: 'IELTS speaking', chinese: '雅思口语', blanks: [], level: 'medium' },
      ];

      vi.mocked(loadDictionary)
        .mockResolvedValueOnce(cet4Sentences as unknown as typeof mockSentences)
        .mockResolvedValueOnce(cet6Sentences as unknown as typeof mockSentences)
        .mockResolvedValueOnce(ieltsSentences as unknown as typeof mockSentences);

      const { result } = renderHook(() => useDictionaryIndex());

      // Load CET4
      await act(async () => {
        await result.current.loadDictionary('cet4');
      });
      expect(result.current.currentId).toBe('cet4');
      expect(result.current.isIndexed).toBe(true);

      // Load CET6
      await act(async () => {
        await result.current.loadDictionary('cet6');
      });
      expect(result.current.currentId).toBe('cet6');

      // Load IELTS
      await act(async () => {
        await result.current.loadDictionary('ielts');
      });
      expect(result.current.currentId).toBe('ielts');

      // Verify all dictionaries are loaded
      expect(result.current.getLoadedDictionaries()).toHaveLength(3);
      expect(result.current.getLoadedDictionaries()).toContain('cet4');
      expect(result.current.getLoadedDictionaries()).toContain('cet6');
      expect(result.current.getLoadedDictionaries()).toContain('ielts');
    });

    it('verifies each dictionary index is cached independently', async () => {
      const cet4Sentences = [
        { id: 'c1', english: 'CET4 sentence', chinese: '四级句子', blanks: [], level: 'easy' },
      ];
      const cet6Sentences = [
        { id: 'c6_1', english: 'CET6 sentence', chinese: '六级句子', blanks: [], level: 'medium' },
      ];

      vi.mocked(loadDictionary)
        .mockResolvedValueOnce(cet4Sentences as unknown as typeof mockSentences)
        .mockResolvedValueOnce(cet6Sentences as unknown as typeof mockSentences);

      const { result } = renderHook(() => useDictionaryIndex());

      await act(async () => {
        await result.current.loadDictionary('cet4');
      });
      await act(async () => {
        await result.current.loadDictionary('cet6');
      });

      // Switch to CET4 and verify its data
      act(() => {
        result.current.switchDictionary('cet4');
      });
      expect(result.current.getById('c1')).toBe('CET4 sentence');
      expect(result.current.getById('c6_1')).toBeUndefined();

      // Switch to CET6 and verify its data
      act(() => {
        result.current.switchDictionary('cet6');
      });
      expect(result.current.getById('c6_1')).toBe('CET6 sentence');
      expect(result.current.getById('c1')).toBeUndefined();
    });

    it('verifies getByWord returns correct results for each dictionary', async () => {
      const cet4Sentences = [
        { id: 'c1', english: 'apple banana', chinese: '苹果香蕉', blanks: [], level: 'easy' },
        { id: 'c2', english: 'cherry date', chinese: '樱桃枣', blanks: [], level: 'medium' },
      ];
      const cet6Sentences = [
        { id: 'c6_1', english: 'apple orange', chinese: '苹果橙子', blanks: [], level: 'medium' },
        { id: 'c6_2', english: 'grape melon', chinese: '葡萄瓜', blanks: [], level: 'hard' },
      ];

      vi.mocked(loadDictionary)
        .mockResolvedValueOnce(cet4Sentences as unknown as typeof mockSentences)
        .mockResolvedValueOnce(cet6Sentences as unknown as typeof mockSentences);

      const { result } = renderHook(() => useDictionaryIndex());

      await act(async () => {
        await result.current.loadDictionary('cet4');
      });
      await act(async () => {
        await result.current.loadDictionary('cet6');
      });

      // In CET4, word 'apple' only in c1
      act(() => {
        result.current.switchDictionary('cet4');
      });
      expect(result.current.getByWord('apple')).toContain('c1');
      expect(result.current.getByWord('apple')).toHaveLength(1);

      // In CET6, word 'apple' only in c6_1
      act(() => {
        result.current.switchDictionary('cet6');
      });
      expect(result.current.getByWord('apple')).toContain('c6_1');
      expect(result.current.getByWord('apple')).toHaveLength(1);
    });

    // -------------------------------------------------------------------------
    // 2. Dictionary switching
    // -------------------------------------------------------------------------

    it('switchDictionary updates currentId correctly', async () => {
      const cet4Sentences = [{ id: 'c1', english: 'CET4', chinese: '四级', blanks: [], level: 'easy' }];
      const cet6Sentences = [{ id: 'c6_1', english: 'CET6', chinese: '六级', blanks: [], level: 'medium' }];
      const ieltsSentences = [{ id: 'i1', english: 'IELTS', chinese: '雅思', blanks: [], level: 'hard' }];

      vi.mocked(loadDictionary)
        .mockResolvedValueOnce(cet4Sentences as typeof mockSentences)
        .mockResolvedValueOnce(cet6Sentences as typeof mockSentences)
        .mockResolvedValueOnce(ieltsSentences as typeof mockSentences);

      const { result } = renderHook(() => useDictionaryIndex());

      // Load dictionaries
      await act(async () => {
        await result.current.loadDictionary('cet4');
      });
      await act(async () => {
        await result.current.loadDictionary('cet6');
      });
      await act(async () => {
        await result.current.loadDictionary('ielts');
      });

      // Switch to CET4
      act(() => {
        result.current.switchDictionary('cet4');
      });
      expect(result.current.currentId).toBe('cet4');

      // Switch to IELTS
      act(() => {
        result.current.switchDictionary('ielts');
      });
      expect(result.current.currentId).toBe('ielts');

      // Switch to CET6
      act(() => {
        result.current.switchDictionary('cet6');
      });
      expect(result.current.currentId).toBe('cet6');
    });

    it('switchDictionary delegates getById to correct dictionary index', async () => {
      const cet4Sentences = [
        { id: 's1', english: 'CET4 sentence 1', chinese: '四级句1', blanks: [], level: 'easy' },
        { id: 's2', english: 'CET4 sentence 2', chinese: '四级句2', blanks: [], level: 'medium' },
      ];
      const cet6Sentences = [
        { id: 's3', english: 'CET6 sentence 3', chinese: '六级句3', blanks: [], level: 'medium' },
        { id: 's4', english: 'CET6 sentence 4', chinese: '六级句4', blanks: [], level: 'hard' },
      ];

      vi.mocked(loadDictionary)
        .mockResolvedValueOnce(cet4Sentences as typeof mockSentences)
        .mockResolvedValueOnce(cet6Sentences as typeof mockSentences);

      const { result } = renderHook(() => useDictionaryIndex());

      await act(async () => {
        await result.current.loadDictionary('cet4');
      });
      await act(async () => {
        await result.current.loadDictionary('cet6');
      });

      // Verify CET6 is current
      expect(result.current.currentId).toBe('cet6');

      // Switch to CET4 - getById should return CET4 data
      act(() => {
        result.current.switchDictionary('cet4');
      });

      // Verify currentId updated
      expect(result.current.currentId).toBe('cet4');

      // Now test getById
      expect(result.current.getById('s1')).toBe('CET4 sentence 1');
      expect(result.current.getById('s2')).toBe('CET4 sentence 2');
      expect(result.current.getById('s3')).toBeUndefined();
      expect(result.current.getById('s4')).toBeUndefined();

      // Switch to CET6 - getById should return CET6 data
      act(() => {
        result.current.switchDictionary('cet6');
      });

      expect(result.current.currentId).toBe('cet6');
      expect(result.current.getById('s3')).toBe('CET6 sentence 3');
      expect(result.current.getById('s4')).toBe('CET6 sentence 4');
      expect(result.current.getById('s1')).toBeUndefined();
      expect(result.current.getById('s2')).toBeUndefined();
    });

    it('switchDictionary delegates getByLevel to correct dictionary index', async () => {
      const cet4Sentences = [
        { id: 'c1', english: 'CET4 easy', chinese: '四级简单', blanks: [], level: 'easy' },
        { id: 'c2', english: 'CET4 hard', chinese: '四级困难', blanks: [], level: 'hard' },
      ];
      const cet6Sentences = [
        { id: 'c6_1', english: 'CET6 medium', chinese: '六级中等', blanks: [], level: 'medium' },
        { id: 'c6_2', english: 'CET6 hard', chinese: '六级困难', blanks: [], level: 'hard' },
      ];

      vi.mocked(loadDictionary)
        .mockResolvedValueOnce(cet4Sentences as typeof mockSentences)
        .mockResolvedValueOnce(cet6Sentences as typeof mockSentences);

      const { result } = renderHook(() => useDictionaryIndex());

      await act(async () => {
        await result.current.loadDictionary('cet4');
      });
      await act(async () => {
        await result.current.loadDictionary('cet6');
      });

      // Switch to CET4
      act(() => {
        result.current.switchDictionary('cet4');
      });
      expect(result.current.currentId).toBe('cet4');

      // In CET4, get hard level
      const cet4HardIds = result.current.getByLevel('hard');
      expect(cet4HardIds).toContain('c2');
      expect(cet4HardIds).toHaveLength(1);

      // Switch to CET6
      act(() => {
        result.current.switchDictionary('cet6');
      });
      expect(result.current.currentId).toBe('cet6');

      // In CET6, get hard level (different data)
      const cet6HardIds = result.current.getByLevel('hard');
      expect(cet6HardIds).toContain('c6_2');
      expect(cet6HardIds).toHaveLength(1);
    });

    it('switchDictionary does not trigger reloading', async () => {
      const cet4Sentences = [{ id: 'c1', english: 'CET4', chinese: '四级', blanks: [], level: 'easy' }];
      const cet6Sentences = [{ id: 'c6_1', english: 'CET6', chinese: '六级', blanks: [], level: 'medium' }];

      vi.mocked(loadDictionary)
        .mockResolvedValueOnce(cet4Sentences as unknown as typeof mockSentences)
        .mockResolvedValueOnce(cet6Sentences as unknown as typeof mockSentences);

      const { result } = renderHook(() => useDictionaryIndex());

      await act(async () => {
        await result.current.loadDictionary('cet4');
      });
      await act(async () => {
        await result.current.loadDictionary('cet6');
      });

      expect(vi.mocked(loadDictionary)).toHaveBeenCalledTimes(2);

      // Switch multiple times
      act(() => {
        result.current.switchDictionary('cet4');
      });
      act(() => {
        result.current.switchDictionary('cet6');
      });
      act(() => {
        result.current.switchDictionary('cet4');
      });

      // Should still be only 2 calls (no new loadings)
      expect(vi.mocked(loadDictionary)).toHaveBeenCalledTimes(2);
    });

    // -------------------------------------------------------------------------
    // 3. Unload behavior
    // -------------------------------------------------------------------------

    it('unloadDictionary removes dictionary from indices Map', async () => {
      const cet4Sentences = [{ id: 'c1', english: 'CET4', chinese: '四级', blanks: [], level: 'easy' }];
      const cet6Sentences = [{ id: 'c6_1', english: 'CET6', chinese: '六级', blanks: [], level: 'medium' }];

      vi.mocked(loadDictionary)
        .mockResolvedValueOnce(cet4Sentences as unknown as typeof mockSentences)
        .mockResolvedValueOnce(cet6Sentences as unknown as typeof mockSentences);

      const { result } = renderHook(() => useDictionaryIndex());

      await act(async () => {
        await result.current.loadDictionary('cet4');
      });
      await act(async () => {
        await result.current.loadDictionary('cet6');
      });

      expect(result.current.getLoadedDictionaries()).toContain('cet4');
      expect(result.current.getLoadedDictionaries()).toContain('cet6');

      // Unload CET4
      act(() => {
        result.current.unloadDictionary('cet4');
      });

      expect(result.current.getLoadedDictionaries()).not.toContain('cet4');
      expect(result.current.getLoadedDictionaries()).toContain('cet6');

      // Unload CET6
      act(() => {
        result.current.unloadDictionary('cet6');
      });

      expect(result.current.getLoadedDictionaries()).toEqual([]);
    });

    it('unloadDictionary also removes from cache', async () => {
      const cet4Sentences = [{ id: 'c1', english: 'CET4', chinese: '四级', blanks: [], level: 'easy' }];

      vi.mocked(loadDictionary).mockResolvedValue(cet4Sentences as unknown as typeof mockSentences);

      const { result } = renderHook(() => useDictionaryIndex());

      await act(async () => {
        await result.current.loadDictionary('cet4');
      });

      act(() => {
        result.current.unloadDictionary('cet4');
      });

      expect(vi.mocked(removeDictionaryFromCache)).toHaveBeenCalledWith('cet4');
    });

    it('switchDictionary to unloaded dictionary is a no-op', async () => {
      const cet4Sentences = [{ id: 'c1', english: 'CET4', chinese: '四级', blanks: [], level: 'easy' }];
      const cet6Sentences = [{ id: 'c6_1', english: 'CET6', chinese: '六级', blanks: [], level: 'medium' }];

      vi.mocked(loadDictionary)
        .mockResolvedValueOnce(cet4Sentences as unknown as typeof mockSentences)
        .mockResolvedValueOnce(cet6Sentences as unknown as typeof mockSentences);

      const { result } = renderHook(() => useDictionaryIndex());

      await act(async () => {
        await result.current.loadDictionary('cet4');
      });
      await act(async () => {
        await result.current.loadDictionary('cet6');
      });

      // Unload CET4
      act(() => {
        result.current.unloadDictionary('cet4');
      });

      // Try to switch to unloaded CET4
      act(() => {
        result.current.switchDictionary('cet4');
      });

      // Should remain on CET6
      expect(result.current.currentId).toBe('cet6');
      expect(result.current.getLoadedDictionaries()).toEqual(['cet6']);
    });

    it('unloadDictionary updates currentId when unloading current dictionary', async () => {
      const cet4Sentences = [{ id: 'c1', english: 'CET4', chinese: '四级', blanks: [], level: 'easy' }];
      const cet6Sentences = [{ id: 'c6_1', english: 'CET6', chinese: '六级', blanks: [], level: 'medium' }];
      const ieltsSentences = [{ id: 'i1', english: 'IELTS', chinese: '雅思', blanks: [], level: 'hard' }];

      vi.mocked(loadDictionary)
        .mockResolvedValueOnce(cet4Sentences as unknown as typeof mockSentences)
        .mockResolvedValueOnce(cet6Sentences as unknown as typeof mockSentences)
        .mockResolvedValueOnce(ieltsSentences as unknown as typeof mockSentences);

      const { result } = renderHook(() => useDictionaryIndex());

      await act(async () => {
        await result.current.loadDictionary('cet4');
      });
      await act(async () => {
        await result.current.loadDictionary('cet6');
      });
      await act(async () => {
        await result.current.loadDictionary('ielts');
      });

      // Currently on IELTS (last loaded)
      expect(result.current.currentId).toBe('ielts');

      // Unload current dictionary (IELTS)
      act(() => {
        result.current.unloadDictionary('ielts');
      });

      // Should switch to first remaining in insertion order: cet4 (first inserted)
      expect(result.current.currentId).toBe('cet4');
      expect(result.current.isIndexed).toBe(true);
    });

    it('unloadDictionary sets isIndexed to false when unloading only dictionary', async () => {
      const cet4Sentences = [{ id: 'c1', english: 'CET4', chinese: '四级', blanks: [], level: 'easy' }];

      vi.mocked(loadDictionary).mockResolvedValue(cet4Sentences as unknown as typeof mockSentences);

      const { result } = renderHook(() => useDictionaryIndex());

      await act(async () => {
        await result.current.loadDictionary('cet4');
      });

      expect(result.current.isIndexed).toBe(true);
      expect(result.current.currentId).toBe('cet4');

      act(() => {
        result.current.unloadDictionary('cet4');
      });

      expect(result.current.isIndexed).toBe(false);
      expect(result.current.currentId).toBeNull();
    });

    // -------------------------------------------------------------------------
    // 4. Edge cases
    // -------------------------------------------------------------------------

    it('switchDictionary to non-loaded dictionary does nothing', async () => {
      const cet4Sentences = [{ id: 'c1', english: 'CET4', chinese: '四级', blanks: [], level: 'easy' }];

      vi.mocked(loadDictionary).mockResolvedValue(cet4Sentences as unknown as typeof mockSentences);

      const { result } = renderHook(() => useDictionaryIndex());

      await act(async () => {
        await result.current.loadDictionary('cet4');
      });

      // Try switching to never-loaded dictionary
      act(() => {
        result.current.switchDictionary('toefl');
      });

      expect(result.current.currentId).toBe('cet4');
      expect(result.current.getLoadedDictionaries()).toEqual(['cet4']);
    });

    it('unload current dictionary when multiple are loaded updates correctly', async () => {
      const cet4Sentences = [{ id: 'c1', english: 'CET4', chinese: '四级', blanks: [], level: 'easy' }];
      const cet6Sentences = [{ id: 'c6_1', english: 'CET6', chinese: '六级', blanks: [], level: 'medium' }];
      const ieltsSentences = [{ id: 'i1', english: 'IELTS', chinese: '雅思', blanks: [], level: 'hard' }];

      vi.mocked(loadDictionary)
        .mockResolvedValueOnce(cet4Sentences as unknown as typeof mockSentences)
        .mockResolvedValueOnce(cet6Sentences as unknown as typeof mockSentences)
        .mockResolvedValueOnce(ieltsSentences as unknown as typeof mockSentences);

      const { result } = renderHook(() => useDictionaryIndex());

      await act(async () => {
        await result.current.loadDictionary('cet4');
      });
      await act(async () => {
        await result.current.loadDictionary('cet6');
      });
      await act(async () => {
        await result.current.loadDictionary('ielts');
      });

      expect(result.current.getLoadedDictionaries()).toHaveLength(3);
      expect(result.current.currentId).toBe('ielts');

      // Unload current dictionary (IELTS)
      act(() => {
        result.current.unloadDictionary('ielts');
      });

      expect(result.current.getLoadedDictionaries()).toHaveLength(2);
      // Should auto-switch to first remaining in insertion order: cet4
      expect(result.current.currentId).toBe('cet4');
      expect(result.current.getById('i1')).toBeUndefined();
    });

    it('unload non-existent dictionary is safe', async () => {
      const cet4Sentences = [{ id: 'c1', english: 'CET4', chinese: '四级', blanks: [], level: 'easy' }];

      vi.mocked(loadDictionary).mockResolvedValue(cet4Sentences as unknown as typeof mockSentences);

      const { result } = renderHook(() => useDictionaryIndex());

      await act(async () => {
        await result.current.loadDictionary('cet4');
      });

      // Try unloading non-existent dictionary
      act(() => {
        result.current.unloadDictionary('nonexistent');
      });

      // Should not affect current state
      expect(result.current.currentId).toBe('cet4');
      expect(result.current.getLoadedDictionaries()).toEqual(['cet4']);
      expect(result.current.getById('c1')).toBe('CET4');
    });

    it('getStats returns correct stats for current dictionary', async () => {
      const cet4Sentences = [
        { id: 'c1', english: 'word1', chinese: '词1', blanks: [], level: 'easy' },
        { id: 'c2', english: 'word2', chinese: '词2', blanks: [], level: 'medium' },
        { id: 'c3', english: 'word3', chinese: '词3', blanks: [], level: 'medium' },
      ];
      const cet6Sentences = [
        { id: 'c6_1', english: 'adv1', chinese: '进阶1', blanks: [], level: 'hard' },
        { id: 'c6_2', english: 'adv2', chinese: '进阶2', blanks: [], level: 'hard' },
      ];

      vi.mocked(loadDictionary)
        .mockResolvedValueOnce(cet4Sentences as unknown as typeof mockSentences)
        .mockResolvedValueOnce(cet6Sentences as unknown as typeof mockSentences);

      const { result } = renderHook(() => useDictionaryIndex());

      await act(async () => {
        await result.current.loadDictionary('cet4');
      });

      let stats = result.current.getStats();
      expect(stats?.totalCount).toBe(3);
      expect(stats?.byLevel.easy).toBe(1);
      expect(stats?.byLevel.medium).toBe(2);

      await act(async () => {
        await result.current.loadDictionary('cet6');
      });

      stats = result.current.getStats();
      expect(stats?.totalCount).toBe(2);
      expect(stats?.byLevel.hard).toBe(2);

      // Switch back to CET4
      act(() => {
        result.current.switchDictionary('cet4');
      });

      stats = result.current.getStats();
      expect(stats?.totalCount).toBe(3);
    });
  });
});