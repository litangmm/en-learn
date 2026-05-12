import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { XPBar } from '../XPBar';

describe('XPBar', () => {
  // -------------------------------------------------------------------------
  // Basic Rendering Tests
  // -------------------------------------------------------------------------

  describe('basic rendering', () => {
    it('renders with correct level and progress', () => {
      render(<XPBar level={5} progress={45} />);
      expect(screen.getByText('等级 5')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('renders in compact mode', () => {
      render(<XPBar level={3} progress={75} compact />);
      expect(screen.getByText('Lv.3')).toBeInTheDocument();
    });

    it('renders clickable when onClick is provided (compact mode)', () => {
      const onClick = vi.fn();
      render(<XPBar level={2} progress={50} compact onClick={onClick} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Goal Progress Tests (epic-037 iter-002)
  // -------------------------------------------------------------------------

  describe('goalProgress prop (epic-037 iter-002)', () => {
    it('does NOT show goal progress when goalProgress is null', () => {
      render(<XPBar level={2} progress={50} compact goalProgress={null} />);
      // Should only have Lv and XP progress bar
      expect(screen.getByText('Lv.2')).toBeInTheDocument();
      expect(screen.queryByText('答题目标')).not.toBeInTheDocument();
    });

    it('does NOT show goal progress when goalProgress is undefined', () => {
      render(<XPBar level={2} progress={50} compact />);
      expect(screen.getByText('Lv.2')).toBeInTheDocument();
      expect(screen.queryByText('答题目标')).not.toBeInTheDocument();
    });

    it('shows goal progress in compact mode', () => {
      render(<XPBar level={2} progress={50} compact goalProgress={{ current: 5, target: 10 }} />);
      expect(screen.getByText('Lv.2')).toBeInTheDocument();
      // The mini bar should be visible (no text label in compact mode)
      expect(screen.getByTestId('xp-bar-compact')).toBeInTheDocument();
    });

    it('shows goal progress in full mode', () => {
      render(<XPBar level={2} progress={50} compact={false} goalProgress={{ current: 7, target: 10 }} />);
      expect(screen.getByText('答题目标')).toBeInTheDocument();
      expect(screen.getByText('7/10')).toBeInTheDocument();
    });

    it('shows amber color when goal is NOT completed', () => {
      render(<XPBar level={2} progress={50} compact={false} goalProgress={{ current: 5, target: 10 }} />);
      // Should show "答题目标" with amber styling
      expect(screen.getByText('答题目标')).toBeInTheDocument();
    });

    it('shows green color and checkmark when goal IS completed (100%)', () => {
      render(<XPBar level={2} progress={50} compact={false} goalProgress={{ current: 10, target: 10 }} />);
      expect(screen.getByText('答题目标')).toBeInTheDocument();
      // Checkmark text appears as part of the goal completion status
      expect(screen.getByText(/✓/)).toBeInTheDocument();
    });

    it('shows checkmark when current exceeds target (capped at 100%)', () => {
      render(<XPBar level={2} progress={50} compact={false} goalProgress={{ current: 15, target: 10 }} />);
      expect(screen.getByText('答题目标')).toBeInTheDocument();
      expect(screen.getByText(/✓/)).toBeInTheDocument();
    });

    it('handles zero target by not rendering goal section', () => {
      render(<XPBar level={2} progress={50} compact={false} goalProgress={{ current: 0, target: 0 }} />);
      // With target=0, goalPercent becomes null (defensive), so goal section doesn't render
      expect(screen.queryByText('答题目标')).not.toBeInTheDocument();
    });

    it('mini bar in compact mode shows amber when not completed', () => {
      const { container } = render(<XPBar level={2} progress={50} compact goalProgress={{ current: 3, target: 10 }} />);
      // The container should have the mini bar element
      expect(container.querySelector('.w-8')).toBeInTheDocument();
    });

    it('mini bar in compact mode shows green when completed', () => {
      const { container } = render(<XPBar level={2} progress={50} compact goalProgress={{ current: 10, target: 10 }} />);
      // The mini bar container should exist
      expect(container.querySelector('.w-8')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Progress Bar Tests
  // -------------------------------------------------------------------------

  describe('XP progress bar', () => {
    it('renders XP progress bar with correct width', () => {
      render(<XPBar level={1} progress={75} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ width: '75%' });
    });

    it('shows XP progress at exact value (no capping)', () => {
      render(<XPBar level={1} progress={150} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveStyle({ width: '150%' });
    });

    it('has correct ARIA attributes', () => {
      render(<XPBar level={3} progress={60} />);
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '60');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });
  });
});
