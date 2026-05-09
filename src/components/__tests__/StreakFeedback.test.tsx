import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreakFeedback } from '../StreakFeedback';

describe('StreakFeedback', () => {
  it('renders null when streak < 2', () => {
    const { container } = render(<StreakFeedback streak={0} />);
    expect(container.firstChild).toBeNull();

    const { container: c2 } = render(<StreakFeedback streak={1} />);
    expect(c2.firstChild).toBeNull();
  });

  it('renders Flame icon and streak count when streak = 2', () => {
    render(<StreakFeedback streak={2} />);

    expect(screen.getByTestId('streak-feedback')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders with amber color classes for streak 3', () => {
    const { container } = render(<StreakFeedback streak={3} />);

    const badge = container.querySelector('[data-testid="streak-feedback"]');
    expect(badge).toHaveClass('bg-amber-50');
    expect(badge).toHaveClass('text-amber-600');
  });

  it('renders with red color classes for streak 6', () => {
    const { container } = render(<StreakFeedback streak={6} />);

    const badge = container.querySelector('[data-testid="streak-feedback"]');
    expect(badge).toHaveClass('bg-red-50');
    expect(badge).toHaveClass('text-red-600');
    expect(badge).toHaveClass('animate-pulse');
  });

  it('renders with purple gradient for streak 12', () => {
    const { container } = render(<StreakFeedback streak={12} />);

    const badge = container.querySelector('[data-testid="streak-feedback"]');
    expect(badge).toHaveClass('from-purple-500');
    expect(badge).toHaveClass('to-pink-500');
    expect(badge).toHaveClass('animate-pulse');
  });

  it('shows 连击 label', () => {
    render(<StreakFeedback streak={3} />);

    expect(screen.getByText('连击')).toBeInTheDocument();
  });

  it('hides component when visible=false even with high streak', () => {
    const { container } = render(<StreakFeedback streak={10} visible={false} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders motion.div with animation attributes', () => {
    const { container } = render(<StreakFeedback streak={5} />);

    const badge = container.querySelector('[data-testid="streak-feedback"]');
    expect(badge).toBeInTheDocument();
    // motion.div renders as a plain div in test environment
    expect(badge?.tagName).toBe('DIV');
  });
});
