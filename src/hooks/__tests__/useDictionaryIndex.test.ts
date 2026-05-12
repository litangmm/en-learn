import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDictionaryIndex } from '../useDictionaryIndex';
import { loadDictionary } from '@/data/loader';
import { getCachedDictionary, clearDictionaryCache } from '@/data/dictionaryCache';

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
    let resolveLoad: (value: typeof mockSentences) => void;
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
    let rejectLoad: (error: Error) => void;
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
});