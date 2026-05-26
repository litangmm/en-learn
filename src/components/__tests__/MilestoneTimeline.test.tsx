import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MilestoneTimeline } from '../MilestoneTimeline';
import * as useLearningProfileModule from '@/hooks/useLearningProfile';

// Mock the useLearningProfile hook
vi.mock('@/hooks/useLearningProfile', () => ({
  useLearningProfile: vi.fn(),
}));

describe('MilestoneTimeline', () => {
  const mockUseLearningProfile = useLearningProfileModule.useLearningProfile as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with data-testid', () => {
    mockUseLearningProfile.mockReturnValue({
      unlockedMilestones: [],
      unlockedMilestoneCount: 0,
      totalMilestones: 7,
      hasActivity: false,
    });

    render(<MilestoneTimeline />);
    expect(screen.getByTestId('milestone-timeline')).toBeInTheDocument();
  });

  it('displays header with milestone count', () => {
    mockUseLearningProfile.mockReturnValue({
      unlockedMilestones: [
        { id: '7-days', title: '初露锋芒', titleEn: 'First Week', icon: '☀️', xpReward: 20, requiredDays: 7, unlockedAt: Date.now() },
      ],
      unlockedMilestoneCount: 1,
      totalMilestones: 7,
      hasActivity: true,
    });

    render(<MilestoneTimeline />);
    expect(screen.getByText('学习里程碑')).toBeInTheDocument();
    expect(screen.getByText('1/7')).toBeInTheDocument();
  });

  it('renders unlocked milestones with green styling', () => {
    const now = Date.now();
    mockUseLearningProfile.mockReturnValue({
      unlockedMilestones: [
        { id: '7-days', title: '初露锋芒', titleEn: 'First Week', icon: '☀️', xpReward: 20, requiredDays: 7, unlockedAt: now },
      ],
      unlockedMilestoneCount: 1,
      totalMilestones: 7,
      hasActivity: true,
    });

    render(<MilestoneTimeline />);
    const unlockedMilestone = screen.getByTestId('milestone-unlocked-7-days');
    expect(unlockedMilestone).toBeInTheDocument();
    expect(unlockedMilestone).toHaveAttribute('data-unlocked', 'true');
  });

  it('renders locked milestones in grayed state', () => {
    mockUseLearningProfile.mockReturnValue({
      unlockedMilestones: [],
      unlockedMilestoneCount: 0,
      totalMilestones: 7,
      hasActivity: false,
    });

    render(<MilestoneTimeline />);
    const lockedMilestone = screen.getByTestId('milestone-locked-14-days');
    expect(lockedMilestone).toBeInTheDocument();
    expect(lockedMilestone).toHaveAttribute('data-unlocked', 'false');
    expect(lockedMilestone).toHaveClass('opacity-50');
  });

  it('shows milestone title and English name for unlocked milestones', () => {
    mockUseLearningProfile.mockReturnValue({
      unlockedMilestones: [
        { id: '7-days', title: '初露锋芒', titleEn: 'First Week', icon: '☀️', xpReward: 20, requiredDays: 7, unlockedAt: Date.now() },
      ],
      unlockedMilestoneCount: 1,
      totalMilestones: 7,
      hasActivity: true,
    });

    render(<MilestoneTimeline />);
    expect(screen.getByText('初露锋芒')).toBeInTheDocument();
    expect(screen.getByText('First Week')).toBeInTheDocument();
  });

  it('shows unlock date for unlocked milestones', () => {
    const now = Date.now();
    mockUseLearningProfile.mockReturnValue({
      unlockedMilestones: [
        { id: '7-days', title: '初露锋芒', titleEn: 'First Week', icon: '☀️', xpReward: 20, requiredDays: 7, unlockedAt: now },
      ],
      unlockedMilestoneCount: 1,
      totalMilestones: 7,
      hasActivity: true,
    });

    render(<MilestoneTimeline />);
    expect(screen.getByTestId('milestone-date-7-days')).toBeInTheDocument();
    expect(screen.getByTestId('milestone-date-7-days').textContent).toContain('解锁于');
  });

  it('shows required days for locked milestones', () => {
    mockUseLearningProfile.mockReturnValue({
      unlockedMilestones: [],
      unlockedMilestoneCount: 0,
      totalMilestones: 7,
      hasActivity: false,
    });

    render(<MilestoneTimeline />);
    expect(screen.getByTestId('milestone-days-14-days')).toBeInTheDocument();
    expect(screen.getByTestId('milestone-days-14-days').textContent).toContain('需要 14 天');
  });

  it('displays XP rewards when showXP is true', () => {
    mockUseLearningProfile.mockReturnValue({
      unlockedMilestones: [
        { id: '7-days', title: '初露锋芒', titleEn: 'First Week', icon: '☀️', xpReward: 20, requiredDays: 7, unlockedAt: Date.now() },
      ],
      unlockedMilestoneCount: 1,
      totalMilestones: 7,
      hasActivity: true,
    });

    render(<MilestoneTimeline />);
    expect(screen.getByTestId('milestone-xp-7-days')).toBeInTheDocument();
    expect(screen.getByTestId('milestone-xp-7-days').textContent).toContain('+20 XP');
  });

  it('hides XP rewards when showXP is false', () => {
    mockUseLearningProfile.mockReturnValue({
      unlockedMilestones: [
        { id: '7-days', title: '初露锋芒', titleEn: 'First Week', icon: '☀️', xpReward: 20, requiredDays: 7, unlockedAt: Date.now() },
      ],
      unlockedMilestoneCount: 1,
      totalMilestones: 7,
      hasActivity: true,
    });

    render(<MilestoneTimeline showXP={false} />);
    expect(screen.queryByTestId('milestone-xp-7-days')).not.toBeInTheDocument();
  });

  it('shows correct XP badge styling for locked milestones', () => {
    mockUseLearningProfile.mockReturnValue({
      unlockedMilestones: [],
      unlockedMilestoneCount: 0,
      totalMilestones: 7,
      hasActivity: false,
    });

    render(<MilestoneTimeline />);
    const lockedXP = screen.getByTestId('milestone-xp-locked-14-days');
    expect(lockedXP).toBeInTheDocument();
    expect(lockedXP).toHaveClass('bg-slate-100', 'text-slate-400');
  });

  it('renders progress bar with correct percentage', () => {
    mockUseLearningProfile.mockReturnValue({
      unlockedMilestones: [
        { id: '7-days', title: '初露锋芒', titleEn: 'First Week', icon: '☀️', xpReward: 20, requiredDays: 7, unlockedAt: Date.now() },
        { id: '14-days', title: '坚持不懈', titleEn: 'Two Weeks', icon: '🌟', xpReward: 50, requiredDays: 14, unlockedAt: Date.now() },
      ],
      unlockedMilestoneCount: 2,
      totalMilestones: 7,
      hasActivity: true,
    });

    render(<MilestoneTimeline />);
    const progressBar = screen.getByTestId('milestone-progress-bar');
    expect(progressBar).toBeInTheDocument();
    // 2/7 = 28.57%, rounded to 29%
    expect(screen.getByText('29%')).toBeInTheDocument();
  });

  it('renders milestones in correct order (unlocked first, then locked)', () => {
    mockUseLearningProfile.mockReturnValue({
      unlockedMilestones: [
        { id: '30-days', title: '月度学习者', titleEn: 'One Month', icon: '🌙', xpReward: 100, requiredDays: 30, unlockedAt: Date.now() },
      ],
      unlockedMilestoneCount: 1,
      totalMilestones: 7,
      hasActivity: true,
    });

    render(<MilestoneTimeline />);

    // Get all milestone elements
    const container = screen.getByTestId('milestone-timeline');
    const allMilestones = container.querySelectorAll('[data-testid^="milestone-unlocked-"], [data-testid^="milestone-locked-"]');

    // First should be the unlocked 30-days milestone
    expect(allMilestones[0]).toHaveAttribute('data-testid', 'milestone-unlocked-30-days');

    // Locked milestones should follow (in order of requiredDays)
    const lockedMilestones = Array.from(allMilestones).filter((el) =>
      el.getAttribute('data-testid')?.startsWith('milestone-locked-')
    );

    // Verify locked milestones are in order
    expect(lockedMilestones.length).toBe(6);
    expect(lockedMilestones[0]).toHaveAttribute('data-testid', 'milestone-locked-7-days');
    expect(lockedMilestones[1]).toHaveAttribute('data-testid', 'milestone-locked-14-days');
  });

  it('renders timeline connectors between unlocked milestones', () => {
    mockUseLearningProfile.mockReturnValue({
      unlockedMilestones: [
        { id: '7-days', title: '初露锋芒', titleEn: 'First Week', icon: '☀️', xpReward: 20, requiredDays: 7, unlockedAt: Date.now() },
        { id: '14-days', title: '坚持不懈', titleEn: 'Two Weeks', icon: '🌟', xpReward: 50, requiredDays: 14, unlockedAt: Date.now() },
      ],
      unlockedMilestoneCount: 2,
      totalMilestones: 7,
      hasActivity: true,
    });

    render(<MilestoneTimeline />);

    // Should have connectors between unlocked milestones
    const connectors = screen.getAllByTestId('timeline-connector');
    expect(connectors.length).toBeGreaterThan(0);
  });

  it('renders correctly when all milestones are still locked', () => {
    // This tests the typical "no progress yet" state where all milestones are locked
    mockUseLearningProfile.mockReturnValue({
      unlockedMilestones: [],
      unlockedMilestoneCount: 0,
      totalMilestones: 7,
      hasActivity: false,
    });

    render(<MilestoneTimeline />);
    // Should show all 7 milestones as locked
    expect(screen.getByText('0/7')).toBeInTheDocument();
    // First locked milestone should be visible
    expect(screen.getByTestId('milestone-locked-7-days')).toBeInTheDocument();
    expect(screen.getByText('初露锋芒')).toBeInTheDocument();
    // Progress should be 0%
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    mockUseLearningProfile.mockReturnValue({
      unlockedMilestones: [],
      unlockedMilestoneCount: 0,
      totalMilestones: 7,
      hasActivity: false,
    });

    render(<MilestoneTimeline className="custom-class" />);
    const container = screen.getByTestId('milestone-timeline');
    expect(container).toHaveClass('custom-class');
  });

  it('renders icon for each milestone', () => {
    mockUseLearningProfile.mockReturnValue({
      unlockedMilestones: [
        { id: '7-days', title: '初露锋芒', titleEn: 'First Week', icon: '☀️', xpReward: 20, requiredDays: 7, unlockedAt: Date.now() },
      ],
      unlockedMilestoneCount: 1,
      totalMilestones: 7,
      hasActivity: true,
    });

    render(<MilestoneTimeline />);

    // Check for the sun emoji icon
    const unlockedMilestone = screen.getByTestId('milestone-unlocked-7-days');
    expect(unlockedMilestone.textContent).toContain('☀️');
  });

  it('shows correct styling for gradient connector between unlocked and locked', () => {
    mockUseLearningProfile.mockReturnValue({
      unlockedMilestones: [
        { id: '7-days', title: '初露锋芒', titleEn: 'First Week', icon: '☀️', xpReward: 20, requiredDays: 7, unlockedAt: Date.now() },
      ],
      unlockedMilestoneCount: 1,
      totalMilestones: 7,
      hasActivity: true,
    });

    render(<MilestoneTimeline />);

    // Should have a gradient connector from unlocked to locked
    const gradientConnector = document.querySelector('.bg-gradient-to-b');
    expect(gradientConnector).toBeInTheDocument();
  });

  it('displays all 7 milestone definitions correctly', () => {
    mockUseLearningProfile.mockReturnValue({
      unlockedMilestones: [],
      unlockedMilestoneCount: 0,
      totalMilestones: 7,
      hasActivity: false,
    });

    render(<MilestoneTimeline />);

    // Check all Chinese titles
    expect(screen.getByText('初露锋芒')).toBeInTheDocument();
    expect(screen.getByText('坚持不懈')).toBeInTheDocument();
    expect(screen.getByText('月度学习者')).toBeInTheDocument();
    expect(screen.getByText('双月成就')).toBeInTheDocument();
    expect(screen.getByText('季度达人')).toBeInTheDocument();
    expect(screen.getByText('半年坚持')).toBeInTheDocument();
    expect(screen.getByText('年度学习者')).toBeInTheDocument();
  });

  it('handles full milestone progress (all unlocked)', () => {
    const now = Date.now();
    mockUseLearningProfile.mockReturnValue({
      unlockedMilestones: [
        { id: '7-days', title: '初露锋芒', titleEn: 'First Week', icon: '☀️', xpReward: 20, requiredDays: 7, unlockedAt: now },
        { id: '14-days', title: '坚持不懈', titleEn: 'Two Weeks', icon: '🌟', xpReward: 50, requiredDays: 14, unlockedAt: now },
        { id: '30-days', title: '月度学习者', titleEn: 'One Month', icon: '🌙', xpReward: 100, requiredDays: 30, unlockedAt: now },
        { id: '60-days', title: '双月成就', titleEn: 'Two Months', icon: '⭐', xpReward: 200, requiredDays: 60, unlockedAt: now },
        { id: '90-days', title: '季度达人', titleEn: 'Three Months', icon: '🌈', xpReward: 300, requiredDays: 90, unlockedAt: now },
        { id: '180-days', title: '半年坚持', titleEn: 'Half Year', icon: '🎯', xpReward: 500, requiredDays: 180, unlockedAt: now },
        { id: '365-days', title: '年度学习者', titleEn: 'One Year', icon: '🏆', xpReward: 1000, requiredDays: 365, unlockedAt: now },
      ],
      unlockedMilestoneCount: 7,
      totalMilestones: 7,
      hasActivity: true,
    });

    render(<MilestoneTimeline />);

    // All should be 100%
    expect(screen.getByText('7/7')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});