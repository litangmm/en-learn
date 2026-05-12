import { useState, useCallback } from 'react';
import type { DictionaryIndex, IndexStats, Sentence } from '@/data/types';
import { buildDictionaryIndex } from '@/data/dictionaryIndex';
import { getCachedDictionary, clearDictionaryCache } from '@/data/dictionaryCache';
import { loadDictionary as loadDictionaryData } from '@/data/loader';

interface DictionaryIndexState {
  /** Map of dictionary ID -> built index */
  indices: Map<string, DictionaryIndex>;
  /** ID of the currently active dictionary */
  currentId: string | null;
  /** Whether the current index has been built */
  isIndexed: boolean;
  /** Loading state */
  isLoading: boolean;
}

export interface UseDictionaryIndexReturn {
  /** Current dictionary ID */
  currentId: string | null;
  /** Whether the current dictionary index is built */
  isIndexed: boolean;
  /** Whether a dictionary is currently being loaded */
  isLoading: boolean;

  // Lookup methods (delegate to current index)
  /**
   * Get sentence text by ID from current index.
   * @param id - The sentence ID
   * @returns The sentence text, or undefined if not found
   */
  getById: (id: string) => string | undefined;
  /**
   * Get sentence IDs containing the given word (case-insensitive) from current index.
   * @param word - The word to search for
   * @returns Array of sentence IDs containing the word
   */
  getByWord: (word: string) => string[];
  /**
   * Get all sentence IDs at a given level from current index.
   * @param level - The level to filter by
   * @returns Array of sentence IDs at that level
   */
  getByLevel: (level: string) => string[];
  /**
   * Get statistics about the current index.
   * @returns IndexStats object with index metrics
   */
  getStats: () => IndexStats | null;
  /**
   * Get all indexed sentence IDs from current index.
   * @returns Array of all sentence IDs in the index
   */
  getIndexedIds: () => string[];

  // Dictionary management
  /**
   * Load a dictionary and build its index.
   * The index is built lazily on first load.
   * @param id - The dictionary ID to load
   * @returns Promise that resolves when dictionary is loaded and indexed
   */
  loadDictionary: (id: string) => Promise<void>;
  /**
   * Switch to a previously loaded dictionary without reloading.
   * If the dictionary is not loaded, does nothing.
   * @param id - The dictionary ID to switch to
   */
  switchDictionary: (id: string) => void;
  /**
   * Get list of all currently loaded dictionary IDs.
   * @returns Array of dictionary IDs that have been loaded
   */
  getLoadedDictionaries: () => string[];
  /**
   * Unload a specific dictionary from memory, removing its index.
   * @param id - The dictionary ID to unload
   */
  unloadDictionary: (id: string) => void;
  /**
   * Clear all cached dictionaries and indices.
   */
  clearAll: () => void;
}

/**
 * Hook for managing dictionary indices with lazy initialization.
 *
 * Features:
 * - Lazy initialization: builds index on first loadDictionary call
 * - Multiple dictionary support: manages indices for multiple dictionaries
 * - Current index state management
 * - Stable callbacks via trackProgressRef pattern
 *
 * @example
 * ```typescript
 * const {
 *   currentId,
 *   isIndexed,
 *   getById,
 *   getByWord,
 *   getByLevel,
 *   getStats,
 *   getIndexedIds,
 *   loadDictionary,
 * } = useDictionaryIndex();
 *
 * // Load a dictionary (index built lazily)
 * await loadDictionary('cet4');
 *
 * // Now the index is ready
 * const ids = getByWord('hello'); // O(1) lookup
 * ```
 */
export function useDictionaryIndex(): UseDictionaryIndexReturn {
  // Manage index state with lazy initialization
  const [state, setState] = useState<DictionaryIndexState>({
    indices: new Map(),
    currentId: null,
    isIndexed: false,
    isLoading: false,
  });

  /**
   * Get the current index from state.
   */
  const getCurrentIndex = useCallback((): DictionaryIndex | null => {
    if (!state.currentId) {
      return null;
    }
    return state.indices.get(state.currentId) || null;
  }, [state.indices, state.currentId]);

  /**
   * Load a dictionary and build its index lazily.
   * The index is only built on the first loadDictionary call for a dictionary.
   */
  const loadDictionary = useCallback(async (id: string): Promise<void> => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Try to get from cache first
      let sentences: Sentence[];

      // Check if dictionary is already loaded in cache
      const cached = getCachedDictionary(id);
      if (cached) {
        sentences = cached;
      } else {
        // Load the dictionary data using the loader
        sentences = await loadDictionaryData(id);
      }

      // Lazily build index on first loadDictionary call
      setState((prev) => {
        // Check if we already have an index for this dictionary
        if (prev.indices.has(id) && prev.currentId === id) {
          return { ...prev, isLoading: false, isIndexed: true };
        }

        // Build the index
        const newIndex = buildDictionaryIndex(sentences);

        // Update indices map
        const newIndices = new Map(prev.indices);
        newIndices.set(id, newIndex);

        return {
          ...prev,
          indices: newIndices,
          currentId: id,
          isIndexed: true,
          isLoading: false,
        };
      });
    } catch (error) {
      setState((prev) => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  /**
   * Clear all cached dictionaries and indices.
   */
  const clearAll = useCallback(() => {
    clearDictionaryCache();
    setState({
      indices: new Map(),
      currentId: null,
      isIndexed: false,
      isLoading: false,
    });
  }, []);

  /**
   * Switch to a previously loaded dictionary without reloading.
   * If the dictionary is not loaded, does nothing.
   */
  const switchDictionary = useCallback((id: string): void => {
    setState((prev) => {
      // Only switch if the dictionary is already loaded
      if (!prev.indices.has(id)) {
        return prev;
      }
      return {
        ...prev,
        currentId: id,
        isIndexed: true,
      };
    });
  }, []);

  /**
   * Get list of all currently loaded dictionary IDs.
   */
  const getLoadedDictionaries = useCallback((): string[] => {
    return Array.from(state.indices.keys());
  }, [state.indices]);

  /**
   * Unload a specific dictionary from memory, removing its index.
   */
  const unloadDictionary = useCallback((id: string): void => {
    setState((prev) => {
      const newIndices = new Map(prev.indices);
      newIndices.delete(id);

      // If unloading the current dictionary, reset state
      if (prev.currentId === id) {
        // Set currentId to first remaining index, or null if none
        const remainingIds = Array.from(newIndices.keys());
        const newCurrentId = remainingIds.length > 0 ? remainingIds[0] : null;
        return {
          ...prev,
          indices: newIndices,
          currentId: newCurrentId,
          isIndexed: newCurrentId !== null,
        };
      }

      return {
        ...prev,
        indices: newIndices,
      };
    });
  }, []);

  // Lookup methods - delegate to current index
  const getById = useCallback((id: string): string | undefined => {
    return getCurrentIndex()?.getById(id);
  }, [getCurrentIndex]);

  const getByWord = useCallback((word: string): string[] => {
    return getCurrentIndex()?.getByWord(word) || [];
  }, [getCurrentIndex]);

  const getByLevel = useCallback((level: string): string[] => {
    return getCurrentIndex()?.getByLevel(level) || [];
  }, [getCurrentIndex]);

  const getStats = useCallback((): IndexStats | null => {
    return getCurrentIndex()?.getStats() || null;
  }, [getCurrentIndex]);

  const getIndexedIds = useCallback((): string[] => {
    return getCurrentIndex()?.getIndexedIds() || [];
  }, [getCurrentIndex]);

  return {
    // State
    currentId: state.currentId,
    isIndexed: state.isIndexed,
    isLoading: state.isLoading,

    // Lookup methods
    getById,
    getByWord,
    getByLevel,
    getStats,
    getIndexedIds,

    // Dictionary management
    loadDictionary,
    switchDictionary,
    getLoadedDictionaries,
    unloadDictionary,
    clearAll,
  };
}