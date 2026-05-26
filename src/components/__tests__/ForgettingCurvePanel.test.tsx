import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ForgettingCurvePanel } from '../ForgettingCurvePanel';
import type { ForgettingCurveData, ForgettingCurveSummary } from '@/hooks/useForgettingCurve';

// Mock useForgettingCurve hook
vi.mock('@/hooks/useForgettingCurve', () => ({
  useForgettingCurve: vi.fn(),
}));

import { useForgettingCurve } from '@/hooks/useForgettingCurve';

describe('ForgettingCurvePanel', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('empty state', () => {
    it('should show empty state when no data', () => {
      const emptySummary: ForgettingCurveSummary = {
        totalTracked: 0,
        overdueCount: 0,
        dueSoonCount: 0,
        healthyCount: 0,
        averageRetention: 0,
        sortedByUrgency: [],
      };
      vi.mocked(useForgettingCurve).mockReturnValue(emptySummary);

      render(<ForgettingCurvePanel onBack={mockOnBack} />);

      expect(screen.getByText('暂无追踪数据')).toBeInTheDocument();
      expect(screen.getByText('开始练习并记录错题后，这里会显示您的遗忘曲线和复习提醒。')).toBeInTheDocument();
    });
  });

  describe('with data', () => {
    const createMockData = (overrides?: Partial<ForgettingCurveData>): ForgettingCurveData => ({
      sentenceId: 'test-sentence-1',
      dictionaryId: 'cet6',
      dataPoints: [],
      intervalContext: {
        currentInterval: 3,
        reviewCount: 1,
      },
      nextReviewAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
      daysUntilReview: 3,
      memoryRetentionScore: 75,
      isOverdue: false,
      urgencyLevel: 1,
      ...overrides,
    });

    it('should display summary stats', () => {
      const summary: ForgettingCurveSummary = {
        totalTracked: 5,
        overdueCount: 2,
        dueSoonCount: 1,
        healthyCount: 2,
        averageRetention: 65,
        sortedByUrgency: [
          createMockData({ sentenceId: 'overdue-1', isOverdue: true, memoryRetentionScore: 40, urgencyLevel: 3, daysUntilReview: -2 }),
          createMockData({ sentenceId: 'overdue-2', isOverdue: true, memoryRetentionScore: 35, urgencyLevel: 3, daysUntilReview: -1 }),
          createMockData({ sentenceId: 'due-soon-1', daysUntilReview: 0, memoryRetentionScore: 55, urgencyLevel: 3 }),
          createMockData({ sentenceId: 'healthy-1', daysUntilReview: 5, memoryRetentionScore: 75, urgencyLevel: 1 }),
          createMockData({ sentenceId: 'healthy-2', daysUntilReview: 7, memoryRetentionScore: 85, urgencyLevel: 1 }),
        ],
      };
      vi.mocked(useForgettingCurve).mockReturnValue(summary);

      render(<ForgettingCurvePanel onBack={mockOnBack} />);

      expect(screen.getByText('5')).toBeInTheDocument(); // Total tracked
      expect(screen.getByText('2')).toBeInTheDocument(); // Overdue count
      expect(screen.getByText('1')).toBeInTheDocument(); // Due soon
      expect(screen.getByText('65%')).toBeInTheDocument(); // Average retention
    });

    it('should render all items in list', () => {
      const summary: ForgettingCurveSummary = {
        totalTracked: 2,
        overdueCount: 0,
        dueSoonCount: 0,
        healthyCount: 2,
        averageRetention: 80,
        sortedByUrgency: [
          createMockData({ sentenceId: 'item-1' }),
          createMockData({ sentenceId: 'item-2' }),
        ],
      };
      vi.mocked(useForgettingCurve).mockReturnValue(summary);

      render(<ForgettingCurvePanel onBack={mockOnBack} />);

      expect(screen.getByTestId('curve-item-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('curve-item-item-2')).toBeInTheDocument();
    });

    it('should show overdue items in overdue tab', () => {
      const summary: ForgettingCurveSummary = {
        totalTracked: 3,
        overdueCount: 2,
        dueSoonCount: 0,
        healthyCount: 1,
        averageRetention: 50,
        sortedByUrgency: [
          createMockData({ sentenceId: 'overdue-1', isOverdue: true, urgencyLevel: 3, daysUntilReview: -2 }),
          createMockData({ sentenceId: 'overdue-2', isOverdue: true, urgencyLevel: 3, daysUntilReview: -1 }),
          createMockData({ sentenceId: 'healthy-1', daysUntilReview: 5 }),
        ],
      };
      vi.mocked(useForgettingCurve).mockReturnValue(summary);

      render(<ForgettingCurvePanel onBack={mockOnBack} />);

      // Click overdue tab
      fireEvent.click(screen.getByTestId('tab-overdue'));

      expect(screen.getByTestId('curve-item-overdue-1')).toBeInTheDocument();
      expect(screen.getByTestId('curve-item-overdue-2')).toBeInTheDocument();
      expect(screen.queryByTestId('curve-item-healthy-1')).not.toBeInTheDocument();
    });

    it('should show healthy items in healthy tab', () => {
      const summary: ForgettingCurveSummary = {
        totalTracked: 3,
        overdueCount: 2,
        dueSoonCount: 0,
        healthyCount: 1,
        averageRetention: 50,
        sortedByUrgency: [
          createMockData({ sentenceId: 'overdue-1', isOverdue: true, memoryRetentionScore: 40, urgencyLevel: 3 }),
          createMockData({ sentenceId: 'healthy-1', memoryRetentionScore: 75, urgencyLevel: 1 }),
        ],
      };
      vi.mocked(useForgettingCurve).mockReturnValue(summary);

      render(<ForgettingCurvePanel onBack={mockOnBack} />);

      // Click healthy tab
      fireEvent.click(screen.getByTestId('tab-healthy'));

      expect(screen.getByTestId('curve-item-healthy-1')).toBeInTheDocument();
      expect(screen.queryByTestId('curve-item-overdue-1')).not.toBeInTheDocument();
    });

    it('should open item detail on click', () => {
      const summary: ForgettingCurveSummary = {
        totalTracked: 1,
        overdueCount: 0,
        dueSoonCount: 0,
        healthyCount: 1,
        averageRetention: 75,
        sortedByUrgency: [createMockData()],
      };
      vi.mocked(useForgettingCurve).mockReturnValue(summary);

      render(<ForgettingCurvePanel onBack={mockOnBack} />);

      // Click on the first item
      const item = screen.getByTestId('curve-item-test-sentence-1');
      fireEvent.click(item);

      // Should show the selected item chart
      expect(screen.getByTestId('selected-item-chart')).toBeInTheDocument();
    });

    it('should display urgency badges correctly', () => {
      const summary: ForgettingCurveSummary = {
        totalTracked: 3,
        overdueCount: 1,
        dueSoonCount: 1,
        healthyCount: 1,
        averageRetention: 50,
        sortedByUrgency: [
          createMockData({ sentenceId: 'urgent-1', urgencyLevel: 3 }),
          createMockData({ sentenceId: 'medium-1', urgencyLevel: 2 }),
          createMockData({ sentenceId: 'low-1', urgencyLevel: 1 }),
        ],
      };
      vi.mocked(useForgettingCurve).mockReturnValue(summary);

      render(<ForgettingCurvePanel onBack={mockOnBack} />);

      // Use getAllByText since "即将到期" appears in both stats and badge
      expect(screen.getAllByText('即将到期').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('紧急')).toBeInTheDocument();
      expect(screen.getByText('良好')).toBeInTheDocument();
    });

    it('should display review interval info', () => {
      const summary: ForgettingCurveSummary = {
        totalTracked: 1,
        overdueCount: 0,
        dueSoonCount: 0,
        healthyCount: 1,
        averageRetention: 75,
        sortedByUrgency: [createMockData()],
      };
      vi.mocked(useForgettingCurve).mockReturnValue(summary);

      render(<ForgettingCurvePanel onBack={mockOnBack} />);

      expect(screen.getByText('复习 1 次')).toBeInTheDocument();
      expect(screen.getByText('间隔 3 天')).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should call onBack when back button clicked', () => {
      const summary: ForgettingCurveSummary = {
        totalTracked: 0,
        overdueCount: 0,
        dueSoonCount: 0,
        healthyCount: 0,
        averageRetention: 0,
        sortedByUrgency: [],
      };
      vi.mocked(useForgettingCurve).mockReturnValue(summary);

      render(<ForgettingCurvePanel onBack={mockOnBack} />);

      fireEvent.click(screen.getByTestId('back-button'));
      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('info section', () => {
    it('should show info about forgetting curve', () => {
      const summary: ForgettingCurveSummary = {
        totalTracked: 1,
        overdueCount: 0,
        dueSoonCount: 0,
        healthyCount: 1,
        averageRetention: 75,
        sortedByUrgency: [
          {
            sentenceId: 'test-item',
            dictionaryId: 'cet6',
            dataPoints: [],
            intervalContext: { currentInterval: 3, reviewCount: 1 },
            nextReviewAt: Date.now() + 86400000,
            daysUntilReview: 1,
            memoryRetentionScore: 80,
            isOverdue: false,
            urgencyLevel: 2,
          },
        ],
      };
      vi.mocked(useForgettingCurve).mockReturnValue(summary);

      render(<ForgettingCurvePanel onBack={mockOnBack} />);

      expect(screen.getByText('关于遗忘曲线')).toBeInTheDocument();
      expect(screen.getByText(/遗忘曲线基于艾宾浩斯遗忘规律/)).toBeInTheDocument();
    });
  });
});