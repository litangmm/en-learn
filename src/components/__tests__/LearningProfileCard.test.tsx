import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { LearningProfileCard } from '../LearningProfileCard';

// Mock the storage service
vi.mock('@/services/storage', () => ({
  storage: {
    getXPProfile: vi.fn(() => ({
      totalXP: 500,
      currentLevel: 5,
    })),
    getHistory: vi.fn(() => []),
    getModeStats: vi.fn(() => ({})),
    getBadgeProgress: vi.fn(() => ({
      totalAnswered: 200,
      totalCorrect: 170,
      totalSessions: 15,
      maxStreakEver: 12,
      perfectSessions: 3,
      totalReviews: 20,
      totalChallengesCompleted: 5,
    })),
    getMilestones: vi.fn(() => ({
      unlockedMilestones: [],
    })),
  },
}));

// Mock LEVEL_THRESHOLDS and MILESTONE_DEFINITIONS
vi.mock('@/data/types', () => ({
  LEVEL_THRESHOLDS: [0, 100, 300, 600, 1000, 1500],
  MILESTONE_DEFINITIONS: [],
}));

// Mock ALL_MODES
vi.mock('@/hooks/useProgressStats', () => ({
  ALL_MODES: ['fill-in-blanks', 'multiple-choice', 'sentence-reorder', 'dictation'],
}));

describe('LearningProfileCard', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders all 4 stat cards', () => {
    render(<LearningProfileCard />);

    const container = screen.getByTestId('learning-profile-card');
    expect(container).toBeInTheDocument();

    const statCards = container.querySelectorAll('[data-testid^="stat-card-"]');
    expect(statCards).toHaveLength(4);
  });

  it('displays total learning days', () => {
    render(<LearningProfileCard />);

    // With empty history, there should be at least 0 or 1 day (today if XP > 0)
    // Mock shows XP > 0 so today is counted
    const label = screen.getByText('总学习天数');
    expect(label).toBeInTheDocument();
    expect(label.parentElement?.parentElement?.textContent).toMatch(/总学习天数/);
  });

  it('displays total questions answered', () => {
    render(<LearningProfileCard />);

    // Mock shows 200 totalAnswered
    expect(screen.getByText('总答题数')).toBeInTheDocument();
  });

  it('displays total accuracy percentage', () => {
    render(<LearningProfileCard />);

    // Mock: 170/200 = 85%
    expect(screen.getByText('总正确率')).toBeInTheDocument();
  });

  it('displays maximum streak ever achieved', () => {
    render(<LearningProfileCard />);

    // Mock shows 12 maxStreakEver
    expect(screen.getByText('最高连击')).toBeInTheDocument();
  });

  it('displays correct values from hook data', () => {
    render(<LearningProfileCard />);

    // The total questions should be 200 (from mock)
    // Find the stat card with label "总答题数" and check its value
    const questionsLabel = screen.getByText('总答题数');
    const questionsValue = questionsLabel.parentElement?.parentElement?.querySelector('p:last-child');
    expect(questionsValue?.textContent).toBe('200');
  });

  it('displays 85% accuracy for 170/200 correct', () => {
    render(<LearningProfileCard />);

    // Find accuracy stat card
    const accuracyLabel = screen.getByText('总正确率');
    const accuracyValue = accuracyLabel.parentElement?.parentElement?.querySelector('p:last-child');
    expect(accuracyValue?.textContent).toBe('85%');
  });

  it('displays correct streak value', () => {
    render(<LearningProfileCard />);

    // Find streak stat card
    const streakLabel = screen.getByText('最高连击');
    const streakValue = streakLabel.parentElement?.parentElement?.querySelector('p:last-child');
    expect(streakValue?.textContent).toBe('12');
  });

  it('renders with proper icon colors for each stat', () => {
    const { container } = render(<LearningProfileCard />);

    // CalendarDays - blue
    expect(container.innerHTML).toContain('bg-blue-50');
    // HelpCircle - purple
    expect(container.innerHTML).toContain('bg-purple-50');
    // Target - green
    expect(container.innerHTML).toContain('bg-green-50');
    // Flame - orange
    expect(container.innerHTML).toContain('bg-orange-50');
  });

  it('handles zero/empty data gracefully', async () => {
    // Create a module with zero data
    const zeroModule = {
      storage: {
        getXPProfile: vi.fn(() => ({
          totalXP: 0,
          currentLevel: 1,
        })),
        getHistory: vi.fn(() => []),
        getModeStats: vi.fn(() => ({})),
        getBadgeProgress: vi.fn(() => ({
          totalAnswered: 0,
          totalCorrect: 0,
          totalSessions: 0,
          maxStreakEver: 0,
          perfectSessions: 0,
          totalReviews: 0,
          totalChallengesCompleted: 0,
        })),
        getMilestones: vi.fn(() => ({
          unlockedMilestones: [],
        })),
      },
    };

    // Re-mock with zero data
    vi.doMock('@/services/storage', () => zeroModule);
    vi.doMock('@/data/types', () => ({
      LEVEL_THRESHOLDS: [0, 100, 300, 600, 1000, 1500],
      MILESTONE_DEFINITIONS: [],
    }));

    // Clear the module cache to pick up new mocks
    vi.resetModules();

    // Re-import component with new mocks
    const { LearningProfileCard: FreshLearningProfileCard } = await import('../LearningProfileCard');

    cleanup();
    render(<FreshLearningProfileCard />);

    // Should display 0% accuracy
    const accuracyLabel = screen.getByText('总正确率');
    const accuracyValue = accuracyLabel.parentElement?.parentElement?.querySelector('p:last-child');
    expect(accuracyValue?.textContent).toBe('0%');
  });

  it('applies custom className when provided', () => {
    render(<LearningProfileCard className="custom-class" />);

    const grid = screen.getByTestId('learning-profile-card');
    expect(grid.className).toContain('custom-class');
  });

  it('renders in responsive grid layout', () => {
    render(<LearningProfileCard />);

    const grid = screen.getByTestId('learning-profile-card');
    expect(grid.className).toContain('grid');
    expect(grid.className).toContain('grid-cols-2');
    expect(grid.className).toContain('lg:grid-cols-4');
  });

  it('displays all labels correctly', () => {
    render(<LearningProfileCard />);

    expect(screen.getByText('总学习天数')).toBeInTheDocument();
    expect(screen.getByText('总答题数')).toBeInTheDocument();
    expect(screen.getByText('总正确率')).toBeInTheDocument();
    expect(screen.getByText('最高连击')).toBeInTheDocument();
  });

  it('each stat card has icon, value, and label', () => {
    render(<LearningProfileCard />);

    const statCards = screen.getAllByTestId(/^stat-card-\d+$/);

    statCards.forEach((card) => {
      // Should have icon container (w-10 h-10 rounded-lg)
      expect(card.querySelector('.w-10')).toBeInTheDocument();
      expect(card.querySelector('.h-10')).toBeInTheDocument();
      expect(card.querySelector('.rounded-lg')).toBeInTheDocument();

      // Should have label (text-xs text-slate-500)
      expect(card.querySelector('.text-xs')).toBeInTheDocument();

      // Should have value (text-xl font-bold)
      expect(card.querySelector('.text-xl')).toBeInTheDocument();
    });
  });

  it('renders with lucide-react icons', () => {
    const { container } = render(<LearningProfileCard />);

    // Check that SVG icons are rendered (lucide-react uses SVG)
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBe(4);
  });
});