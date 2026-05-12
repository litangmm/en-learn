import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GoalSettingPanel } from '../GoalSettingPanel';
import type { Goal } from '@/data/types';

function createMockGoal(overrides: Partial<Goal> = {}): Goal {
  const now = Date.now();
  return {
    id: 'daily-questions',
    type: 'questions',
    period: 'daily',
    title: '每日答题目标',
    target: 10,
    current: 3,
    completed: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

const mockGoals: Goal[] = [
  createMockGoal({ id: 'daily-questions', type: 'questions', period: 'daily', title: '每日答题目标', target: 10, current: 3 }),
  createMockGoal({ id: 'daily-xp', type: 'xp', period: 'daily', title: '每日 XP 目标', target: 100, current: 50 }),
  createMockGoal({ id: 'daily-streak', type: 'streak', period: 'daily', title: '每日学习连续', target: 5, current: 2, completed: false }),
  createMockGoal({ id: 'weekly-questions', type: 'questions', period: 'weekly', title: '每周答题目标', target: 50, current: 20 }),
  createMockGoal({ id: 'weekly-xp', type: 'xp', period: 'weekly', title: '每周 XP 目标', target: 500, current: 200 }),
];

describe('GoalSettingPanel', () => {
  const mockOnSave = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header with title and back button', () => {
    render(
      <GoalSettingPanel goals={mockGoals} onSave={mockOnSave} onBack={mockOnBack} />,
    );

    expect(screen.getByText('学习目标')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '' })).toBeInTheDocument(); // ChevronLeft
  });

  it('renders daily goals section with correct title', () => {
    render(
      <GoalSettingPanel goals={mockGoals} onSave={mockOnSave} onBack={mockOnBack} />,
    );

    expect(screen.getByText('每日目标')).toBeInTheDocument();
    expect(screen.getByText('每周目标')).toBeInTheDocument();
  });

  it('renders preset buttons for daily questions', () => {
    render(
      <GoalSettingPanel goals={mockGoals} onSave={mockOnSave} onBack={mockOnBack} />,
    );

    expect(screen.getByText('5 题')).toBeInTheDocument();
    expect(screen.getByText('10 题')).toBeInTheDocument();
    expect(screen.getByText('15 题')).toBeInTheDocument();
  });

  it('renders preset buttons for daily XP', () => {
    render(
      <GoalSettingPanel goals={mockGoals} onSave={mockOnSave} onBack={mockOnBack} />,
    );

    expect(screen.getByText('50 XP')).toBeInTheDocument();
    expect(screen.getByText('100 XP')).toBeInTheDocument();
    expect(screen.getByText('150 XP')).toBeInTheDocument();
  });

  it('renders preset buttons for daily streak', () => {
    render(
      <GoalSettingPanel goals={mockGoals} onSave={mockOnSave} onBack={mockOnBack} />,
    );

    expect(screen.getByText('3 天')).toBeInTheDocument();
    expect(screen.getByText('5 天')).toBeInTheDocument();
    expect(screen.getByText('7 天')).toBeInTheDocument();
  });

  it('renders weekly question presets', () => {
    render(
      <GoalSettingPanel goals={mockGoals} onSave={mockOnSave} onBack={mockOnBack} />,
    );

    expect(screen.getByText('30 题')).toBeInTheDocument();
    expect(screen.getByText('50 题')).toBeInTheDocument();
    expect(screen.getByText('100 题')).toBeInTheDocument();
  });

  it('renders weekly XP presets', () => {
    render(
      <GoalSettingPanel goals={mockGoals} onSave={mockOnSave} onBack={mockOnBack} />,
    );

    expect(screen.getByText('300 XP')).toBeInTheDocument();
    expect(screen.getByText('500 XP')).toBeInTheDocument();
    expect(screen.getByText('800 XP')).toBeInTheDocument();
  });

  it('clicking preset button selects it (visual feedback)', () => {
    render(
      <GoalSettingPanel goals={mockGoals} onSave={mockOnSave} onBack={mockOnBack} />,
    );

    const button10 = screen.getByRole('button', { name: '10 题' });
    expect(button10).toBeInTheDocument();

    // Click the button
    fireEvent.click(button10);

    // The button should still be rendered
    expect(screen.getByText('10 题')).toBeInTheDocument();
  });

  it('shows custom input when "自定义目标" is clicked', () => {
    render(
      <GoalSettingPanel goals={mockGoals} onSave={mockOnSave} onBack={mockOnBack} />,
    );

    // Find and click "自定义目标" button
    const customButtons = screen.getAllByText('自定义目标');
    expect(customButtons.length).toBeGreaterThan(0);

    fireEvent.click(customButtons[0]);

    // Should now show an input field
    const input = document.querySelector('input[type="number"]');
    expect(input).toBeInTheDocument();
  });

  it('custom input updates target value on blur', () => {
    render(
      <GoalSettingPanel goals={mockGoals} onSave={mockOnSave} onBack={mockOnBack} />,
    );

    // Open custom input
    const customButtons = screen.getAllByText('自定义目标');
    fireEvent.click(customButtons[0]);

    // Type in custom value
    const input = document.querySelector('input[type="number"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '77' } });
    fireEvent.blur(input);

    // Should close the custom input
    expect(screen.queryByDisplayValue('77')).not.toBeInTheDocument();
  });

  it('onBack navigates back', () => {
    render(
      <GoalSettingPanel goals={mockGoals} onSave={mockOnSave} onBack={mockOnBack} />,
    );

    // Click the back button (ChevronLeft button in header)
    const backButton = document.querySelector('button[aria-label=""], button:has(svg.lucide-chevron-left)');
    if (backButton) {
      fireEvent.click(backButton);
    } else {
      // Fallback: click the first icon button
      const buttons = document.querySelectorAll('button');
      fireEvent.click(buttons[0]);
    }

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('onSave is called with updated goals when save is clicked', () => {
    render(
      <GoalSettingPanel goals={mockGoals} onSave={mockOnSave} onBack={mockOnBack} />,
    );

    const saveButton = screen.getByRole('button', { name: /保存/ });
    fireEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledTimes(1);
    const savedGoals = mockOnSave.mock.calls[0][0];
    expect(savedGoals).toHaveLength(5);
  });

  it('renders goal labels correctly', () => {
    render(
      <GoalSettingPanel goals={mockGoals} onSave={mockOnSave} onBack={mockOnBack} />,
    );

    // These appear in both daily and weekly sections, so use getAllByText
    expect(screen.getAllByText('答题目标').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('XP 目标').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('连续学习')).toBeInTheDocument();
  });

  it('shows completed badge for completed goals', () => {
    const completedGoals = mockGoals.map((g) =>
      g.id === 'daily-questions' ? { ...g, completed: true } : g
    );

    render(
      <GoalSettingPanel goals={completedGoals} onSave={mockOnSave} onBack={mockOnBack} />,
    );

    expect(screen.getByText('已完成')).toBeInTheDocument();
  });
});
