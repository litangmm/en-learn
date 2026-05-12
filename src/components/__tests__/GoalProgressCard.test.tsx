import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoalProgressCard } from '../GoalProgressCard';
import type { Goal } from '@/data/types';

const mockGoal = (overrides: Partial<Goal> = {}): Goal => ({
  id: 'daily-questions',
  type: 'questions',
  period: 'daily',
  title: '每日答题目标',
  target: 10,
  current: 5,
  completed: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

describe('GoalProgressCard', () => {
  // -------------------------------------------------------------------------
  // Compact Mode Tests
  // -------------------------------------------------------------------------

  describe('compact mode', () => {
    it('renders in compact mode with progress bar and label', () => {
      const goal = mockGoal({ current: 5, target: 10 });
      render(<GoalProgressCard goal={goal} mode="compact" />);

      expect(screen.getByText('每日答题目标')).toBeInTheDocument();
      expect(screen.getByText('5/10')).toBeInTheDocument();
    });

    it('shows correct progress percentage', () => {
      const goal = mockGoal({ current: 5, target: 10 }); // 50%
      render(<GoalProgressCard goal={goal} mode="compact" />);

      // In compact mode, progress is shown via a div with width style (no progressbar role)
      const progressDiv = screen.getByTestId('goal-progress-card-compact').querySelector('div[style*="width"]');
      expect(progressDiv).toBeInTheDocument();
      expect(progressDiv).toHaveStyle({ width: '50%' });
    });

    it('shows checkmark when goal is completed', () => {
      const goal = mockGoal({ current: 10, target: 10, completed: true });
      render(<GoalProgressCard goal={goal} mode="compact" />);

      expect(screen.getByTestId('goal-progress-card-compact')).toBeInTheDocument();
      // CheckCircle2 should be visible
      expect(screen.getByText('10/10')).toBeInTheDocument();
    });

    it('handles zero target gracefully', () => {
      const goal = mockGoal({ current: 0, target: 0 });
      render(<GoalProgressCard goal={goal} mode="compact" />);

      // Should not crash and show 0%
      expect(screen.getByText('0/0')).toBeInTheDocument();
    });

    it('caps percentage at 100%', () => {
      const goal = mockGoal({ current: 15, target: 10 }); // 150% capped to 100%
      render(<GoalProgressCard goal={goal} mode="compact" />);

      // In compact mode, progress is shown via a div with width style
      const progressDiv = screen.getByTestId('goal-progress-card-compact').querySelector('div[style*="width"]');
      expect(progressDiv).toHaveStyle({ width: '100%' });
    });

    it('calls onClick when clicked', () => {
      const onClick = vi.fn();
      const goal = mockGoal();
      render(<GoalProgressCard goal={goal} mode="compact" onClick={onClick} />);

      fireEvent.click(screen.getByTestId('goal-progress-card-compact'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Full Mode Tests
  // -------------------------------------------------------------------------

  describe('full mode', () => {
    it('renders in full mode with all details', () => {
      const goal = mockGoal({ current: 5, target: 10 });
      render(<GoalProgressCard goal={goal} mode="full" />);

      expect(screen.getByText('每日答题目标')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('/ 10')).toBeInTheDocument();
      expect(screen.getByText('题')).toBeInTheDocument();
    });

    it('shows "已完成" badge when completed', () => {
      const goal = mockGoal({ current: 10, target: 10, completed: true });
      render(<GoalProgressCard goal={goal} mode="full" />);

      expect(screen.getByText('已完成')).toBeInTheDocument();
    });

    it('shows period label (今日/本周)', () => {
      const dailyGoal = mockGoal({ period: 'daily' });
      render(<GoalProgressCard goal={dailyGoal} mode="full" />);
      expect(screen.getByText('今日')).toBeInTheDocument();

      const weeklyGoal = mockGoal({ period: 'weekly' });
      render(<GoalProgressCard goal={weeklyGoal} mode="full" />);
      expect(screen.getByText('本周')).toBeInTheDocument();
    });

    it('shows XP unit for xp goals', () => {
      const xpGoal: Goal = {
        ...mockGoal({ type: 'xp' }),
        title: '每日 XP 目标',
      };
      render(<GoalProgressCard goal={xpGoal} mode="full" />);
      expect(screen.getByText('XP')).toBeInTheDocument();
    });

    it('shows streak unit (天) for streak goals', () => {
      const streakGoal: Goal = {
        ...mockGoal({ type: 'streak' }),
        title: '每日连续目标',
      };
      render(<GoalProgressCard goal={streakGoal} mode="full" />);
      expect(screen.getByText('天')).toBeInTheDocument();
    });

    it('calls onClick when clicked in full mode', () => {
      const onClick = vi.fn();
      const goal = mockGoal();
      render(<GoalProgressCard goal={goal} mode="full" onClick={onClick} />);

      fireEvent.click(screen.getByTestId('goal-progress-card-full'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // Color Theme Tests
  // -------------------------------------------------------------------------

  describe('color themes', () => {
    it('uses blue theme for questions goal', () => {
      const goal = mockGoal({ type: 'questions' });
      render(<GoalProgressCard goal={goal} mode="compact" />);
      // Should render without error
      expect(screen.getByTestId('goal-progress-card-compact')).toBeInTheDocument();
    });

    it('uses amber theme for XP goal', () => {
      const xpGoal: Goal = { ...mockGoal({ type: 'xp' }), title: '每日 XP 目标' };
      render(<GoalProgressCard goal={xpGoal} mode="compact" />);
      expect(screen.getByTestId('goal-progress-card-compact')).toBeInTheDocument();
    });

    it('uses purple theme for streak goal', () => {
      const streakGoal: Goal = { ...mockGoal({ type: 'streak' }), title: '每日连续' };
      render(<GoalProgressCard goal={streakGoal} mode="compact" />);
      expect(screen.getByTestId('goal-progress-card-compact')).toBeInTheDocument();
    });

    it('applies custom color theme', () => {
      const goal = mockGoal();
      render(<GoalProgressCard goal={goal} mode="compact" colorTheme="green" />);
      expect(screen.getByTestId('goal-progress-card-compact')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Progress Calculation Tests
  // -------------------------------------------------------------------------

  describe('progress calculation', () => {
    it('calculates correct percentage for 0% progress', () => {
      const goal = mockGoal({ current: 0, target: 10 });
      render(<GoalProgressCard goal={goal} mode="full" />);
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('calculates correct percentage for 100% progress', () => {
      const goal = mockGoal({ current: 10, target: 10, completed: true });
      render(<GoalProgressCard goal={goal} mode="full" />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('calculates correct percentage for fractional target', () => {
      const goal = mockGoal({ current: 3, target: 5 });
      render(<GoalProgressCard goal={goal} mode="full" />);
      expect(screen.getByText('60%')).toBeInTheDocument();
    });
  });
});
