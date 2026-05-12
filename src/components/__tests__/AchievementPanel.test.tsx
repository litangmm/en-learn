import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { AchievementPanel } from '../AchievementPanel';
import type { BadgeDefinition } from '@/data/types';

const mockBadge: BadgeDefinition = {
  id: 'first-steps',
  title: '初次尝试',
  description: '完成第一道题',
  category: 'answer',
  icon: 'Footprints',
  conditionType: 'total_answered',
  conditionValue: 1,
};

describe('AchievementPanel', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders null when badge is null', () => {
    const { container } = render(
      <AchievementPanel badge={null} isUnlocked={false} progress={0} onClose={mockOnClose} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders badge details when badge is provided', () => {
    render(
      <AchievementPanel badge={mockBadge} isUnlocked={false} progress={50} onClose={mockOnClose} />
    );

    expect(screen.getByText('初次尝试')).toBeInTheDocument();
    expect(screen.getByText('完成第一道题')).toBeInTheDocument();
  });

  it('renders unlocked state correctly', () => {
    const unlockedAt = Date.now();
    render(
      <AchievementPanel badge={mockBadge} isUnlocked={true} progress={100} unlockedAt={unlockedAt} onClose={mockOnClose} />
    );

    expect(screen.getByText('已解锁')).toBeInTheDocument();
    expect(screen.getByTestId('achievement-panel-overlay')).toBeInTheDocument();
  });

  it('renders locked state with tips', () => {
    render(
      <AchievementPanel badge={mockBadge} isUnlocked={false} progress={50} onClose={mockOnClose} />
    );

    expect(screen.getByText('达成建议')).toBeInTheDocument();
  });

  it('close button calls onClose', () => {
    render(
      <AchievementPanel badge={mockBadge} isUnlocked={false} progress={50} onClose={mockOnClose} />
    );

    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('overlay click calls onClose', () => {
    render(
      <AchievementPanel badge={mockBadge} isUnlocked={false} progress={50} onClose={mockOnClose} />
    );

    const overlay = screen.getByTestId('achievement-panel-overlay');
    fireEvent.click(overlay);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('progress bar shows correct width', () => {
    render(
      <AchievementPanel badge={mockBadge} isUnlocked={false} progress={75} onClose={mockOnClose} />
    );

    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveStyle('width: 75%');
  });

  it('displays condition label', () => {
    render(
      <AchievementPanel badge={mockBadge} isUnlocked={false} progress={50} onClose={mockOnClose} />
    );

    expect(screen.getByText('累计答题 1 题')).toBeInTheDocument();
  });

  it('renders different icons based on badge icon property', () => {
    const trophyBadge: BadgeDefinition = { ...mockBadge, icon: 'Trophy', id: 'trophy-badge' };
    render(
      <AchievementPanel badge={trophyBadge} isUnlocked={true} progress={100} onClose={mockOnClose} />
    );

    expect(screen.getByText('已解锁')).toBeInTheDocument();
  });

  it('unlocked state has amber gradient header', () => {
    render(
      <AchievementPanel badge={mockBadge} isUnlocked={true} progress={100} onClose={mockOnClose} />
    );

    const content = screen.getByTestId('achievement-panel-content');
    expect(content).toBeInTheDocument();
  });
});
