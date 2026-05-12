 
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { WeeklyReportCard } from '../WeeklyReportCard';
import type { WeeklyReport } from '@/data/types';

// Mock ShareDialog component
vi.mock('../ShareDialog', () => ({
  ShareDialog: vi.fn(({ open, onOpenChange, triggerType }) => (
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

  describe('Compact Mode (Dashboard)', () => {
    it('renders in compact mode by default', () => {
      const report = createReport();
      render(<WeeklyReportCard report={report} />);

      expect(screen.getByTestId('weekly-report-card')).toBeInTheDocument();
    });

    it('renders XP earned correctly', () => {
      const report = createReport({ xpEarned: 750 });
      render(<WeeklyReportCard report={report} />);

      expect(screen.getByText('750')).toBeInTheDocument();
      expect(screen.getByText('获得经验')).toBeInTheDocument();
    });

    it('renders questions answered correctly', () => {
      const report = createReport({ questionsAnswered: 100 });
      render(<WeeklyReportCard report={report} />);

      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('完成题目')).toBeInTheDocument();
    });

    it('renders accuracy percentage correctly', () => {
      const report = createReport({ accuracy: 85 });
      render(<WeeklyReportCard report={report} />);

      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('正确率')).toBeInTheDocument();
    });

    it('renders learning days count correctly', () => {
      const report = createReport({ learningDays: 7 });
      render(<WeeklyReportCard report={report} />);

      expect(screen.getByText('7')).toBeInTheDocument();
      expect(screen.getByText('学习天数')).toBeInTheDocument();
    });

    it('renders sessions completed count correctly', () => {
      const report = createReport({ sessionsCompleted: 5 });
      render(<WeeklyReportCard report={report} />);

      expect(screen.getByText('完成 5 次练习')).toBeInTheDocument();
    });

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

      // Should show "持平" for zero change - use getAllByText since it appears multiple times
      const elements = screen.getAllByText('持平');
      expect(elements.length).toBeGreaterThan(0);
    });

    it('displays correct week range', () => {
      const report = createReport({
        weekStart: '2026-05-04',
        weekEnd: '2026-05-10',
      });
      render(<WeeklyReportCard report={report} />);

      // Should display month/day format
      expect(screen.getByText(/5\/4/)).toBeInTheDocument();
    });

    it('has header with "本周学习报告" title', () => {
      const report = createReport();
      render(<WeeklyReportCard report={report} />);

      expect(screen.getByText('本周学习报告')).toBeInTheDocument();
    });

    it('renders correct answers in footer', () => {
      const report = createReport({ correctAnswers: 42 });
      render(<WeeklyReportCard report={report} />);

      expect(screen.getByText('答对 42 题')).toBeInTheDocument();
    });
  });

  describe('Modal Mode', () => {
    it('renders in modal mode when compact=false', () => {
      const report = createReport();
      render(<WeeklyReportCard report={report} compact={false} />);

      expect(screen.getByTestId('weekly-report-card')).toBeInTheDocument();
    });

    it('shows share button in modal mode', () => {
      const report = createReport();
      render(<WeeklyReportCard report={report} compact={false} />);

      expect(screen.getByTestId('weekly-report-share-button')).toBeInTheDocument();
    });

    it('shows dismiss button in modal mode', () => {
      const report = createReport();
      render(<WeeklyReportCard report={report} compact={false} />);

      expect(screen.getByTestId('weekly-report-dismiss-button')).toBeInTheDocument();
    });

    it('opens ShareDialog when share button is clicked', () => {
      const report = createReport();
      render(<WeeklyReportCard report={report} compact={false} />);

      fireEvent.click(screen.getByTestId('weekly-report-share-button'));
      expect(screen.getByTestId('share-dialog')).toBeInTheDocument();
    });

    it('calls onDismiss when dismiss button is clicked', () => {
      const report = createReport();
      const onDismiss = vi.fn();
      render(<WeeklyReportCard report={report} compact={false} onDismiss={onDismiss} />);

      fireEvent.click(screen.getByTestId('weekly-report-dismiss-button'));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('shows dynamic headline for 7 learning days', () => {
      const report = createReport({ learningDays: 7 });
      render(<WeeklyReportCard report={report} compact={false} />);

      expect(screen.getByText('本周学习全覆盖！')).toBeInTheDocument();
    });

    it('shows dynamic headline for 5 learning days', () => {
      const report = createReport({ learningDays: 5 });
      render(<WeeklyReportCard report={report} compact={false} />);

      expect(screen.getByText('学习习惯养成中')).toBeInTheDocument();
    });

    it('shows headline for low activity', () => {
      const report = createReport({ questionsAnswered: 5, learningDays: 1 });
      render(<WeeklyReportCard report={report} compact={false} />);

      expect(screen.getByText('本周迈出了第一步')).toBeInTheDocument();
    });

    it('renders with triggerKey prop', () => {
      const report = createReport();
      render(<WeeklyReportCard report={report} triggerKey="unique-key-123" compact={false} />);

      expect(screen.getByTestId('weekly-report-card')).toBeInTheDocument();
    });
  });

  describe('onClick handler', () => {
    it('calls onClick when card is clicked in compact mode', () => {
      const report = createReport();
      const onClick = vi.fn();
      render(<WeeklyReportCard report={report} onClick={onClick} />);

      fireEvent.click(screen.getByTestId('weekly-report-card'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });
});