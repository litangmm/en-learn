// Mock useAdaptivePractice - must be before the import
vi.mock('@/hooks/useAdaptivePractice', () => ({
  useAdaptivePractice: vi.fn(() => ({
    getSmartDistractors: vi.fn(() => []),
  })),
}));

// Mock useAdaptiveDifficulty - must be before the import
vi.mock('@/hooks/useAdaptiveDifficulty', () => ({
  useAdaptiveDifficulty: vi.fn(() => ({
    getDifficultyAdjustedSentenceIds: vi.fn((ids) => ids.slice(0, 10)),
    trackSessionAccuracy: vi.fn(),
  })),
}));

// Mock useHintLevel
vi.mock('@/hooks/useHintLevel', () => ({
  useHintLevel: vi.fn(() => ({
    recordCorrectAnswer: vi.fn(),
    recordWrongAnswer: vi.fn(),
    shouldShowHint: vi.fn(() => false),
  })),
}));

// Mock useQuestionWeighting
vi.mock('@/hooks/useQuestionWeighting', () => ({
  useQuestionWeighting: vi.fn(() => ({
    getSentenceWeight: vi.fn(() => 1.0),
    getWeightedSentenceIds: vi.fn((ids) => ids.slice(0, 10)),
    getWeightExplanation: vi.fn(() => null),
  })),
}));

// Mock usePersonalWordIndex
vi.mock('@/hooks/usePersonalWordIndex', () => ({
  usePersonalWordIndex: vi.fn(() => ({
    getAllAsSentences: vi.fn(() => []),
  })),
}));

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePractice } from '../usePractice';
import { storage } from '@/services/storage';
import { loadDictionary } from '@/data/loader';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePractice } from '../usePractice';

const mockSentences = [
  {
    id: '1',
    english: 'The early bird catches the worm.',
    chinese: '早起的鸟儿有虫吃。',
    blanks: [{ word: 'catches', hint: '抓住' }],
    level: 'junior',
  },
  {
    id: '2',
    english: 'Actions speak louder than words.',
    chinese: '行动胜于言辞。',
    blanks: [
      { word: 'Actions', hint: '行动' },
      { word: 'words', hint: '言辞' },
    ],
    level: 'junior',
  },
  {
    id: '3',
    english: 'Practice makes perfect.',
    chinese: '熟能生巧。',
    blanks: [{ word: 'perfect', hint: '完美的' }],
    level: 'junior',
  },
  {
    id: '4',
    english: 'Better late than never.',
    chinese: '迟做总比不做好。',
    blanks: [{ word: 'never', hint: '从不' }],
    level: 'junior',
  },
  {
    id: '5',
    english: 'Time flies.',
    chinese: '时光飞逝。',
    blanks: [{ word: 'flies', hint: '飞' }],
    level: 'junior',
  },
];

// Definition sentence: word is quoted in the English text
const mockDefinitionSentences = [
  {
    id: 'def1',
    english: 'Nonexistent; "the thumb is absent"',
    chinese: '不存在的；拇指缺失的',
    blanks: [{ word: 'thumb', sentence: 'absent', options: ['拇指', '手指', '手掌', '手腕'] }],
    level: 'junior',
  },
  {
    id: 'def2',
    english: 'A person who "leads" others',
    chinese: '领导他人的人',
    blanks: [{ word: 'leads', hint: '领导' }],
    level: 'junior',
  },
  {
    id: 'def3',
    english: 'Someone who is "brave"',
    chinese: '勇敢的人',
    blanks: [{ word: 'brave', hint: '勇敢' }],
    level: 'junior',
  },
  {
    id: 'def4',
    english: 'An "absent" teacher',
    chinese: '缺席的老师',
    blanks: [{ word: 'absent', hint: '缺席' }],
    level: 'junior',
  },
  {
    id: 'def5',
    english: 'A normal sentence without quotes.',
    chinese: '一个没有引号的正常句子。',
    blanks: [{ word: 'normal', hint: '正常的' }],
    level: 'junior',
  },
];

vi.mock('@/data/loader', () => ({
  loadDictionary: vi.fn(),
}));

describe('usePractice multiple-choice', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    localStorage.clear();
    // Default mock for most tests
    vi.mocked(loadDictionary).mockResolvedValue(mockSentences);
    // Mock getPersonalWords to return empty array (no personal words)
    vi.spyOn(storage, 'getPersonalWords').mockReturnValue([]);
    // Mock getMistakes and getAdaptiveConfig for useAdaptivePractice
    vi.spyOn(storage, 'getMistakes').mockReturnValue([]);
    vi.spyOn(storage, 'getAdaptiveConfig').mockReturnValue({ strategy: 'random', historyWeight: 0.5, difficultyCalibration: { enabled: true, targetAccuracy: 0.75, toleranceBand: 0.05, calibrationSpeed: 0.1 } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.mocked(loadDictionary).mockReset();
  });

  it('should generate 4 options containing currentSentence', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toHaveLength(4);
    const hasCurrent = result.current.options.some(
      (s) => s.id === result.current.currentSentence?.id
    );
    expect(hasCurrent).toBe(true);
  });

  it('should update selectedChoiceId via selectChoice', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.selectChoice('2');
    });

    expect(result.current.state.selectedChoiceId).toBe('2');
  });

  it('should mark correct when checkAnswer with correct id', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const correctId = result.current.currentSentence!.id;

    act(() => {
      result.current.checkAnswer(correctId);
    });

    expect(result.current.state.showResult).toBe(true);
    expect(result.current.state.isCorrect).toBe(true);
    expect(result.current.state.score).toBe(10);
    expect(result.current.state.attempts).toBe(1);
    expect(result.current.state.userAnswers).toHaveLength(1);
    expect(result.current.state.userAnswers[0]).toMatchObject({
      sentenceId: correctId,
      isCorrect: true,
      attempts: 1,
    });
  });

  it('should mark wrong when checkAnswer with wrong id', async () => {
    vi.spyOn(storage, 'loadSession').mockReturnValue(null);

    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const correctId = result.current.currentSentence!.id;
    const wrongId = mockSentences.find((s) => s.id !== correctId)!.id;

    act(() => {
      result.current.checkAnswer(wrongId);
    });

    expect(result.current.state.showResult).toBe(true);
    expect(result.current.state.isCorrect).toBe(false);
    expect(result.current.state.score).toBe(0);
    expect(result.current.state.userAnswers).toHaveLength(0);
  });

  it('should reset selectedChoiceId on nextSentence', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.selectChoice('2');
    });
    expect(result.current.state.selectedChoiceId).toBe('2');

    act(() => {
      result.current.nextSentence();
    });

    expect(result.current.state.selectedChoiceId).toBeNull();
  });

  it('should reset selectedChoiceId on reset', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.selectChoice('2');
    });
    expect(result.current.state.selectedChoiceId).toBe('2');

    act(() => {
      result.current.reset();
    });

    expect(result.current.state.selectedChoiceId).toBeNull();
  });

  it('should show English text as option text for normal sentences', async () => {
    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // For normal sentences (no quoted word in English), options should show English text
    const firstOption = result.current.options[0];
    expect(firstOption.text).toBe('The early bird catches the worm.');
    // Should not be Chinese
    expect(firstOption.text).not.toContain('早起的鸟儿');
  });

  it('should show Chinese text as option text for definition sentences', async () => {
    // Reset the mock and set it to return definition sentences
    vi.mocked(loadDictionary).mockReset();
    vi.mocked(loadDictionary).mockResolvedValue(mockDefinitionSentences);

    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // For definition sentences (word quoted in English), options should show Chinese text
    // Find the first definition sentence option
    const definitionOption = result.current.options.find(
      (opt) => opt.text === '不存在的；拇指缺失的' || opt.text === '领导他人的人'
    );
    expect(definitionOption).toBeDefined();
    // Should contain Chinese characters
    expect(definitionOption?.text).toMatch(/[一-鿿]/);

    // Reset back to default mock for other tests
    vi.mocked(loadDictionary).mockReset();
    vi.mocked(loadDictionary).mockResolvedValue(mockSentences);
  });

  it('should correctly identify definition sentences vs normal sentences', async () => {
    // Reset the mock and set it to return mixed sentences
    vi.mocked(loadDictionary).mockReset();
    // Ensure we have at least 2 normal and 2 definition sentences for 4 options
    const mixedSentences = [
      ...mockSentences.slice(0, 2), // 2 normal sentences
      ...mockDefinitionSentences.slice(0, 4), // 4 definition sentences (more than needed)
    ];
    vi.mocked(loadDictionary).mockResolvedValue(mixedSentences);

    const { result } = renderHook(() => usePractice('test'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check that options contain both English (for normal) and Chinese (for definition)
    const optionTexts = result.current.options.map((opt) => opt.text);

    // At least one option should be in Chinese (definition sentence)
    const hasChineseOption = optionTexts.some((text) => /[一-鿿]/.test(text));
    expect(hasChineseOption).toBe(true);

    // At least one option should be in English (normal sentence)
    const hasEnglishOption = optionTexts.some((text) => !/[一-鿿]/.test(text) && text.includes(' '));
    expect(hasEnglishOption).toBe(true);

    // Reset back to default mock for other tests
    vi.mocked(loadDictionary).mockReset();
    vi.mocked(loadDictionary).mockResolvedValue(mockSentences);
  });

});
