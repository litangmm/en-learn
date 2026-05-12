import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

describe('SmartReview Rules', () => {
  const mockOnPracticeReview = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Rule Banner', () => {
    it('renders rule banner when totalDue > 0', async () => {
      vi.spyOn(storage, 'getReviewQueue').mockReturnValue([
        createMockMistake({ sentenceId: '1', dictionaryId: 'junior' }),
      ]);

      render(
        <SmartReview onPracticeReview={mockOnPracticeReview} onBack={mockOnBack} />
      );

      await waitFor(() => {
        expect(screen.getByText(/复习间隔基于遗忘曲线/)).toBeInTheDocument();
      });
      expect(screen.getByText('智能复习')).toBeInTheDocument();
    });

    it('does not render rule banner when totalDue === 0', () => {
      vi.spyOn(storage, 'getReviewQueue').mockReturnValue([]);

      render(
        <SmartReview onPracticeReview={mockOnPracticeReview} onBack={mockOnBack} />
      );

      expect(screen.queryByText(/复习间隔基于遗忘曲线/)).not.toBeInTheDocument();
      expect(screen.getByText('今日无到期复习题目')).toBeInTheDocument();
    });
  });

  describe('Priority Badges', () => {
    it('shows high-priority badge when attempts >= 2 && reviewedCount === 0', async () => {
      vi.spyOn(storage, 'getReviewQueue').mockReturnValue([
        createMockMistake({
          sentenceId: '1',
          dictionaryId: 'junior',
          attempts: 2,
          reviewedCount: 0,
        }),
      ]);

      render(
        <SmartReview onPracticeReview={mockOnPracticeReview} onBack={mockOnBack} />
      );

      await waitFor(() => {
        expect(screen.getByText('The early bird catches the worm.')).toBeInTheDocument();
      });

      expect(screen.getByText('高优先级')).toBeInTheDocument();
    });

    it('shows 今日到期 badge when nextReviewAt <= Date.now()', async () => {
      vi.spyOn(storage, 'getReviewQueue').mockReturnValue([
        createMockMistake({
          sentenceId: '1',
          dictionaryId: 'junior',
          nextReviewAt: Date.now() - 1000, // Already due
          reviewedCount: 1,
          attempts: 1,
        }),
      ]);

      render(
        <SmartReview onPracticeReview={mockOnPracticeReview} onBack={mockOnBack} />
      );

      await waitFor(() => {
        expect(screen.getByText('The early bird catches the worm.')).toBeInTheDocument();
      });

      expect(screen.getByText('今日到期')).toBeInTheDocument();
    });

    it('shows 已掌握 badge when reviewedCount >= 3', async () => {
      vi.spyOn(storage, 'getReviewQueue').mockReturnValue([
        createMockMistake({
          sentenceId: '1',
          dictionaryId: 'junior',
          reviewedCount: 3,
          attempts: 1,
        }),
      ]);

      render(
        <SmartReview onPracticeReview={mockOnPracticeReview} onBack={mockOnBack} />
      );

      await waitFor(() => {
        expect(screen.getByText('The early bird catches the worm.')).toBeInTheDocument();
      });

      expect(screen.getByText('已掌握')).toBeInTheDocument();
    });

    it('shows no priority badge for normal mistakes (attempts < 2 && reviewedCount > 0)', async () => {
      vi.spyOn(storage, 'getReviewQueue').mockReturnValue([
        createMockMistake({
          sentenceId: '1',
          dictionaryId: 'junior',
          attempts: 1,
          reviewedCount: 1,
          nextReviewAt: Date.now() + 86400000, // Not due yet (1 day from now)
        }),
      ]);

      render(
        <SmartReview onPracticeReview={mockOnPracticeReview} onBack={mockOnBack} />
      );

      await waitFor(() => {
        expect(screen.getByText('The early bird catches the worm.')).toBeInTheDocument();
      });

      expect(screen.queryByText('高优先级')).not.toBeInTheDocument();
      expect(screen.queryByText('今日到期')).not.toBeInTheDocument();
      expect(screen.queryByText('已掌握')).not.toBeInTheDocument();
    });

    it('已掌握 takes precedence over 今日到期 when reviewedCount >= 3', async () => {
      vi.spyOn(storage, 'getReviewQueue').mockReturnValue([
        createMockMistake({
          sentenceId: '1',
          dictionaryId: 'junior',
          reviewedCount: 3,
          nextReviewAt: Date.now() - 1000, // Already due
          attempts: 2,
        }),
      ]);

      render(
        <SmartReview onPracticeReview={mockOnPracticeReview} onBack={mockOnBack} />
      );

      await waitFor(() => {
        expect(screen.getByText('The early bird catches the worm.')).toBeInTheDocument();
      });

      // 已掌握 should be shown, not 今日到期
      expect(screen.getByText('已掌握')).toBeInTheDocument();
      expect(screen.queryByText('今日到期')).not.toBeInTheDocument();
    });

    it('今日到期 takes precedence over 高优先级 when nextReviewAt is due', async () => {
      vi.spyOn(storage, 'getReviewQueue').mockReturnValue([
        createMockMistake({
          sentenceId: '1',
          dictionaryId: 'junior',
          attempts: 2,
          reviewedCount: 0,
          nextReviewAt: Date.now() - 1000, // Already due
        }),
      ]);

      render(
        <SmartReview onPracticeReview={mockOnPracticeReview} onBack={mockOnBack} />
      );

      await waitFor(() => {
        expect(screen.getByText('The early bird catches the worm.')).toBeInTheDocument();
      });

      // 今日到期 should be shown, not 高优先级
      expect(screen.getByText('今日到期')).toBeInTheDocument();
      expect(screen.queryByText('高优先级')).not.toBeInTheDocument();
    });
  });
});
