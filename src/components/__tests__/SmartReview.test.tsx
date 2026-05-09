import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmartReview } from '../SmartReview';
import { storage } from '@/services/storage';
import type { Mistake } from '@/data/types';
import type { Sentence } from '@/data/types';

const mockSentences: Sentence[] = [
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
    blanks: [{ word: 'perfect', hint: '完美' }],
    level: 'cet4',
  },
];

vi.mock('@/data/loader', () => ({
  loadDictionary: vi.fn((id: string) => {
    const filtered = mockSentences.filter((s) => s.level === id);
    return Promise.resolve(filtered);
  }),
}));

function createMockMistake(overrides: Partial<Mistake> = {}): Mistake {
  return {
    sentenceId: '1',
    wrongAnswers: ['wrong'],
    correctAnswers: ['catches'],
    attempts: 2,
    timestamp: Date.now() - 3600000,
    dictionaryId: 'junior',
    reviewedCount: 0,
    ...overrides,
  };
}

describe('SmartReview', () => {
  const mockOnPracticeReview = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders empty state when no due mistakes', () => {
    vi.spyOn(storage, 'getReviewQueue').mockReturnValue([]);

    render(
      <SmartReview onPracticeReview={mockOnPracticeReview} onBack={mockOnBack} />
    );

    expect(screen.getByText('智能复习')).toBeInTheDocument();
    expect(screen.getByText('0 题到期')).toBeInTheDocument();
    expect(screen.getByText('今日无到期复习题目')).toBeInTheDocument();
    expect(screen.getByText('继续保持，到期题目会自动出现在这里')).toBeInTheDocument();
  });

  it('renders due mistakes grouped by dictionary', async () => {
    vi.spyOn(storage, 'getReviewQueue').mockReturnValue([
      createMockMistake({ sentenceId: '1', dictionaryId: 'junior' }),
      createMockMistake({ sentenceId: '2', dictionaryId: 'junior' }),
      createMockMistake({ sentenceId: '3', dictionaryId: 'cet4' }),
    ]);

    render(
      <SmartReview onPracticeReview={mockOnPracticeReview} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByText('The early bird catches the worm.')).toBeInTheDocument();
    });

    expect(screen.getByText('初中词汇')).toBeInTheDocument();
    expect(screen.getByText('CET-4')).toBeInTheDocument();
    expect(screen.getAllByText('2 题').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('1 题').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onPracticeReview with correct params when start review clicked', async () => {
    vi.spyOn(storage, 'getReviewQueue').mockReturnValue([
      createMockMistake({ sentenceId: '1', dictionaryId: 'junior' }),
      createMockMistake({ sentenceId: '2', dictionaryId: 'junior' }),
    ]);

    render(
      <SmartReview onPracticeReview={mockOnPracticeReview} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByText('The early bird catches the worm.')).toBeInTheDocument();
    });

    const startButton = screen.getByText('开始复习');
    fireEvent.click(startButton);

    expect(mockOnPracticeReview).toHaveBeenCalledWith(
      ['1', '2'],
      'junior'
    );
  });

  it('calls onBack when back button clicked', () => {
    vi.spyOn(storage, 'getReviewQueue').mockReturnValue([]);

    render(
      <SmartReview onPracticeReview={mockOnPracticeReview} onBack={mockOnBack} />
    );

    const backButton = screen.getByRole('button', { name: '' });
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('displays reviewed count correctly', async () => {
    vi.spyOn(storage, 'getReviewQueue').mockReturnValue([
      createMockMistake({ sentenceId: '1', dictionaryId: 'junior', reviewedCount: 3 }),
    ]);

    render(
      <SmartReview onPracticeReview={mockOnPracticeReview} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByText('The early bird catches the worm.')).toBeInTheDocument();
    });

    expect(screen.getByText('已复习 3 次')).toBeInTheDocument();
  });

  it('shows practice all button when only one dictionary group', async () => {
    vi.spyOn(storage, 'getReviewQueue').mockReturnValue([
      createMockMistake({ sentenceId: '1', dictionaryId: 'junior' }),
      createMockMistake({ sentenceId: '2', dictionaryId: 'junior' }),
    ]);

    render(
      <SmartReview onPracticeReview={mockOnPracticeReview} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByText('The early bird catches the worm.')).toBeInTheDocument();
    });

    expect(screen.getByText('全部复习')).toBeInTheDocument();
  });

  it('does not show practice all button when multiple dictionary groups', async () => {
    vi.spyOn(storage, 'getReviewQueue').mockReturnValue([
      createMockMistake({ sentenceId: '1', dictionaryId: 'junior' }),
      createMockMistake({ sentenceId: '3', dictionaryId: 'cet4' }),
    ]);

    render(
      <SmartReview onPracticeReview={mockOnPracticeReview} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByText('初中词汇')).toBeInTheDocument();
    });

    expect(screen.queryByText('全部复习')).not.toBeInTheDocument();
  });
});
