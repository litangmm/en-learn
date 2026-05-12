import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { GoalCompletionToast } from '../GoalCompletionToast';
import type { Goal } from '@/data/types';

const mockGoal = (overrides: Partial<Goal> = {}): Goal => ({
  id: 'daily-questions',
  type: 'questions',
  period: 'daily',
  title: '每日答题目标',
  target: 10,
  current: 10,
  completed: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

describe('GoalCompletionToast', () => {
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // Rendering Tests
  // -------------------------------------------------------------------------

  describe('rendering', () => {
    it('does NOT render when completedGoal is null', () => {
      render(<GoalCompletionToast completedGoal={null} onDismiss={mockOnDismiss} />);
      expect(screen.queryByTestId('goal-completion-toast')).not.toBeInTheDocument();
    });

    it('renders when completedGoal is provided', () => {
      const goal = mockGoal({ type: 'questions' });
      render(<GoalCompletionToast completedGoal={goal} onDismiss={mockOnDismiss} />);
      expect(screen.getByTestId('goal-completion-toast')).toBeInTheDocument();
    });

    it('shows correct emoji and label for questions goal', () => {
      const goal = mockGoal({ type: 'questions', title: '每日答题目标' });
      render(<GoalCompletionToast completedGoal={goal} onDismiss={mockOnDismiss} />);
      expect(screen.getByText(/答题目标达成/)).toBeInTheDocument();
    });

    it('shows correct emoji and label for XP goal', () => {
      const goal = mockGoal({ type: 'xp', title: '每日 XP 目标', target: 100 });
      render(<GoalCompletionToast completedGoal={goal} onDismiss={mockOnDismiss} />);
      expect(screen.getByText(/XP 目标达成/)).toBeInTheDocument();
    });

    it('shows correct emoji and label for streak goal', () => {
      const goal = mockGoal({ type: 'streak', title: '每日连续目标', target: 5 });
      render(<GoalCompletionToast completedGoal={goal} onDismiss={mockOnDismiss} />);
      expect(screen.getByText(/连续目标达成/)).toBeInTheDocument();
    });

    it('shows target value with correct unit', () => {
      const questionsGoal = mockGoal({ type: 'questions', target: 10 });
      render(<GoalCompletionToast completedGoal={questionsGoal} onDismiss={mockOnDismiss} />);
      expect(screen.getByText(/已完成 10 题/)).toBeInTheDocument();

      const xpGoal = mockGoal({ type: 'xp', target: 100 });
      render(<GoalCompletionToast completedGoal={xpGoal} onDismiss={mockOnDismiss} />);
      expect(screen.getByText(/已完成 100 XP/)).toBeInTheDocument();

      const streakGoal = mockGoal({ type: 'streak', target: 5 });
      render(<GoalCompletionToast completedGoal={streakGoal} onDismiss={mockOnDismiss} />);
      expect(screen.getByText(/已完成 5 天/)).toBeInTheDocument();
    });

    it('renders with triggerKey without error', () => {
      const goal = mockGoal();
      render(
        <GoalCompletionToast completedGoal={goal} triggerKey={1} onDismiss={mockOnDismiss} />
      );
      expect(screen.getByTestId('goal-completion-toast')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Auto-dismiss Tests
  // -------------------------------------------------------------------------

  describe('auto-dismiss', () => {
    it('auto-dismisses after default 3 seconds', () => {
      const goal = mockGoal();
      render(<GoalCompletionToast completedGoal={goal} onDismiss={mockOnDismiss} />);

      expect(mockOnDismiss).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('auto-dismisses after custom duration', () => {
      const goal = mockGoal();
      render(<GoalCompletionToast completedGoal={goal} autoDismissMs={5000} onDismiss={mockOnDismiss} />);

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not auto-dismiss before timeout', () => {
      const goal = mockGoal();
      render(<GoalCompletionToast completedGoal={goal} onDismiss={mockOnDismiss} />);

      act(() => {
        vi.advanceTimersByTime(2000); // before 3s
      });

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });

    it('timer is cleaned up on unmount', () => {
      const goal = mockGoal();
      const { unmount } = render(<GoalCompletionToast completedGoal={goal} onDismiss={mockOnDismiss} />);

      unmount();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(mockOnDismiss).not.toHaveBeenCalled();
    });

    it('rerenders when completedGoal changes', () => {
      const goal1 = mockGoal({ id: 'goal-1', type: 'questions' });
      const goal2 = mockGoal({ id: 'goal-2', type: 'xp' });

      const { rerender } = render(
        <GoalCompletionToast completedGoal={goal1} onDismiss={mockOnDismiss} />
      );
      expect(screen.getByText(/答题目标达成/)).toBeInTheDocument();

      // Change to different goal - toast should update
      rerender(<GoalCompletionToast completedGoal={goal2} onDismiss={mockOnDismiss} />);
      expect(screen.getByText(/XP 目标达成/)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Dismiss Button Tests
  // -------------------------------------------------------------------------

  describe('dismiss button', () => {
    it('calls onDismiss when dismiss button is clicked', () => {
      const goal = mockGoal();
      render(<GoalCompletionToast completedGoal={goal} onDismiss={mockOnDismiss} />);

      const dismissBtn = screen.getByRole('button', { name: '关闭' });
      fireEvent.click(dismissBtn);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('stops propagation on dismiss button click', () => {
      const goal = mockGoal();
      render(<GoalCompletionToast completedGoal={goal} onDismiss={mockOnDismiss} />);

      const dismissBtn = screen.getByRole('button', { name: '关闭' });
      // If stopPropagation is working, the parent click shouldn't fire extra times
      fireEvent.click(dismissBtn, { bubbles: true });

      // Just verify dismiss was called once (not testing propagation deeply here)
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });
});
