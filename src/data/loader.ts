import type { Sentence } from './types';

export async function loadDictionary(id: string): Promise<Sentence[]> {
  switch (id) {
    case 'junior':
      return (await import('./junior')).sentences;
    case 'senior':
      return (await import('./senior')).sentences;
    case 'cet4':
      return (await import('./cet4')).sentences;
    case 'cet6':
      return (await import('./cet6')).sentences;
    case 'ielts':
      return (await import('./ielts')).sentences;
    case 'toefl':
      return (await import('./toefl')).sentences;
    case 'gre':
      return (await import('./gre')).sentences;
    default:
      throw new Error(`Unknown dictionary: ${id}`);
  }
}
