import { useState, useCallback, useMemo, useEffect } from 'react';
import type { Sentence } from '@/data/types';
import { loadDictionary } from '@/data/loader';

export interface UserAnswer {
  sentenceId: string;
  answers: string[];
  isCorrect: boolean;
  attempts: number;
}

export interface PracticeState {
  currentIndex: number;
  userAnswers: UserAnswer[];
  currentInputs: string[];
  showResult: boolean;
  isCorrect: boolean;
  attempts: number;
  isComplete: boolean;
  score: number;
}

export function usePractice(dictionaryId: string) {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [state, setState] = useState<PracticeState>({
    currentIndex: 0,
    userAnswers: [],
    currentInputs: [],
    showResult: false,
    isCorrect: false,
    attempts: 0,
    isComplete: false,
    score: 0,
  });

  // Load dictionary data when id changes
  useEffect(() => {
    setIsLoading(true);
    setError(null);
    loadDictionary(dictionaryId)
      .then((data) => {
        setSentences(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '加载失败');
        setIsLoading(false);
      });
  }, [dictionaryId]);

  // Reset state when sentences load
  useEffect(() => {
    if (sentences.length > 0) {
      setState({
        currentIndex: 0,
        userAnswers: [],
        currentInputs: new Array(sentences[0].blanks.length).fill(''),
        showResult: false,
        isCorrect: false,
        attempts: 0,
        isComplete: false,
        score: 0,
      });
    }
  }, [sentences]);

  const shuffledSentences = useMemo(() => {
    if (sentences.length === 0) return [];
    const shuffled = [...sentences].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10);
  }, [sentences]);

  const currentSentence: Sentence | undefined = shuffledSentences[state.currentIndex];

  const initializeInputs = useCallback(() => {
    if (currentSentence) {
      setState((prev) => ({
        ...prev,
        currentInputs: new Array(currentSentence.blanks.length).fill(''),
        showResult: false,
        isCorrect: false,
        attempts: 0,
      }));
    }
  }, [currentSentence]);

  const setInput = useCallback((index: number, value: string) => {
    setState((prev) => {
      const newInputs = [...prev.currentInputs];
      newInputs[index] = value;
      return { ...prev, currentInputs: newInputs };
    });
  }, []);

  const checkAnswer = useCallback(() => {
    if (!currentSentence) return;

    const correctAnswers = currentSentence.blanks.map((b) => b.word.toLowerCase().trim());
    const userAnswers = state.currentInputs.map((i) => i.toLowerCase().trim());

    const isCorrect = correctAnswers.every((correct, idx) => correct === userAnswers[idx]);
    const newAttempts = state.attempts + 1;

    if (isCorrect) {
      const pointsEarned = Math.max(10 - (newAttempts - 1) * 3, 5);

      setState((prev) => ({
        ...prev,
        showResult: true,
        isCorrect: true,
        attempts: newAttempts,
        score: prev.score + pointsEarned,
        userAnswers: [
          ...prev.userAnswers,
          {
            sentenceId: currentSentence.id,
            answers: [...prev.currentInputs],
            isCorrect: true,
            attempts: newAttempts,
          },
        ],
      }));
    } else {
      setState((prev) => ({
        ...prev,
        showResult: true,
        isCorrect: false,
        attempts: newAttempts,
      }));
    }
  }, [currentSentence, state.currentInputs, state.attempts]);

  const nextSentence = useCallback(() => {
    setState((prev) => {
      const nextIndex = prev.currentIndex + 1;
      const isComplete = nextIndex >= shuffledSentences.length;

      if (isComplete) {
        return {
          ...prev,
          isComplete: true,
          showResult: false,
        };
      }

      return {
        ...prev,
        currentIndex: nextIndex,
        showResult: false,
        isCorrect: false,
        attempts: 0,
        currentInputs: new Array(shuffledSentences[nextIndex].blanks.length).fill(''),
      };
    });
  }, [shuffledSentences]);

  const retry = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showResult: false,
      isCorrect: false,
    }));
  }, []);

  const reset = useCallback(() => {
    setState({
      currentIndex: 0,
      userAnswers: [],
      currentInputs: new Array(shuffledSentences[0]?.blanks.length || 1).fill(''),
      showResult: false,
      isCorrect: false,
      attempts: 0,
      isComplete: false,
      score: 0,
    });
  }, [shuffledSentences]);

  const progress = useMemo(() => {
    if (shuffledSentences.length === 0) return 0;
    return ((state.currentIndex + (state.showResult && state.isCorrect ? 1 : 0)) / shuffledSentences.length) * 100;
  }, [state.currentIndex, state.showResult, state.isCorrect, shuffledSentences.length]);

  const totalQuestions = shuffledSentences.length;
  const currentQuestion = state.currentIndex + 1;

  return {
    state,
    currentSentence,
    progress,
    totalQuestions,
    currentQuestion,
    setInput,
    checkAnswer,
    nextSentence,
    retry,
    reset,
    initializeInputs,
    shuffledSentences,
    isLoading,
    error,
  };
}
