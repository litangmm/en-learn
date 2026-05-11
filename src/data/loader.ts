import type { Sentence } from './types';
import { getCachedDictionary, prefetchDictionary } from './dictionaryCache';

export async function loadDictionary(id: string): Promise<Sentence[]> {
  // Check cache first
  const cached = getCachedDictionary(id);
  if (cached !== undefined) {
    return cached;
  }

  // Cache miss - load the data
  let sentences: Sentence[];
  switch (id) {
    case 'junior':
      sentences = (await import('./junior')).sentences;
      break;
    case 'senior':
      sentences = (await import('./senior')).sentences;
      break;
    case 'cet4':
      sentences = (await import('./cet4')).sentences;
      break;
    case 'cet6':
      sentences = (await import('./cet6')).sentences;
      break;
    case 'ielts':
      sentences = (await import('./ielts')).sentences;
      break;
    case 'toefl':
      sentences = (await import('./toefl')).sentences;
      break;
    case 'gre':
      sentences = (await import('./gre')).sentences;
      break;
    default:
      throw new Error(`Unknown dictionary: ${id}`);
  }

  // Prefetch to cache for future use
  await prefetchDictionary(id);

  return sentences;
}
