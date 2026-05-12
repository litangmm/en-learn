import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReviewStreakCalendar } from '../ReviewStreakCalendar';
import type { CalendarDay } from '@/hooks/useProgressStats';

describe('ReviewStreakCalendar', () => {
  const mockCalendar: CalendarDay[] = [
    { date: '2026-05-01', dayOfMonth: 1, dayOfWeek: 5, hasActivity: true, xpEarned: 50, questionsAnswered: 10 },
    { date: '2026-05-02', dayOfMonth: 2, dayOfWeek: 6, hasActivity: false, xpEarned: 0, questionsAnswered: 0 },
    { date: '2026-05-03', dayOfMonth: 3, dayOfWeek: 0, hasActivity: true, xpEarned: 100, questionsAnswered: 20 },
    { date: '2026-05-04', dayOfMonth: 4, dayOfWeek: 1, hasActivity: true, xpEarned: 75, questionsAnswered: 15 },
    { date: '2026-05-05', dayOfMonth: 5, dayOfWeek: 2, hasActivity: false, xpEarned: 0, questionsAnswered: 0 },
    { date: '2026-05-06', dayOfMonth: 6, dayOfWeek: 3, hasActivity: true, xpEarned: 80, questionsAnswered: 16 },
    { date: '2026-05-07', dayOfMonth: 7, dayOfWeek: 4, hasActivity: true, xpEarned: 60, questionsAnswered: 12 },
  ];

  it('renders with data-testid', () => {
    render(<ReviewStreakCalendar calendar={mockCalendar} />);
    expect(screen.getByTestId('review-streak-calendar')).toBeInTheDocument();
  });

  it('renders header with active days count', () => {
    render(<ReviewStreakCalendar calendar={mockCalendar} />);
    expect(screen.getByText(/5\/7 天活跃/)).toBeInTheDocument();
  });

  it('renders calendar days with tooltips', () => {
    render(<ReviewStreakCalendar calendar={mockCalendar} />);
    const dayWithActivity = screen.getByTestId('calendar-day-2026-05-01');
    expect(dayWithActivity).toBeInTheDocument();
    expect(dayWithActivity).toHaveAttribute('title', '2026-05-01: 10 题, 50 XP');
  });

  it('renders streak indicator when there is a streak', () => {
    render(<ReviewStreakCalendar calendar={mockCalendar} />);
    // Streak is calculated from end: May 7 (true) -> May 6 (true) -> May 5 (false, break)
    // So currentStreak = 2
    expect(screen.getByText('连续 2 天')).toBeInTheDocument();
  });

  it('shows streak indicator for ongoing streak', () => {
    // Calendar ending with activity should show streak
    // May 9 (true), May 8 (true), May 7 (true) = 3 day streak
    const calendarWithStreak: CalendarDay[] = [
      { date: '2026-05-07', dayOfMonth: 7, dayOfWeek: 4, hasActivity: true, xpEarned: 60, questionsAnswered: 12 },
      { date: '2026-05-08', dayOfMonth: 8, dayOfWeek: 5, hasActivity: true, xpEarned: 50, questionsAnswered: 10 },
      { date: '2026-05-09', dayOfMonth: 9, dayOfWeek: 6, hasActivity: true, xpEarned: 60, questionsAnswered: 12 },
    ];
    render(<ReviewStreakCalendar calendar={calendarWithStreak} />);
    expect(screen.getByText('连续 3 天')).toBeInTheDocument();
  });

  it('does not show streak indicator when no activity', () => {
    const noActivity: CalendarDay[] = [
      { date: '2026-05-07', dayOfMonth: 7, dayOfWeek: 4, hasActivity: false, xpEarned: 0, questionsAnswered: 0 },
      { date: '2026-05-08', dayOfMonth: 8, dayOfWeek: 5, hasActivity: false, xpEarned: 0, questionsAnswered: 0 },
    ];
    render(<ReviewStreakCalendar calendar={noActivity} />);
    expect(screen.queryByText(/连续 \d+ 天/)).not.toBeInTheDocument();
  });

  it('renders legend with color scale', () => {
    render(<ReviewStreakCalendar calendar={mockCalendar} />);
    expect(screen.getByText('学习强度:')).toBeInTheDocument();
  });

  it('renders stats footer with total questions and XP', () => {
    render(<ReviewStreakCalendar calendar={mockCalendar} />);
    // Total: 10 + 20 + 15 + 16 + 12 = 73 questions, 365 XP
    expect(screen.getByText('73 题')).toBeInTheDocument();
    expect(screen.getByText('365 XP')).toBeInTheDocument();
  });

  it('renders with custom weeks parameter', () => {
    render(<ReviewStreakCalendar calendar={mockCalendar} weeks={4} />);
    expect(screen.getByTestId('review-streak-calendar')).toBeInTheDocument();
  });

  it('handles empty calendar', () => {
    render(<ReviewStreakCalendar calendar={[]} />);
    expect(screen.getByText(/0\/0 天活跃/)).toBeInTheDocument();
  });
});
