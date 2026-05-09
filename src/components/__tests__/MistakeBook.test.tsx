import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MistakeBook } from '../MistakeBook';
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
];

vi.mock('@/data/loader', () => ({
  loadDictionary: vi.fn(() => Promise.resolve(mockSentences)),
}));

function createMockMistake(overrides: Partial<Mistake> = {}): Mistake {
  return {
    sentenceId: '1',
    wrongAnswers: ['wrong'],
    correctAnswers: ['catches'],
    attempts: 2,
    timestamp: Date.now() - 3600000, // 1 hour ago
    dictionaryId: 'junior',
    reviewedCount: 0,
    ...overrides,
  };
}

describe('MistakeBook', () => {
  const mockOnPractice = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders empty state when no mistakes', () => {
    vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

    render(
      <MistakeBook onPracticeMistakes={mockOnPractice} onBack={mockOnBack} />
    );

    expect(screen.getByText('错题本')).toBeInTheDocument();
    expect(screen.getByText('0 题')).toBeInTheDocument();
    expect(screen.getByText('暂无错题')).toBeInTheDocument();
    expect(screen.getByText('完成练习后，答错的题目会出现在这里')).toBeInTheDocument();
  });

  it('renders mistake list with sentence info', async () => {
    vi.spyOn(storage, 'getMistakes').mockReturnValue([
      createMockMistake({ sentenceId: '1', wrongAnswers: ['catch'], correctAnswers: ['catches'] }),
      createMockMistake({ sentenceId: '2', wrongAnswers: ['action'], correctAnswers: ['Actions', 'words'] }),
    ]);

    render(
      <MistakeBook onPracticeMistakes={mockOnPractice} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByText('The early bird catches the worm.')).toBeInTheDocument();
    });

    expect(screen.getAllByText('2 题').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('你的答案').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('正确答案').length).toBeGreaterThanOrEqual(2);
  });

  it('calls onBack when back button clicked', () => {
    vi.spyOn(storage, 'getMistakes').mockReturnValue([]);

    render(
      <MistakeBook onPracticeMistakes={mockOnPractice} onBack={mockOnBack} />
    );

    const backButton = screen.getByRole('button', { name: '' }); // icon button
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('deletes a mistake when delete button clicked', async () => {
    const removeSpy = vi.spyOn(storage, 'removeMistake').mockImplementation(() => {});
    vi.spyOn(storage, 'getMistakes')
      .mockReturnValueOnce([
        createMockMistake({ sentenceId: '1' }),
      ])
      .mockReturnValueOnce([]);

    render(
      <MistakeBook onPracticeMistakes={mockOnPractice} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByText('The early bird catches the worm.')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTitle('删除');
    fireEvent.click(deleteButton);

    expect(removeSpy).toHaveBeenCalledWith('1');
  });

  it('marks mistake as reviewed when check button clicked', async () => {
    const incrementSpy = vi.spyOn(storage, 'incrementReviewedCount').mockImplementation(() => {});
    vi.spyOn(storage, 'getMistakes').mockReturnValue([
      createMockMistake({ sentenceId: '1', reviewedCount: 0 }),
    ]);

    render(
      <MistakeBook onPracticeMistakes={mockOnPractice} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByText('The early bird catches the worm.')).toBeInTheDocument();
    });

    const reviewButton = screen.getByTitle('标记为已复习');
    fireEvent.click(reviewButton);

    expect(incrementSpy).toHaveBeenCalledWith('1');
  });

  it('calls onPracticeMistakes when practice group button clicked', async () => {
    vi.spyOn(storage, 'getMistakes').mockReturnValue([
      createMockMistake({ sentenceId: '1', dictionaryId: 'junior' }),
      createMockMistake({ sentenceId: '2', dictionaryId: 'junior' }),
    ]);

    render(
      <MistakeBook onPracticeMistakes={mockOnPractice} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByText('The early bird catches the worm.')).toBeInTheDocument();
    });

    const practiceButton = screen.getByText('练习此组');
    fireEvent.click(practiceButton);

    expect(mockOnPractice).toHaveBeenCalledWith(
      ['1', '2'],
      'junior'
    );
  });

  it('shows practice all button when mistakes exist', () => {
    vi.spyOn(storage, 'getMistakes').mockReturnValue([
      createMockMistake({ sentenceId: '1' }),
    ]);

    render(
      <MistakeBook onPracticeMistakes={mockOnPractice} onBack={mockOnBack} />
    );

    expect(screen.getByText('练习错题')).toBeInTheDocument();
  });

  it('groups mistakes by dictionary', async () => {
    vi.spyOn(storage, 'getMistakes').mockReturnValue([
      createMockMistake({ sentenceId: '1', dictionaryId: 'junior' }),
      createMockMistake({ sentenceId: '2', dictionaryId: 'junior' }),
    ]);

    render(
      <MistakeBook onPracticeMistakes={mockOnPractice} onBack={mockOnBack} />
    );

    await waitFor(() => {
      expect(screen.getByText('初中词汇')).toBeInTheDocument();
    });

    expect(screen.getAllByText('2 题').length).toBeGreaterThan(0);
  });
});
