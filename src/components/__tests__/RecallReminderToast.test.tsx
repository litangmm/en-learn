import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { RecallReminderToast } from '../RecallReminderToast';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

describe('RecallReminderToast', () => {
  const mockOnDismiss = vi.fn();
  const mockOnStartReview = vi.fn();

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe('Rendering behavior', () => {
    it('does NOT render when status is idle', () => {
      render(
        <RecallReminderToast
          status="idle"
          dueCount={0}
          onDismiss={mockOnDismiss}
          onStartReview={mockOnStartReview}
        />
      );
      expect(screen.queryByTestId('recall-reminder-toast')).not.toBeInTheDocument();
    });

    it('renders correctly for due-soon status with emoji and message', () => {
      render(
        <RecallReminderToast
          status="due-soon"
          dueCount={10}
          onDismiss={mockOnDismiss}
          onStartReview={mockOnStartReview}
        />
      );
      expect(screen.getByTestId('recall-reminder-toast')).toBeInTheDocument();
      expect(screen.getByRole('img')).toHaveTextContent('📚');
      expect(screen.getByText('您有 10 道复习题待完成')).toBeInTheDocument();
    });

    it('renders correctly for due-now status with emoji and message', () => {
      render(
        <RecallReminderToast
          status="due-now"
          dueCount={5}
          onDismiss={mockOnDismiss}
          onStartReview={mockOnStartReview}
        />
      );
      expect(screen.getByTestId('recall-reminder-toast')).toBeInTheDocument();
      expect(screen.getByRole('img')).toHaveTextContent('⏰');
      expect(screen.getByText('复习时间到！5 道错题等待复习')).toBeInTheDocument();
    });

    it('renders correctly for streak-at-risk status with emoji and message', () => {
      render(
        <RecallReminderToast
          status="streak-at-risk"
          dueCount={0}
          onDismiss={mockOnDismiss}
          onStartReview={mockOnStartReview}
        />
      );
      expect(screen.getByTestId('recall-reminder-toast')).toBeInTheDocument();
      expect(screen.getByRole('img')).toHaveTextContent('🔥');
      expect(screen.getByText('连续学习 streak 即将中断！今天复习即可延续')).toBeInTheDocument();
    });
  });

  describe('Button interactions', () => {
    it('calls onStartReview when "开始复习" button is clicked', () => {
      render(
        <RecallReminderToast
          status="due-now"
          dueCount={5}
          onDismiss={mockOnDismiss}
          onStartReview={mockOnStartReview}
        />
      );

      const button = screen.getByRole('button', { name: '开始复习' });
      fireEvent.click(button);

      expect(mockOnStartReview).toHaveBeenCalledTimes(1);
      expect(mockOnDismiss).not.toHaveBeenCalled();
    });

    it('does NOT call onDismiss when button is clicked (stopPropagation)', () => {
      render(
        <RecallReminderToast
          status="due-soon"
          dueCount={3}
          onDismiss={mockOnDismiss}
          onStartReview={mockOnStartReview}
        />
      );

      const button = screen.getByRole('button', { name: '开始复习' });
      fireEvent.click(button);

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });
  });

  describe('Toast click dismisses', () => {
    it('calls onDismiss when toast body is clicked', () => {
      render(
        <RecallReminderToast
          status="due-now"
          dueCount={5}
          onDismiss={mockOnDismiss}
          onStartReview={mockOnStartReview}
        />
      );

      const toast = screen.getByTestId('recall-reminder-toast');
      fireEvent.click(toast);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Auto-dismiss behavior', () => {
    it('auto-dismisses after 8 seconds', () => {
      render(
        <RecallReminderToast
          status="due-soon"
          dueCount={7}
          onDismiss={mockOnDismiss}
          onStartReview={mockOnStartReview}
        />
      );

      expect(mockOnDismiss).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(8000);
      });

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not auto-dismiss before 8 seconds', () => {
      render(
        <RecallReminderToast
          status="streak-at-risk"
          dueCount={0}
          onDismiss={mockOnDismiss}
          onStartReview={mockOnStartReview}
        />
      );

      act(() => {
        vi.advanceTimersByTime(7000);
      });

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });

    it('timer is cleaned up on unmount (no timer leak)', () => {
      const { unmount } = render(
        <RecallReminderToast
          status="due-now"
          dueCount={3}
          onDismiss={mockOnDismiss}
          onStartReview={mockOnStartReview}
        />
      );

      unmount();

      // If there's a timer leak, this would throw an error
      act(() => {
        vi.advanceTimersByTime(8000);
      });

      // onDismiss should NOT be called after unmount
      expect(mockOnDismiss).not.toHaveBeenCalled();
    });

    it('timer is cleaned up when status changes to idle', () => {
      const { rerender } = render(
        <RecallReminderToast
          status="due-soon"
          dueCount={5}
          onDismiss={mockOnDismiss}
          onStartReview={mockOnStartReview}
        />
      );

      // Change status to idle
      rerender(
        <RecallReminderToast
          status="idle"
          dueCount={0}
          onDismiss={mockOnDismiss}
          onStartReview={mockOnStartReview}
        />
      );

      // Advance past 8 seconds
      act(() => {
        vi.advanceTimersByTime(8000);
      });

      // Should NOT have called onDismiss since status changed to idle
      expect(mockOnDismiss).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has role="status" for screen readers', () => {
      render(
        <RecallReminderToast
          status="due-now"
          dueCount={5}
          onDismiss={mockOnDismiss}
          onStartReview={mockOnStartReview}
        />
      );
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live="polite" for screen readers', () => {
      render(
        <RecallReminderToast
          status="due-soon"
          dueCount={3}
          onDismiss={mockOnDismiss}
          onStartReview={mockOnStartReview}
        />
      );
      // aria-live is on the status container
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('has descriptive aria-label on emoji for due-soon status', () => {
      render(
        <RecallReminderToast
          status="due-soon"
          dueCount={5}
          onDismiss={mockOnDismiss}
          onStartReview={mockOnStartReview}
        />
      );
      expect(screen.getByRole('img', { name: '书本' })).toBeInTheDocument();
    });

    it('has descriptive aria-label on emoji for due-now status', () => {
      render(
        <RecallReminderToast
          status="due-now"
          dueCount={5}
          onDismiss={mockOnDismiss}
          onStartReview={mockOnStartReview}
        />
      );
      expect(screen.getByRole('img', { name: '时钟' })).toBeInTheDocument();
    });

    it('has descriptive aria-label on emoji for streak-at-risk status', () => {
      render(
        <RecallReminderToast
          status="streak-at-risk"
          dueCount={0}
          onDismiss={mockOnDismiss}
          onStartReview={mockOnStartReview}
        />
      );
      expect(screen.getByRole('img', { name: '火焰' })).toBeInTheDocument();
    });

    it('button has aria-label for accessibility', () => {
      render(
        <RecallReminderToast
          status="due-now"
          dueCount={5}
          onDismiss={mockOnDismiss}
          onStartReview={mockOnStartReview}
        />
      );
      expect(screen.getByRole('button', { name: '开始复习' })).toBeInTheDocument();
    });
  });

  describe('data-testid', () => {
    it('toast has data-testid="recall-reminder-toast"', () => {
      render(
        <RecallReminderToast
          status="due-soon"
          dueCount={5}
          onDismiss={mockOnDismiss}
          onStartReview={mockOnStartReview}
        />
      );
      expect(screen.getByTestId('recall-reminder-toast')).toBeInTheDocument();
    });
  });
});
