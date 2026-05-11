import type { Sentence } from '@/data/types';

/** Maximum number of dictionaries to keep in cache */
const MAX_SIZE = 5;

/** Module-level cache storage - acts as LRU by maintaining insertion order */
const cache = new Map<string, Sentence[]>();

/** Move entry to end, marking as recently used (LRU behavior) */
function touch(key: string): void {
  const value = cache.get(key);
  if (value !== undefined) {
    cache.delete(key);
    cache.set(key, value);
  }
}

/** Evict the least recently used entry (first in insertion order) */
function evictLRU(): void {
  const lruKey = cache.keys().next().value;
  if (lruKey !== undefined) {
    cache.delete(lruKey);
  }
}

/** Internal: actually load raw dictionary data */
async function loadRawDictionary(id: string): Promise<Sentence[]> {
  switch (id) {
    case 'junior': return (await import('./junior')).sentences;
    case 'senior': return (await import('./senior')).sentences;
    case 'cet4': return (await import('./cet4')).sentences;
    case 'cet6': return (await import('./cet6')).sentences;
    case 'ielts': return (await import('./ielts')).sentences;
    case 'toefl': return (await import('./toefl')).sentences;
    case 'gre': return (await import('./gre')).sentences;
    default: throw new Error(`Unknown dictionary: ${id}`);
  }
}

/**
 * Gets a cached dictionary if present, marking it as recently used.
 * Returns undefined if not in cache.
 */
export function getCachedDictionary(id: string): Sentence[] | undefined {
  if (!cache.has(id)) {
    return undefined;
  }
  touch(id);
  return cache.get(id);
}

/**
 * Prefetches a dictionary into the cache without returning the data.
 * If already cached, refreshes its position as recently used.
 * Evicts least recently used entry if cache exceeds max size.
 */
export function prefetchDictionary(id: string): void {
  // If already cached, just move to end (mark as recently used)
  if (cache.has(id)) {
    touch(id);
    return;
  }

  // Evict LRU entry if at capacity
  if (cache.size >= MAX_SIZE) {
    evictLRU();
  }

  // Load and cache the dictionary (fire-and-forget, no unhandled rejections)
  loadRawDictionary(id)
    .then((data) => {
      // Only cache if not already cached (may have been populated by getCachedDictionary)
      if (!cache.has(id)) {
        // Check capacity again (another prefetch may have filled it)
        if (cache.size >= MAX_SIZE) {
          evictLRU();
        }
        cache.set(id, data);
      }
    })
    .catch(() => {
      // Silently ignore errors for fire-and-forget prefetch
    });
}

/**
 * Clears all entries from the dictionary cache.
 */
export function clearDictionaryCache(): void {
  cache.clear();
}
