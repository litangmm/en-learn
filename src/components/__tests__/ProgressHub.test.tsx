import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressHub } from '../ProgressHub';
import type { DictionaryProgress } from '@/hooks/useProgressStats';

// Mock useProgressStats hook
const mockUseProgressStats = vi.hoisted(() => vi.fn(() => ({
  level: 2,
  totalXP: 150,
  currentXP: 50,
  progressToNextLevel: 50,
  learningDays: 5,
  totalAccuracy: 85,
  completedDictionaries: 2,
  totalQuestions: 40,
  totalCorrect: 34,
})));

// Mock AbilityRadar component
vi.mock('../AbilityRadar', () => ({
  AbilityRadar: vi.fn(() => <div data-testid="ability-radar">Radar Chart</div>),
}));

// Mock ProgressTrend component
vi.mock('../ProgressTrend', () => ({
  ProgressTrend: vi.fn(() => <div data-testid="progress-trend">Trend Chart</div>),
}));

// Mock WeeklyReportCard component
vi.mock('../WeeklyReportCard', () => ({
  WeeklyReportCard: vi.fn(({ report }) => (
    <div data-testid="weekly-report-card">Weekly Report: {report.xpEarned} XP</div>
  )),
}));

// Mock DictionaryProgressOverview component
vi.mock('../DictionaryProgressOverview', () => ({
  DictionaryProgressOverview: vi.fn(({ progress }) => (
    <div data-testid="dictionary-progress-overview">
      {progress.map((p: DictionaryProgress) => <span key={p.dictionaryId}>{p.dictionaryName}</span>)}
    </div>
  )),
}));

// Mock ReviewStreakCalendar component
vi.mock('../ReviewStreakCalendar', () => ({
  ReviewStreakCalendar: vi.fn(({ calendar }) => (
    <div data-testid="review-streak-calendar">Calendar with {calendar.length} days</div>
  )),
}));

// Mock LearningTimeInsights component
vi.mock('../LearningTimeInsights', () => ({
  LearningTimeInsights: vi.fn(() => (
    <div data-testid="learning-time-insights">Time Insights</div>
  )),
}));

// Mock storage.getHistory
vi.mock('@/services/storage', () => ({
  storage: {
    getHistory: vi.fn(() => []),
  },
}));

vi.mock('@/hooks/useProgressStats', async () => {
  const actual = await vi.importActual('@/hooks/useProgressStats');
  return {
    ...actual,
    useProgressStats: mockUseProgressStats,
    getThisWeekReport: vi.fn(() => ({
      weekStart: '2026-05-04',
      weekEnd: '2026-05-10',
      xpEarned: 500,
      questionsAnswered: 50,
      correctAnswers: 40,
      bestStreak: 40,
      learningDays: 5,
      sessionsCompleted: 3,
      accuracy: 80,
      comparison: { xpChange: 25, questionsChange: 15, accuracyChange: 5 },
      generatedAt: Date.now(),
    })),
    getDictionaryProgress: vi.fn(() => [
      { dictionaryId: 'junior', dictionaryName: '初中词汇', totalSentences: 1600, practicedSentences: 100, correctCount: 80, accuracy: 80, progress: 6 },
      { dictionaryId: 'senior', dictionaryName: '高中词汇', totalSentences: 2000, practicedSentences: 50, correctCount: 40, accuracy: 80, progress: 3 },
    ]),
    getReviewStreak: vi.fn(() => [
      { date: '2026-05-01', dayOfMonth: 1, dayOfWeek: 5, hasActivity: true, xpEarned: 50, questionsAnswered: 10 },
      { date: '2026-05-02', dayOfMonth: 2, dayOfWeek: 6, hasActivity: false, xpEarned: 0, questionsAnswered: 0 },
    ]),
  };
});

describe('ProgressHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders header with title and subtitle', () => {
    const onNavigate = vi.fn();
    render(<ProgressHub onNavigate={onNavigate} />);

    expect(screen.getByText('学习进度')).toBeInTheDocument();
    expect(screen.getByText('查看你的学习轨迹')).toBeInTheDocument();
  });

  it('renders XP and level section', () => {
    const onNavigate = vi.fn();
    render(<ProgressHub onNavigate={onNavigate} />);

    expect(screen.getByText('等级 2')).toBeInTheDocument();
    expect(screen.getByText('150 XP 总经验值')).toBeInTheDocument();
  });

  it('renders milestone cards', () => {
    const onNavigate = vi.fn();
    render(<ProgressHub onNavigate={onNavigate} />);

    expect(screen.getByText('学习天数')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('天')).toBeInTheDocument();

    expect(screen.getByText('正确率')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();

    expect(screen.getByText('已完成词库')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    expect(screen.getByText('累计 XP')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('renders quick action buttons', () => {
    const onNavigate = vi.fn();
    render(<ProgressHub onNavigate={onNavigate} />);

    expect(screen.getByText('查看学习历史')).toBeInTheDocument();
    expect(screen.getByText('查看成就徽章')).toBeInTheDocument();
  });

  it('calls onNavigate with history when history card is clicked', () => {
    const onNavigate = vi.fn();
    render(<ProgressHub onNavigate={onNavigate} />);

    // Click the learning days card
    const cards = screen.getAllByRole('button');
    // First milestone card is learning days
    cards[0].click();

    expect(onNavigate).toHaveBeenCalledWith('history');
  });

  it('calls onNavigate with badges when badges button is clicked', () => {
    const onNavigate = vi.fn();
    render(<ProgressHub onNavigate={onNavigate} />);

    // Click the view badges button
    screen.getByText('查看成就徽章').click();

    expect(onNavigate).toHaveBeenCalledWith('badges');
  });

  it('calls onNavigate with dictionary-browser when dictionaries card is clicked', () => {
    const onNavigate = vi.fn();
    render(<ProgressHub onNavigate={onNavigate} />);

    // Find and click the completed dictionaries card
    const cards = screen.getAllByRole('button');
    // Third milestone card is completed dictionaries
    cards[2].click();

    expect(onNavigate).toHaveBeenCalledWith('dictionary-browser');
  });

  it('renders with correct data-testid', () => {
    const onNavigate = vi.fn();
    const { container } = render(<ProgressHub onNavigate={onNavigate} />);

    expect(container.querySelector('[data-testid="progress-hub"]')).toBeInTheDocument();
  });

  it('renders max level message when at max level', () => {
    mockUseProgressStats.mockReturnValueOnce({
      level: 12,
      totalXP: 4500,
      currentXP: 0,
      progressToNextLevel: 100,
      learningDays: 10,
      totalAccuracy: 90,
      completedDictionaries: 5,
      totalQuestions: 100,
      totalCorrect: 90,
    });

    const onNavigate = vi.fn();
    render(<ProgressHub onNavigate={onNavigate} />);

    expect(screen.getByText('已满级')).toBeInTheDocument();
  });
});