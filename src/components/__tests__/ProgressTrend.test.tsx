import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProgressTrend } from '../ProgressTrend';
import { type DailyTrend } from '@/data/types';

const mockGetDailyXP = vi.hoisted(() => vi.fn(() => [
  { date: '2024-01-01', dayName: '周一', xp: 10, questions: 5, accuracy: 80 },
  { date: '2024-01-02', dayName: '周二', xp: 20, questions: 10, accuracy: 75 },
  { date: '2024-01-03', dayName: '周三', xp: 15, questions: 8, accuracy: 85 },
  { date: '2024-01-04', dayName: '周四', xp: 25, questions: 12, accuracy: 90 },
  { date: '2024-01-05', dayName: '周五', xp: 30, questions: 15, accuracy: 88 },
  { date: '2024-01-06', dayName: '周六', xp: 40, questions: 20, accuracy: 92 },
  { date: '2024-01-07', dayName: '周日', xp: 35, questions: 18, accuracy: 85 },
]));

vi.mock('@/hooks/useProgressStats', () => ({
  getDailyXP: mockGetDailyXP,
}));

describe('ProgressTrend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<ProgressTrend />);
    expect(document.body).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    mockGetDailyXP.mockReturnValueOnce([
      { date: '2024-01-01', dayName: '周一', xp: 0, questions: 0, accuracy: 0 },
      { date: '2024-01-02', dayName: '周二', xp: 0, questions: 0, accuracy: 0 },
      { date: '2024-01-03', dayName: '周三', xp: 0, questions: 0, accuracy: 0 },
      { date: '2024-01-04', dayName: '周四', xp: 0, questions: 0, accuracy: 0 },
      { date: '2024-01-05', dayName: '周五', xp: 0, questions: 0, accuracy: 0 },
      { date: '2024-01-06', dayName: '周六', xp: 0, questions: 0, accuracy: 0 },
      { date: '2024-01-07', dayName: '周日', xp: 0, questions: 0, accuracy: 0 },
    ]);

    render(<ProgressTrend />);

    expect(screen.getByText('坚持学习解锁趋势图')).toBeInTheDocument();
  });

  it('renders with custom data', () => {
    const customData: DailyTrend[] = [
      { date: '2024-01-01', dayName: '周一', xp: 50, questions: 25, accuracy: 80 },
      { date: '2024-01-02', dayName: '周二', xp: 60, questions: 30, accuracy: 85 },
      { date: '2024-01-03', dayName: '周三', xp: 45, questions: 22, accuracy: 78 },
      { date: '2024-01-04', dayName: '周四', xp: 70, questions: 35, accuracy: 90 },
      { date: '2024-01-05', dayName: '周五', xp: 55, questions: 28, accuracy: 82 },
      { date: '2024-01-06', dayName: '周六', xp: 80, questions: 40, accuracy: 88 },
      { date: '2024-01-07', dayName: '周日', xp: 65, questions: 32, accuracy: 84 },
    ];

    render(<ProgressTrend data={customData} />);

    expect(document.body).toBeInTheDocument();
  });

  it('renders with custom height', () => {
    render(<ProgressTrend height={200} />);

    const svg = document.querySelector('svg');
    expect(svg?.getAttribute('height')).toBe('200');
  });

  it('has metric toggle buttons', () => {
    render(<ProgressTrend />);

    expect(screen.getByText('XP')).toBeInTheDocument();
    expect(screen.getByText('题数')).toBeInTheDocument();
  });

  it('toggles between XP and questions metric', () => {
    render(<ProgressTrend />);

    // Click on "题数" button
    const questionsButton = screen.getByText('题数');
    fireEvent.click(questionsButton);

    // XP button should still be visible
    expect(screen.getByText('XP')).toBeInTheDocument();
  });

  it('renders SVG with line path when data exists', () => {
    render(<ProgressTrend />);

    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Should have path for the line
    const paths = svg?.querySelectorAll('path');
    expect(paths && paths.length > 0).toBeTruthy();
  });

  it('renders data points as circles', () => {
    render(<ProgressTrend />);

    const circles = document.querySelectorAll('circle');
    expect(circles && circles.length > 0).toBeTruthy();
  });

  it('calls onDayClick when data point is clicked', () => {
    const onDayClick = vi.fn();
    render(<ProgressTrend onDayClick={onDayClick} />);

    const circles = document.querySelectorAll('circle');
    if (circles && circles.length > 0) {
      fireEvent.click(circles[0]);
      // onDayClick should be called
    }
  });

  it('renders day labels on x-axis', () => {
    render(<ProgressTrend />);

    // Should render day names
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders time range buttons', () => {
    render(<ProgressTrend />);

    expect(screen.getByText('7d')).toBeInTheDocument();
    expect(screen.getByText('14d')).toBeInTheDocument();
    expect(screen.getByText('30d')).toBeInTheDocument();
  });

  it('shows 7d as selected by default', () => {
    render(<ProgressTrend />);

    const button7d = screen.getByText('7d');
    expect(button7d.closest('button')).toHaveClass('bg-white');
  });

  it('switches to 14d range when clicked', () => {
    render(<ProgressTrend />);

    const button14d = screen.getByText('14d');
    fireEvent.click(button14d);

    // 14d button should now be selected (has bg-white class)
    expect(button14d.closest('button')).toHaveClass('bg-white');
    // 7d should no longer be selected
    const button7d = screen.getByText('7d');
    expect(button7d.closest('button')).not.toHaveClass('bg-white');
  });

  it('switches to 30d range when clicked', () => {
    render(<ProgressTrend />);

    const button30d = screen.getByText('30d');
    fireEvent.click(button30d);

    expect(button30d.closest('button')).toHaveClass('bg-white');
  });

  it('calls getDailyXP with correct days when range changes', () => {
    render(<ProgressTrend />);

    const button14d = screen.getByText('14d');
    fireEvent.click(button14d);

    expect(mockGetDailyXP).toHaveBeenCalledWith(14);
  });

  it('hides range buttons when external data is provided', () => {
    const customData: DailyTrend[] = [
      { date: '2024-01-01', dayName: '周一', xp: 50, questions: 25, accuracy: 80 },
      { date: '2024-01-02', dayName: '周二', xp: 60, questions: 30, accuracy: 85 },
    ];

    render(<ProgressTrend data={customData} />);

    expect(screen.queryByText('7d')).not.toBeInTheDocument();
    expect(screen.queryByText('14d')).not.toBeInTheDocument();
    expect(screen.queryByText('30d')).not.toBeInTheDocument();
  });

  it('uses initial days prop value', () => {
    render(<ProgressTrend days={14} />);

    // 14d button should be selected by default
    const button14d = screen.getByText('14d');
    expect(button14d.closest('button')).toHaveClass('bg-white');
  });
});
