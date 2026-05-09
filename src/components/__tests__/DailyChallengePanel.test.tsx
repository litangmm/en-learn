import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DailyChallengePanel } from '../DailyChallengePanel';
import type { DailyChallenge } from '@/data/types';

function createMockChallenge(overrides: Partial<DailyChallenge> = {}): DailyChallenge {
  return {
    id: 'challenge-1',
    title: '完成5道填空题',
    description: '正确完成5道填空题练习',
    type: 'correct',
    target: 5,
    current: 3,
    completed: false,
    claimed: false,
    rewardXP: 20,
    ...overrides,
  };
}

describe('DailyChallengePanel', () => {
  const mockOnClaim = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header with title and date', () => {
    render(
      <DailyChallengePanel
        challenges={[createMockChallenge()]}
        onClaim={mockOnClaim}
        onBack={mockOnBack}
      />,
    );

    expect(screen.getByText('每日挑战')).toBeInTheDocument();
    // Date should be in format like "5月10日"
    const now = new Date();
    const expectedDate = `${now.getMonth() + 1}月${now.getDate()}日`;
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  it('renders challenge cards with correct titles', () => {
    const challenges = [
      createMockChallenge({ id: 'c1', title: '完成5道填空题' }),
      createMockChallenge({ id: 'c2', title: '连续答对3题' }),
      createMockChallenge({ id: 'c3', title: '完成10道题' }),
    ];

    render(
      <DailyChallengePanel
        challenges={challenges}
        onClaim={mockOnClaim}
        onBack={mockOnBack}
      />,
    );

    expect(screen.getByText('完成5道填空题')).toBeInTheDocument();
    expect(screen.getByText('连续答对3题')).toBeInTheDocument();
    expect(screen.getByText('完成10道题')).toBeInTheDocument();
  });

  it('progress bar width matches current/target ratio', () => {
    const challenges = [
      createMockChallenge({ id: 'c1', current: 3, target: 6, completed: false }),
    ];

    render(
      <DailyChallengePanel
        challenges={challenges}
        onClaim={mockOnClaim}
        onBack={mockOnBack}
      />,
    );

    // Find the inner progress bar div (the one with the blue/green color)
    const progressBars = document.querySelectorAll('.rounded-full');
    // The inner bar should have width of 50% (3/6)
    const innerBar = Array.from(progressBars).find(
      (el) => el.classList.contains('bg-blue-500') || el.classList.contains('bg-green-500'),
    );
    expect(innerBar).toBeTruthy();
    expect((innerBar as HTMLElement).style.width).toBe('50%');
  });

  it('completed unclaimed shows claim button with reward XP', () => {
    const challenges = [
      createMockChallenge({
        id: 'c1',
        completed: true,
        claimed: false,
        rewardXP: 20,
      }),
    ];

    render(
      <DailyChallengePanel
        challenges={challenges}
        onClaim={mockOnClaim}
        onBack={mockOnBack}
      />,
    );

    expect(screen.getByText('领取 20 XP')).toBeInTheDocument();
  });

  it('clicking claim calls onClaim with challenge id', () => {
    const challenges = [
      createMockChallenge({
        id: 'challenge-42',
        completed: true,
        claimed: false,
        rewardXP: 20,
      }),
    ];

    render(
      <DailyChallengePanel
        challenges={challenges}
        onClaim={mockOnClaim}
        onBack={mockOnBack}
      />,
    );

    const claimButton = screen.getByText('领取 20 XP');
    fireEvent.click(claimButton);

    expect(mockOnClaim).toHaveBeenCalledWith('challenge-42');
  });

  it('completed claimed shows already claimed badge', () => {
    const challenges = [
      createMockChallenge({
        id: 'c1',
        completed: true,
        claimed: true,
        rewardXP: 20,
      }),
    ];

    render(
      <DailyChallengePanel
        challenges={challenges}
        onClaim={mockOnClaim}
        onBack={mockOnBack}
      />,
    );

    expect(screen.getByText('已领取')).toBeInTheDocument();
  });

  it('in-progress shows X/Y progress text', () => {
    const challenges = [
      createMockChallenge({
        id: 'c1',
        current: 3,
        target: 5,
        completed: false,
      }),
    ];

    render(
      <DailyChallengePanel
        challenges={challenges}
        onClaim={mockOnClaim}
        onBack={mockOnBack}
      />,
    );

    expect(screen.getByText('3/5')).toBeInTheDocument();
  });

  it('back button calls onBack', () => {
    render(
      <DailyChallengePanel
        challenges={[createMockChallenge()]}
        onClaim={mockOnClaim}
        onBack={mockOnBack}
      />,
    );

    // The back button is the first icon button in the header
    const backButton = screen.getByRole('button', { name: '' });
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalled();
  });

  it('shows empty state when challenges array empty', () => {
    render(
      <DailyChallengePanel
        challenges={[]}
        onClaim={mockOnClaim}
        onBack={mockOnBack}
      />,
    );

    expect(screen.getByText('暂无挑战')).toBeInTheDocument();
    expect(screen.getByText('今日挑战已全部完成或暂无可用挑战')).toBeInTheDocument();
  });
});
