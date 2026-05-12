import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MilestoneCard } from '../MilestoneCard';
import { Trophy, Target } from 'lucide-react';

describe('MilestoneCard', () => {
  it('renders title, value, and subtitle', () => {
    render(
      <MilestoneCard
        icon={<Trophy className="w-5 h-5" />}
        title="学习天数"
        value={42}
        subtitle="天"
      />
    );

    expect(screen.getByText('学习天数')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('天')).toBeInTheDocument();
  });

  it('renders without subtitle', () => {
    render(
      <MilestoneCard
        icon={<Target className="w-5 h-5" />}
        title="正确率"
        value="85%"
      />
    );

    expect(screen.getByText('正确率')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.queryByText('题')).not.toBeInTheDocument();
  });

  it('renders progress bar when progress is provided', () => {
    const { container } = render(
      <MilestoneCard
        icon={<Trophy className="w-5 h-5" />}
        title="进度"
        value="75%"
        progress={75}
      />
    );

    const progressBar = container.querySelector('.h-1\\.5');
    expect(progressBar).toBeInTheDocument();
    const fill = progressBar?.querySelector('.bg-blue-500');
    expect(fill).toBeInTheDocument();
  });

  it('does not render progress bar when progress is undefined', () => {
    const { container } = render(
      <MilestoneCard
        icon={<Trophy className="w-5 h-5" />}
        title="进度"
        value="50%"
      />
    );

    const progressBar = container.querySelector('.h-1\\.5');
    expect(progressBar).not.toBeInTheDocument();
  });

  it('handles click when onClick is provided', () => {
    const handleClick = vi.fn();
    render(
      <MilestoneCard
        icon={<Trophy className="w-5 h-5" />}
        title="点击"
        value="10"
        onClick={handleClick}
      />
    );

    const button = screen.getByRole('button');
    button.click();

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not trigger click when onClick is not provided', () => {
    const { container } = render(
      <MilestoneCard
        icon={<Trophy className="w-5 h-5" />}
        title="不可点击"
        value="20"
      />
    );

    // Should be a button but disabled
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('renders with correct data-testid', () => {
    render(
      <MilestoneCard
        icon={<Trophy className="w-5 h-5" />}
        title="测试ID"
        value={100}
      />
    );

    expect(screen.getByTestId('milestone-card')).toBeInTheDocument();
  });
});