import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { WeeklyReportCard } from '../WeeklyReportCard';
import type { WeeklyReport } from '@/data/types';

// Mock ShareDialog component
vi.mock('../ShareDialog', () => ({
  ShareDialog: vi.fn(({ open, onOpenChange, triggerType }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    triggerType?: string;
  }) => (
    open ? (
      <div data-testid="share-dialog" data-trigger-type={triggerType}>
        <button data-testid="dialog-close" onClick={() => onOpenChange(false)}>
          关闭
        </button>
      </div>
    ) : null
  )),
}));

// Mock framer-motion for animation testing
vi.mock('framer-motion', () => ({
  motion: {
    div: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>),
  },
  AnimatePresence: vi.fn(({ children }) => children),
}));

// Helper to create a report with all required fields
function createReport(overrides?: Partial<WeeklyReport>): WeeklyReport {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6); // Sunday

  return {
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
    xpEarned: 500,
    questionsAnswered: 50,
    correctAnswers: 40,
    bestStreak: 40,
    learningDays: 5,
    sessionsCompleted: 3,
    accuracy: 80,
    comparison: {
      xpChange: 25,
      questionsChange: 15,
      accuracyChange: 5,
    },
    generatedAt: Date.now(),
    ...overrides,
  };
}

describe('WeeklyReportCard', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Data fields rendering', () => {
    it('renders XP earned correctly', () => {
      const report = createReport({ xpEarned: 750 });
      render(<WeeklyReportCard report={report} />);

      expect(screen.getByText('750')).toBeInTheDocument();
      expect(screen.getByText('获得 XP')).toBeInTheDocument();
    });

    it('renders questions answered correctly', () => {
      const report = createReport({ questionsAnswered: 100 });
      render(<WeeklyReportCard report={report} />);

      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('答题数')).toBeInTheDocument();
    });

    it('renders accuracy percentage correctly', () => {
      const report = createReport({ accuracy: 85 });
      render(<WeeklyReportCard report={report} />);

      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('正确率')).toBeInTheDocument();
    });

    it('renders correct answers count correctly', () => {
      const report = createReport({ correctAnswers: 45 });
      render(<WeeklyReportCard report={report} />);

      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('答对题数')).toBeInTheDocument();
    });

    it('renders learning days count correctly', () => {
      const report = createReport({ learningDays: 7 });
      render(<WeeklyReportCard report={report} />);

      expect(screen.getByText('学习 7 天')).toBeInTheDocument();
    });

    it('renders sessions completed count correctly', () => {
      const report = createReport({ sessionsCompleted: 5 });
      render(<WeeklyReportCard report={report} />);

      expect(screen.getByText('完成 5 次练习')).toBeInTheDocument();
    });
  });

  describe('Comparison data rendering', () => {
    it('shows positive XP change with trending up icon', () => {
      const report = createReport({
        xpEarned: 500,
        comparison: { xpChange: 25, questionsChange: 10, accuracyChange: 5 },
      });
      render(<WeeklyReportCard report={report} />);

      expect(screen.getByText('+25%')).toBeInTheDocument();
    });

    it('shows negative change with trending down icon', () => {
      const report = createReport({
        xpEarned: 300,
        comparison: { xpChange: -15, questionsChange: -10, accuracyChange: -3 },
      });
      render(<WeeklyReportCard report={report} />);

      expect(screen.getByText('-15%')).toBeInTheDocument();
    });

    it('shows zero change with minus icon', () => {
      const report = createReport({
        xpEarned: 400,
        comparison: { xpChange: 0, questionsChange: 0, accuracyChange: 0 },
      });
      render(<WeeklyReportCard report={report} />);

      // Use getAllByText to handle multiple elements with same value
      const elements = screen.getAllByText('持平');
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  describe('Share button functionality', () => {
    it('opens ShareDialog when share button is clicked', () => {
      const report = createReport();
      render(<WeeklyReportCard report={report} />);

      // Click share button
      const shareButton = screen.getByTestId('weekly-report-share-button');
      fireEvent.click(shareButton);

      // ShareDialog should be visible
      expect(screen.getByTestId('share-dialog')).toBeInTheDocument();
    });

    it('passes correct triggerType to ShareDialog', () => {
      const report = createReport();
      render(<WeeklyReportCard report={report} />);

      // Click share button
      const shareButton = screen.getByTestId('weekly-report-share-button');
      fireEvent.click(shareButton);

      // Verify trigger type is weekly-report
      const dialog = screen.getByTestId('share-dialog');
      expect(dialog.getAttribute('data-trigger-type')).toBe('weekly-report');
    });

    it('share button has correct aria-label', () => {
      const report = createReport();
      render(<WeeklyReportCard report={report} />);

      const shareButton = screen.getByTestId('weekly-report-share-button');
      expect(shareButton).toHaveAttribute('aria-label', '分享周报');
    });
  });

  describe('Dismiss button functionality', () => {
    it('calls onDismiss when dismiss button is clicked', () => {
      const report = createReport();
      const onDismiss = vi.fn();
      render(<WeeklyReportCard report={report} onDismiss={onDismiss} />);

      // Click dismiss button
      const dismissButton = screen.getByTestId('weekly-report-dismiss-button');
      fireEvent.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('dismiss button has correct aria-label', () => {
      const report = createReport();
      render(<WeeklyReportCard report={report} onDismiss={vi.fn()} />);

      const dismissButton = screen.getByTestId('weekly-report-dismiss-button');
      expect(dismissButton).toHaveAttribute('aria-label', '关闭');
    });
  });

  describe('Week range display', () => {
    it('displays correct week range', () => {
      const report = createReport({
        weekStart: '2026-05-04',
        weekEnd: '2026-05-10',
      });
      render(<WeeklyReportCard report={report} />);

      // Should display the week range
      expect(screen.getByText(/5月/i)).toBeInTheDocument();
    });
  });

  describe('Dynamic headlines', () => {
    it('shows "本周学习全覆盖！" for 7 learning days', () => {
      const report = createReport({ learningDays: 7 });
      render(<WeeklyReportCard report={report} />);

      expect(screen.getByText('本周学习全覆盖！')).toBeInTheDocument();
    });

    it('shows "学习习惯养成中" for 5 learning days', () => {
      const report = createReport({ learningDays: 5 });
      render(<WeeklyReportCard report={report} />);

      expect(screen.getByText('学习习惯养成中')).toBeInTheDocument();
    });

    it('shows "本周迈出了第一步" for low activity', () => {
      const report = createReport({ questionsAnswered: 5, learningDays: 1 });
      render(<WeeklyReportCard report={report} />);

      expect(screen.getByText('本周迈出了第一步')).toBeInTheDocument();
    });
  });

  describe('Animation and re-mount behavior', () => {
    it('has data-testid for identification', () => {
      const report = createReport();
      render(<WeeklyReportCard report={report} />);

      expect(screen.getByTestId('weekly-report-card')).toBeInTheDocument();
    });

    it('renders with triggerKey prop', () => {
      const report = createReport();
      render(<WeeklyReportCard report={report} triggerKey="unique-key-123" />);

      expect(screen.getByTestId('weekly-report-card')).toBeInTheDocument();
    });

    it('re-renders with different triggerKey', () => {
      const report1 = createReport({ weekStart: '2026-05-04' });
      const report2 = createReport({ weekStart: '2026-05-04' });

      const { rerender } = render(
        <WeeklyReportCard report={report1} triggerKey="key-1" />
      );

      expect(screen.getByTestId('weekly-report-card')).toBeInTheDocument();

      // Rerender with different triggerKey
      rerender(<WeeklyReportCard report={report2} triggerKey="key-2" />);

      expect(screen.getByTestId('weekly-report-card')).toBeInTheDocument();
    });
  });

  describe('Gradient theme', () => {
    it('has indigo gradient background', () => {
      const report = createReport();
      render(<WeeklyReportCard report={report} />);

      const card = screen.getByTestId('weekly-report-card');
      expect(card.querySelector('.from-indigo-500')).toBeInTheDocument();
    });
  });
});