import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DailyReviewPlan } from '../DailyReviewPlan';

// Mock the hooks with default values
vi.mock('@/hooks/useSpacedRepetition', () => ({
  useSpacedRepetition: vi.fn(() => ({
    dueCount: 5,
    getDueReviewItems: vi.fn(() => []),
    updateMistakeReviewResult: vi.fn(),
  })),
}));

vi.mock('@/hooks/useReviewStreak', () => ({
  useReviewStreak: vi.fn(() => ({
    data: {
      currentStreak: 3,
      longestStreak: 7,
      lastReviewDate: '2026-05-12',
      totalReviewDays: 10,
      isStreakActive: true,
    },
    recordReview: vi.fn(),
    getTodayReviewedCount: vi.fn(() => 1),
  })),
}));

vi.mock('@/services/storage', () => ({
  storage: {
    getReviewStats: vi.fn(() => ({
      stats: {
        date: '2026-05-12',
        reviewedCount: 2,
        completedReviewIds: ['id1', 'id2'],
      },
    })),
  },
}));

describe('DailyReviewPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the card title correctly', () => {
      const mockOnOpenReview = vi.fn();
      render(<DailyReviewPlan onOpenReview={mockOnOpenReview} />);

      expect(screen.getByText('每日复习计划')).toBeInTheDocument();
    });

    it('shows due count number', () => {
      const mockOnOpenReview = vi.fn();
      render(<DailyReviewPlan onOpenReview={mockOnOpenReview} />);

      // The number 5 from the mock should be displayed
      expect(screen.getByText('5', { selector: '.text-blue-600' })).toBeInTheDocument();
    });

    it('displays streak information with numbers', () => {
      const mockOnOpenReview = vi.fn();
      render(<DailyReviewPlan onOpenReview={mockOnOpenReview} />);

      // Check that the component renders streak numbers
      const threeElement = screen.getByText('3', { selector: '.font-semibold' });
      expect(threeElement).toBeInTheDocument();

      const sevenElement = screen.getByText('7', { selector: '.font-semibold' });
      expect(sevenElement).toBeInTheDocument();
    });

    it('shows review mode indicator when isReviewMode is true', () => {
      const mockOnOpenReview = vi.fn();
      render(<DailyReviewPlan onOpenReview={mockOnOpenReview} isReviewMode={true} />);

      expect(screen.getByText('复习模式进行中')).toBeInTheDocument();
    });

    it('shows estimated time for reviews', () => {
      const mockOnOpenReview = vi.fn();
      render(<DailyReviewPlan onOpenReview={mockOnOpenReview} />);

      // 5 items * 2 minutes = 10 minutes
      expect(screen.getByText('预计用时约 10 分钟')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('has a clickable button', () => {
      const mockOnOpenReview = vi.fn();
      const { container } = render(<DailyReviewPlan onOpenReview={mockOnOpenReview} />);

      const button = container.querySelector('button');
      expect(button).toBeTruthy();
      expect(button?.textContent).toContain('开始复习');
    });

    it('button contains the due count in text', () => {
      const mockOnOpenReview = vi.fn();
      const { container } = render(<DailyReviewPlan onOpenReview={mockOnOpenReview} />);

      const button = container.querySelector('button');
      // Button should show "开始复习 (5)"
      expect(button?.textContent).toContain('5');
    });
  });

  describe('Component structure', () => {
    it('renders inside a Card component', () => {
      const mockOnOpenReview = vi.fn();
      const { container } = render(<DailyReviewPlan onOpenReview={mockOnOpenReview} />);

      // The component should contain a card element
      const card = container.querySelector('[class*="rounded"]');
      expect(card).toBeTruthy();
    });
  });
});
