import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Sentence, ChoiceOption, PracticeMode } from '@/data/types';
import { isDefinitionSentence } from '@/data/types';
import { loadDictionary } from '@/data/loader';
import { getDictionaryById } from '@/data/dictionaries';
import { storage } from '@/services/storage';
import { useAdaptivePractice } from '@/hooks/useAdaptivePractice';
import { useHintLevel } from '@/hooks/useHintLevel';
import { useQuestionWeighting } from '@/hooks/useQuestionWeighting';

export interface UserAnswer {
  sentenceId: string;
  answers: string[];
  isCorrect: boolean;
  attempts: number;
}

export interface SessionMistake {
  sentenceId: string;
  wrongAnswers: string[];
  correctAnswers: string[] | null;
  attempts: number;
  dictionaryId: string;
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
  selectedChoiceId?: string | null;
  orderedTokenIds: string[];
  /** True when user is in retry mode (showResult cleared, waiting for new answer) */
  isRetrying?: boolean;
}

export function usePractice(dictionaryId: string, sentenceIds?: string[], mode?: PracticeMode) {
  // Adaptive practice hook for smart distractor selection
  const { getSmartDistractors } = useAdaptivePractice();
  // Hint level hook for dynamic hint adjustment
  const { recordCorrectAnswer, recordWrongAnswer, shouldShowHint } = useHintLevel();
  // Question weighting hook for adaptive sentence selection
  const { getWeightedSentenceIds } = useQuestionWeighting();

  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingMistakes, setPendingMistakes] = useState<Record<string, SessionMistake>>({});
  const sessionStartTimeRef = useRef<number | null>(null);
  const [shuffleSeed, setShuffleSeed] = useState(0);

  const [state, setState] = useState<PracticeState>({
    currentIndex: 0,
    userAnswers: [],
    currentInputs: [],
    showResult: false,
    isCorrect: false,
    attempts: 0,
    isComplete: false,
    score: 0,
    selectedChoiceId: null,
    orderedTokenIds: [],
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
      const persisted = storage.loadSession();
      if (persisted && persisted.dictionaryId === dictionaryId && !persisted.session.isComplete) {
        const restoredIndex = persisted.session.currentIndex;
        const targetSentence = sentences[restoredIndex] ?? sentences[0];
        setState({
          ...persisted.session,
          currentInputs: new Array(targetSentence.blanks.length).fill(''),
          selectedChoiceId: null,
          orderedTokenIds: [],
        });
        // Don't set start time for restored sessions — duration would be inaccurate
        sessionStartTimeRef.current = null;
      } else {
        setState({
          currentIndex: 0,
          userAnswers: [],
          currentInputs: new Array(sentences[0].blanks.length).fill(''),
          showResult: false,
          isCorrect: false,
          attempts: 0,
          isComplete: false,
          score: 0,
          selectedChoiceId: null,
          orderedTokenIds: [],
        });
        sessionStartTimeRef.current = Date.now();
      }
      setPendingMistakes({});
    }
  }, [sentences, dictionaryId]);

  const shuffledSentences = useMemo(() => {
    if (sentences.length === 0) return [];

    // Start with sentences filtered by sentenceIds if provided
    let targetSentences = sentences;
    if (sentenceIds && sentenceIds.length > 0) {
      const idSet = new Set(sentenceIds);
      const filtered = sentences.filter((s) => idSet.has(s.id));
      // Only use filtered if we have matches, otherwise use all sentences
      if (filtered.length > 0) {
        targetSentences = filtered;
      }
    }

    // Get all mistakes from storage for weighting
    const allMistakes = storage.getMistakes();
    const hasMistakes = allMistakes.length > 0;

    // Get all sentence IDs from target sentences
    const allSentenceIds = targetSentences.map((s) => s.id);

    // Use weighted shuffle if mistakes exist, otherwise simple shuffle
    let selectedIds: string[];
    if (hasMistakes) {
      // Use weighted selection to prioritize problematic sentences
      // Pass Date.now() for accurate spaced repetition state evaluation
      selectedIds = getWeightedSentenceIds(allSentenceIds, allMistakes, 10, Date.now());
    } else {
      // Fallback to simple shuffle when no mistakes exist
      const shuffled = [...allSentenceIds].sort(() => Math.random() - 0.5);
      selectedIds = shuffled.slice(0, 10);
    }

    // Map IDs back to Sentence objects, maintaining the selected order
    const idToSentence = new Map(targetSentences.map((s) => [s.id, s]));
    const result = selectedIds
      .map((id) => idToSentence.get(id))
      .filter((s): s is Sentence => s !== undefined);

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sentences, sentenceIds, shuffleSeed]);

  // Debounced save session
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (sentences.length === 0) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (state.isComplete) {
        storage.clearSession();
      } else {
        storage.saveSession(dictionaryId, state);
      }
    }, 500);
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, dictionaryId, sentences]);

  // Persist mistakes when session completes
  useEffect(() => {
    if (state.isComplete && Object.keys(pendingMistakes).length > 0) {
      Object.values(pendingMistakes).forEach((m) => {
        storage.addMistake({
          sentenceId: m.sentenceId,
          wrongAnswers: m.wrongAnswers,
          correctAnswers: m.correctAnswers || [],
          attempts: m.attempts,
          timestamp: Date.now(),
          dictionaryId: m.dictionaryId,
          reviewedCount: 0,
        });
      });
      setPendingMistakes({});
    }
  }, [state.isComplete, pendingMistakes]);

  // Record history when session completes
  useEffect(() => {
    if (state.isComplete && sessionStartTimeRef.current !== null) {
      const duration = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
      const correctCount = state.userAnswers.filter((a) => a.isCorrect).length;
      const totalQuestions = shuffledSentences.length;
      const accuracy = totalQuestions > 0
        ? Math.round((correctCount / totalQuestions) * 100)
        : 0;
      const dict = getDictionaryById(dictionaryId);

      storage.addHistory({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        duration: Math.max(duration, 1),
        dictionaryId,
        dictionaryName: dict?.name || dictionaryId,
        score: state.score,
        totalQuestions,
        correctCount,
        accuracy,
      });

      sessionStartTimeRef.current = null;
    }
  }, [state.isComplete, state.userAnswers, state.score, dictionaryId, shuffledSentences.length]);

  const currentSentence: Sentence | undefined = shuffledSentences[state.currentIndex];

  // Generate 4 multiple-choice options (correct + 3 distractors)
  // Uses adaptive strategy to prioritize distractors the user has previously confused with
  // Only applies when mode is 'multiple-choice', otherwise returns empty array
  const adaptiveDistractors = useMemo<ChoiceOption[]>(() => {
    if (!currentSentence || sentences.length < 4 || mode !== 'multiple-choice') return [];
    return getSmartDistractors(currentSentence.id, currentSentence.id, sentences);
  }, [currentSentence, sentences, mode, getSmartDistractors]);

  // Fallback to random if getSmartDistractors returns less than 4 options
  const options = useMemo<ChoiceOption[]>(() => {
    if (adaptiveDistractors.length >= 4) {
      return adaptiveDistractors;
    }
    // Fallback to random distractors
    const distractors = sentences
      .filter((s) => s.id !== currentSentence?.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    if (!currentSentence || distractors.length < 3) return [];
    return [currentSentence, ...distractors]
      .sort(() => Math.random() - 0.5)
      .map((s) => ({
        id: s.id,
        // For definition sentences, use Chinese translation as option text (more readable)
        // For normal sentences, use full English sentence
        text: isDefinitionSentence(s) ? s.chinese : s.english,
      }));
  }, [currentSentence, sentences, adaptiveDistractors]);

  // Generate tokens from current sentence for sentence-reorder mode
  const sentenceTokens = useMemo(() => {
    if (!currentSentence) return [];
    const words = currentSentence.english.match(/\S+/g) || [];
    return words.map((text, idx) => ({
      id: `${currentSentence.id}-token-${idx}`,
      text,
    }));
  }, [currentSentence]);

  const initializeInputs = useCallback(() => {
    if (currentSentence) {
      setState((prev) => ({
        ...prev,
        currentInputs: new Array(currentSentence.blanks.length).fill(''),
        showResult: false,
        isCorrect: false,
        attempts: 0,
        selectedChoiceId: null,
        orderedTokenIds: [],
      }));
    }
  }, [currentSentence]);

  const selectChoice = useCallback((choiceId: string) => {
    setState((prev) => ({
      ...prev,
      selectedChoiceId: choiceId,
    }));
  }, []);

  const selectToken = useCallback((tokenId: string) => {
    setState((prev) => ({
      ...prev,
      orderedTokenIds: [...prev.orderedTokenIds, tokenId],
    }));
  }, []);

  const deselectToken = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      orderedTokenIds: prev.orderedTokenIds.filter((_, i) => i !== index),
    }));
  }, []);

  const resetTokens = useCallback(() => {
    setState((prev) => ({
      ...prev,
      orderedTokenIds: [],
    }));
  }, []);

  const setInput = useCallback((index: number, value: string) => {
    setState((prev) => {
      const newInputs = [...prev.currentInputs];
      newInputs[index] = value;
      return { ...prev, currentInputs: newInputs };
    });
  }, []);

  const checkAnswer = useCallback((param?: string | string[]) => {
    if (!currentSentence) return;

    // After retry, restore previous attempts count instead of incrementing from 0
    const baseAttempts = previousAttemptsRef.current > 0 ? previousAttemptsRef.current : state.attempts;
    const newAttempts = baseAttempts + 1;

    // Sentence-reorder mode: compare reconstructed sentence
    if (Array.isArray(param)) {
      const userSentence = param
        .map((tokenId) => sentenceTokens.find((t) => t.id === tokenId)?.text || '')
        .join(' ');
      const isCorrect = userSentence.toLowerCase().trim() === currentSentence.english.toLowerCase().trim();

      if (isCorrect) {
        setState((prev) => ({
          ...prev,
          showResult: true,
          isCorrect: true,
          attempts: newAttempts,
          isRetrying: false,
          score: prev.score + 10,
          userAnswers: [
            ...prev.userAnswers,
            {
              sentenceId: currentSentence.id,
              answers: [userSentence],
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

        setPendingMistakes((prev) => ({
          ...prev,
          [currentSentence.id]: {
            sentenceId: currentSentence.id,
            wrongAnswers: [userSentence],
            correctAnswers: [currentSentence.english],
            attempts: newAttempts,
            dictionaryId,
          },
        }));
      }
      return;
    }

    // Multiple-choice mode: compare selected option ID
    if (param !== undefined) {
      const isCorrect = param === currentSentence.id;

      if (isCorrect) {
        setState((prev) => ({
          ...prev,
          showResult: true,
          isCorrect: true,
          attempts: newAttempts,
          isRetrying: false,
          score: prev.score + 10,
          userAnswers: [
            ...prev.userAnswers,
            {
              sentenceId: currentSentence.id,
              answers: [param],
              isCorrect: true,
              attempts: newAttempts,
            },
          ],
        }));

        // Record for hint level adjustment
        recordCorrectAnswer();
      } else {
        setState((prev) => ({
          ...prev,
          showResult: true,
          isCorrect: false,
          attempts: newAttempts,
        }));

        // Record pending mistake for multiple-choice wrong answer
        setPendingMistakes((prev) => ({
          ...prev,
          [currentSentence.id]: {
            sentenceId: currentSentence.id,
            wrongAnswers: [param],
            correctAnswers: [currentSentence.id],
            attempts: newAttempts,
            dictionaryId,
          },
        }));

        // Record for hint level adjustment
        recordWrongAnswer();
      }
      return;
    }

    // Fill-in-blanks / dictation mode: compare input values
    const correctAnswers = currentSentence.blanks.map((b) => b.word.toLowerCase().trim());
    const userAnswers = state.currentInputs.map((i) => i.toLowerCase().trim());

    const isCorrect = correctAnswers.every((correct, idx) => correct === userAnswers[idx]);

    if (isCorrect) {
      const pointsEarned = Math.max(10 - (newAttempts - 1) * 3, 5);

      setState((prev) => ({
        ...prev,
        showResult: true,
        isCorrect: true,
        attempts: newAttempts,
        isRetrying: false,
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

      // Update pending mistake with correct answers if there was one
      setPendingMistakes((prev) => {
        if (!prev[currentSentence.id]) return prev;
        return {
          ...prev,
          [currentSentence.id]: {
            ...prev[currentSentence.id],
            correctAnswers: [...state.currentInputs],
            attempts: newAttempts,
          },
        };
      });

      // Record for hint level adjustment
      recordCorrectAnswer();
    } else {
      setState((prev) => ({
        ...prev,
        showResult: true,
        isCorrect: false,
        attempts: newAttempts,
      }));

      // Record/update pending mistake
      setPendingMistakes((prev) => ({
        ...prev,
        [currentSentence.id]: {
          sentenceId: currentSentence.id,
          wrongAnswers: [...state.currentInputs],
          correctAnswers: prev[currentSentence.id]?.correctAnswers ?? null,
          attempts: newAttempts,
          dictionaryId,
        },
      }));

      // Record for hint level adjustment
      recordWrongAnswer();
    }
  }, [currentSentence, state.currentInputs, state.attempts, dictionaryId, sentenceTokens, recordCorrectAnswer, recordWrongAnswer]);

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
        selectedChoiceId: null,
        orderedTokenIds: [],
      };
    });
  }, [shuffledSentences]);

  // Track previous attempts count before retry to preserve it after retry
  const previousAttemptsRef = useRef<number>(0);

  const retry = useCallback(() => {
    // Save current attempts count before clearing
    previousAttemptsRef.current = state.attempts;
    setState((prev) => ({
      ...prev,
      showResult: false,
      isCorrect: false,
      attempts: 0,
      currentInputs: new Array(currentSentence?.blanks.length || 1).fill(''),
      selectedChoiceId: null,
      orderedTokenIds: [],
      isRetrying: true,
    }));
  }, [currentSentence, state.attempts]);

  const reset = useCallback(() => {
    setShuffleSeed((prev) => prev + 1);
    setState({
      currentIndex: 0,
      userAnswers: [],
      currentInputs: new Array(shuffledSentences[0]?.blanks.length || 1).fill(''),
      showResult: false,
      isCorrect: false,
      attempts: 0,
      isComplete: false,
      score: 0,
      selectedChoiceId: null,
      orderedTokenIds: [],
    });
    setPendingMistakes({});
    sessionStartTimeRef.current = Date.now();
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
    options,
    selectChoice,
    sentenceTokens,
    selectToken,
    deselectToken,
    resetTokens,
    shouldShowHint,
  };
}
