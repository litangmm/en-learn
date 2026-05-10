import type { Sentence, ChoiceOption, AdaptiveConfig } from '@/data/types';
import { isDefinitionSentence } from '@/data/types';
import { storage } from '@/services/storage';

/**
 * Hook providing adaptive distractor selection for multiple-choice practice.
 *
 * The key insight: if a user picked wrong sentence "A" multiple times when the
 * correct answer was sentence "B", then "A" is a good distractor for "B".
 */
export function useAdaptivePractice() {
  /**
   * Get smart distractors based on the adaptive config strategy.
   *
   * @param correctAnswerId - The ID of the correct answer
   * @param allSentences - All available sentences to choose from
   * @returns Array of 4 ChoiceOptions (1 correct + 3 distractors)
   */
  function getSmartDistractors(
    correctAnswerId: string,
    allSentences: Sentence[]
  ): ChoiceOption[] {
    if (allSentences.length < 4) {
      return [];
    }

    // Load config and mistakes
    const config: AdaptiveConfig = storage.getAdaptiveConfig();
    const mistakes = storage.getMistakes();

    const strategy = config.strategy;

    // Strategy: random - return shuffled random distractors
    if (strategy === 'random' || mistakes.length === 0) {
      return getRandomDistractors(correctAnswerId, allSentences);
    }

    // Strategy: history-based or mixed
    if (strategy === 'history-based' || strategy === 'mixed') {
      return getHistoryBasedDistractors(correctAnswerId, allSentences, mistakes);
    }

    // Fallback: random
    return getRandomDistractors(correctAnswerId, allSentences);
  }

  return {
    getSmartDistractors,
    config: storage.getAdaptiveConfig(),
  };
}

/**
 * Get random distractors (baseline strategy).
 */
function getRandomDistractors(correctAnswerId: string, allSentences: Sentence[]): ChoiceOption[] {
  const distractors = allSentences
    .filter((s) => s.id !== correctAnswerId)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  const correctSentence = allSentences.find((s) => s.id === correctAnswerId);
  if (!correctSentence) {
    return [];
  }

  return [correctSentence, ...distractors]
    .sort(() => Math.random() - 0.5)
    .map((s) => sentenceToChoiceOption(s));
}

/**
 * Get distractors based on user's mistake history.
 *
 * Logic:
 * 1. Find mistakes where user selected wrong answers containing the current sentence ID
 * 2. Those wrong sentences become distractor candidates
 * 3. Sort by frequency of being confused with
 * 4. Take top N distractors (N = min(3, candidates.length))
 * 5. Fill remaining with random from allSentences
 */
function getHistoryBasedDistractors(
  correctAnswerId: string,
  allSentences: Sentence[],
  mistakes: ReturnType<typeof storage.getMistakes>
): ChoiceOption[] {
  // Find mistakes where this sentence was the correct answer
  // and user selected wrong answers
  const relevantMistakes = mistakes.filter(
    (m) => m.sentenceId === correctAnswerId && m.wrongAnswers.length > 0
  );

  // Count frequency of each wrong answer being selected
  const candidateFrequency = new Map<string, number>();
  for (const mistake of relevantMistakes) {
    for (const wrongAnswerId of mistake.wrongAnswers) {
      // Only consider wrong answers that are valid sentences in our pool
      const exists = allSentences.some((s) => s.id === wrongAnswerId && s.id !== correctAnswerId);
      if (exists) {
        candidateFrequency.set(wrongAnswerId, (candidateFrequency.get(wrongAnswerId) || 0) + 1);
      }
    }
  }

  // Sort candidates by frequency (most confused first)
  const sortedCandidates = Array.from(candidateFrequency.entries())
    .sort((a, b) => b[1] - a[1]) // descending by frequency
    .map(([id]) => id);

  // Determine how many history-based distractors to use
  const historyCount = sortedCandidates.length;

  // Take top N history-based distractors
  const historyDistractors = sortedCandidates
    .slice(0, Math.min(3, historyCount))
    .map((id) => allSentences.find((s) => s.id === id)!)
    .filter((s) => s !== undefined);

  // Fill remaining slots with random distractors
  const remainingCount = 3 - historyDistractors.length;
  const usedIds = new Set([correctAnswerId, ...historyDistractors.map((s) => s.id)]);
  const randomDistractors = allSentences
    .filter((s) => !usedIds.has(s.id))
    .sort(() => Math.random() - 0.5)
    .slice(0, remainingCount);

  const correctSentence = allSentences.find((s) => s.id === correctAnswerId);
  if (!correctSentence) {
    return [];
  }

  // Combine and shuffle
  return [correctSentence, ...historyDistractors, ...randomDistractors]
    .sort(() => Math.random() - 0.5)
    .map((s) => sentenceToChoiceOption(s));
}

/**
 * Convert a Sentence to a ChoiceOption.
 * Uses Chinese translation for definition sentences, full English for others.
 */
function sentenceToChoiceOption(sentence: Sentence): ChoiceOption {
  return {
    id: sentence.id,
    text: isDefinitionSentence(sentence) ? sentence.chinese : sentence.english,
  };
}
