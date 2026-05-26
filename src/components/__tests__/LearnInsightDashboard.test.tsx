import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LearnInsightDashboard } from '../LearnInsightDashboard';
import type { DailyTrend, FilteredTrend } from '@/data/types';

// Mock data for getDailyXP
const mockDailyXP: DailyTrend[] = [
  { date: '2024-01-01', dayName: '周一', xp: 10, questions: 5, accuracy: 80 },
  { date: '2024-01-02', dayName: '周二', xp: 20, questions: 10, accuracy: 75 },
  { date: '2024-01-03', dayName: '周三', xp: 15, questions: 8, accuracy: 85 },
  { date: '2024-01-04', dayName: '周四', xp: 25, questions: 12, accuracy: 90 },
  { date: '2024-01-05', dayName: '周五', xp: 30, questions: 15, accuracy: 88 },
  { date: '2024-01-06', dayName: '周六', xp: 40, questions: 20, accuracy: 92 },
  { date: '2024-01-07', dayName: '周日', xp: 35, questions: 18, accuracy: 85 },
];

// Mock data for getFilteredTrend
const mockFilteredTrend: FilteredTrend[] = [
  { date: '2024-01-01', dayName: '周一', xp: 5, questions: 2, accuracy: 80, modesPracticed: ['fill-in-blanks'], hasActivity: true },
  { date: '2024-01-02', dayName: '周二', xp: 0, questions: 0, accuracy: 0, modesPracticed: [], hasActivity: false },
  { date: '2024-01-03', dayName: '周三', xp: 8, questions: 4, accuracy: 85, modesPracticed: ['fill-in-blanks'], hasActivity: true },
  { date: '2024-01-04', dayName: '周四', xp: 0, questions: 0, accuracy: 0, modesPracticed: [], hasActivity: false },
  { date: '2024-01-05', dayName: '周五', xp: 12, questions: 6, accuracy: 88, modesPracticed: ['fill-in-blanks'], hasActivity: true },
  { date: '2024-01-06', dayName: '周六', xp: 0, questions: 0, accuracy: 0, modesPracticed: [], hasActivity: false },
  { date: '2024-01-07', dayName: '周日', xp: 7, questions: 3, accuracy: 85, modesPracticed: ['fill-in-blanks'], hasActivity: true },
];

// Mock the hooks
vi.mock('@/hooks/useLearnInsights', () => ({
  useLearnInsights: vi.fn(() => ({
    healthScore: { level: 'high', score: 85, color: '#22c55e', icon: 'activity' },
    xpProfile: { totalXP: 1000, currentLevel: 3, progressToNextLevel: 50 },
    streak: { currentStreak: 5, longestStreak: 10, isActive: true },
    accuracy: { total: 75, trend: 'up' },
    weaknessPatterns: [
      {
        id: 'weak-1',
        patternType: 'accuracy',
        title: '高频错误',
        description: '有 3 道题错误率较高',
        affectedCount: 3,
        severity: 2,
        suggestedAction: '进入错题复习模式',
      },
    ],
    churnRisk: { level: 'low', isAtRisk: false },
    goalCompletion: { dailyCompleted: 5, dailyTotal: 10, weeklyCompleted: 3, weeklyTotal: 5 },
    flowState: { currentState: 'normal', isFatigued: false, recommendedBreak: false },
    insights: [
      {
        id: 'insight-1',
        section: 'health',
        title: '学习状态优秀',
        description: '继续保持',
        priority: 1,
        generatedAt: Date.now(),
      },
    ],
    lastUpdated: Date.now(),
  })),
}));

vi.mock('@/hooks/useProgressStats', () => ({
  useProgressStats: vi.fn(() => ({
    totalXP: 1000,
    level: 3,
    progressToNextLevel: 50,
    learningDays: 10,
    totalAccuracy: 75,
    totalQuestions: 50,
    modeAccuracy: [
      { mode: 'fill-in-blanks', accuracy: 80, totalQuestions: 50, correctCount: 40 },
      { mode: 'multiple-choice', accuracy: 75, totalQuestions: 30, correctCount: 22 },
      { mode: 'sentence-reorder', accuracy: 70, totalQuestions: 20, correctCount: 14 },
      { mode: 'dictation', accuracy: 60, totalQuestions: 15, correctCount: 9 },
    ],
  })),
  getDailyXP: vi.fn(() => mockDailyXP),
  getFilteredTrend: vi.fn(() => mockFilteredTrend),
  MODE_LABELS: {
    'fill-in-blanks': '填空',
    'multiple-choice': '选择',
    'sentence-reorder': '排序',
    'dictation': '听写',
  },
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode }) => <div {...props}>{children}</div>,
  },
}));

// Import mock after vi.mock
import * as useProgressStatsModule from '@/hooks/useProgressStats';
import * as useLearnInsightsModule from '@/hooks/useLearnInsights';

describe('LearnInsightDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<LearnInsightDashboard />);
      expect(screen.getByTestId('learn-insight-dashboard')).toBeInTheDocument();
    });

    it('should render header with title', () => {
      render(<LearnInsightDashboard />);
      expect(screen.getByText('学习洞察')).toBeInTheDocument();
    });

    it('should render health gauge section', () => {
      render(<LearnInsightDashboard />);
      expect(screen.getByText('学习健康指数')).toBeInTheDocument();
    });

    it('should render ability radar section', () => {
      render(<LearnInsightDashboard />);
      expect(screen.getByText('能力雷达')).toBeInTheDocument();
    });

    it('should render progress trend section', () => {
      render(<LearnInsightDashboard />);
      expect(screen.getByText('学习趋势')).toBeInTheDocument();
    });

    it('should render goal progress section when goals exist', () => {
      render(<LearnInsightDashboard />);
      expect(screen.getByText('目标进度')).toBeInTheDocument();
      expect(screen.getByText('今日目标')).toBeInTheDocument();
      expect(screen.getByText('本周目标')).toBeInTheDocument();
    });

    it('should render weakness patterns section', () => {
      render(<LearnInsightDashboard />);
      expect(screen.getByText('薄弱点分析')).toBeInTheDocument();
      expect(screen.getByText('高频错误')).toBeInTheDocument();
    });

    it('should render quick stats row', () => {
      render(<LearnInsightDashboard />);
      expect(screen.getByText('累计 XP')).toBeInTheDocument();
      expect(screen.getByText('当前等级')).toBeInTheDocument();
      expect(screen.getByText('正确率')).toBeInTheDocument();
      expect(screen.getByText('学习天数')).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    it('should display correct XP value', () => {
      render(<LearnInsightDashboard />);
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });

    it('should display correct level', () => {
      render(<LearnInsightDashboard />);
      expect(screen.getByText('Lv.3')).toBeInTheDocument();
    });

    it('should display correct accuracy', () => {
      render(<LearnInsightDashboard />);
      expect(screen.getAllByText('75%').length).toBeGreaterThan(0);
    });

    it('should display correct learning days', () => {
      render(<LearnInsightDashboard />);
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should display health score value', () => {
      render(<LearnInsightDashboard />);
      expect(screen.getByText('85')).toBeInTheDocument();
    });

    it('should display health level label', () => {
      render(<LearnInsightDashboard />);
      expect(screen.getByText('优秀')).toBeInTheDocument();
    });

    it('should display weakness severity label', () => {
      render(<LearnInsightDashboard />);
      expect(screen.getByText('中度')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no questions answered', () => {
      // Reset the mock to return 0 questions
      (useProgressStatsModule.useProgressStats as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        totalXP: 0,
        level: 1,
        progressToNextLevel: 0,
        learningDays: 0,
        totalAccuracy: 0,
        totalQuestions: 0,
        modeAccuracy: [],
      });

      render(<LearnInsightDashboard />);

      expect(screen.getByText('开始你的学习之旅')).toBeInTheDocument();
    });

    it('should show empty state message', () => {
      (useProgressStatsModule.useProgressStats as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        totalXP: 0,
        level: 1,
        progressToNextLevel: 0,
        learningDays: 0,
        totalAccuracy: 0,
        totalQuestions: 0,
        modeAccuracy: [],
      });

      render(<LearnInsightDashboard />);

      expect(screen.getByText('完成一些练习后，这里将展示你的学习洞察和个性化建议')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should render back button when onBack provided', () => {
      const handleBack = vi.fn();
      render(<LearnInsightDashboard onBack={handleBack} />);

      const buttons = screen.getAllByRole('button');
      // Should have at least one button (back button or navigate button)
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should call onBack when back button clicked', async () => {
      const user = userEvent.setup();
      const handleBack = vi.fn();
      render(<LearnInsightDashboard onBack={handleBack} />);

      // Find and click the back button (first icon button)
      const backButton = screen.getAllByRole('button').find(
        (btn) => btn.querySelector('svg')
      );
      if (backButton) {
        await user.click(backButton);
        expect(handleBack).toHaveBeenCalled();
      }
    });

    it('should render detailed data button when onNavigate provided', () => {
      const handleNavigate = vi.fn();
      render(<LearnInsightDashboard onNavigate={handleNavigate} />);

      expect(screen.getByText('详细数据')).toBeInTheDocument();
    });

    it('should call onNavigate when detailed data button clicked', async () => {
      const user = userEvent.setup();
      const handleNavigate = vi.fn();
      render(<LearnInsightDashboard onNavigate={handleNavigate} />);

      const detailButton = screen.getByText('详细数据');
      await user.click(detailButton);

      expect(handleNavigate).toHaveBeenCalledWith('progress');
    });
  });

  describe('Conditional Rendering', () => {
    it('should not show goal progress when no goals exist', () => {
      (useLearnInsightsModule.useLearnInsights as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        healthScore: { level: 'high', score: 85, color: '#22c55e', icon: 'activity' },
        xpProfile: { totalXP: 1000, currentLevel: 3, progressToNextLevel: 50 },
        streak: { currentStreak: 5, longestStreak: 10, isActive: true },
        accuracy: { total: 75, trend: 'up' },
        weaknessPatterns: [],
        churnRisk: { level: 'low', isAtRisk: false },
        goalCompletion: { dailyCompleted: 0, dailyTotal: 0, weeklyCompleted: 0, weeklyTotal: 0 },
        flowState: { currentState: 'normal', isFatigued: false, recommendedBreak: false },
        insights: [],
        lastUpdated: Date.now(),
      });

      render(<LearnInsightDashboard />);

      expect(screen.queryByText('目标进度')).not.toBeInTheDocument();
    });

    it('should not show weakness section when no weaknesses', () => {
      (useLearnInsightsModule.useLearnInsights as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        healthScore: { level: 'high', score: 85, color: '#22c55e', icon: 'activity' },
        xpProfile: { totalXP: 1000, currentLevel: 3, progressToNextLevel: 50 },
        streak: { currentStreak: 5, longestStreak: 10, isActive: true },
        accuracy: { total: 75, trend: 'up' },
        weaknessPatterns: [],
        churnRisk: { level: 'low', isAtRisk: false },
        goalCompletion: { dailyCompleted: 5, dailyTotal: 10, weeklyCompleted: 3, weeklyTotal: 5 },
        flowState: { currentState: 'normal', isFatigued: false, recommendedBreak: false },
        insights: [],
        lastUpdated: Date.now(),
      });

      render(<LearnInsightDashboard />);

      expect(screen.queryByText('薄弱点分析')).not.toBeInTheDocument();
    });

    it('should limit displayed weakness patterns to 3', () => {
      (useLearnInsightsModule.useLearnInsights as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        healthScore: { level: 'high', score: 85, color: '#22c55e', icon: 'activity' },
        xpProfile: { totalXP: 1000, currentLevel: 3, progressToNextLevel: 50 },
        streak: { currentStreak: 5, longestStreak: 10, isActive: true },
        accuracy: { total: 75, trend: 'up' },
        weaknessPatterns: [
          { id: 'w1', patternType: 'accuracy', title: '弱点1', description: '', affectedCount: 3, severity: 3, suggestedAction: '' },
          { id: 'w2', patternType: 'accuracy', title: '弱点2', description: '', affectedCount: 2, severity: 2, suggestedAction: '' },
          { id: 'w3', patternType: 'accuracy', title: '弱点3', description: '', affectedCount: 1, severity: 1, suggestedAction: '' },
          { id: 'w4', patternType: 'accuracy', title: '弱点4', description: '', affectedCount: 1, severity: 1, suggestedAction: '' },
        ],
        churnRisk: { level: 'low', isAtRisk: false },
        goalCompletion: { dailyCompleted: 5, dailyTotal: 10, weeklyCompleted: 3, weeklyTotal: 5 },
        flowState: { currentState: 'normal', isFatigued: false, recommendedBreak: false },
        insights: [],
        lastUpdated: Date.now(),
      });

      render(<LearnInsightDashboard />);

      expect(screen.getByText('弱点1')).toBeInTheDocument();
      expect(screen.getByText('弱点2')).toBeInTheDocument();
      expect(screen.getByText('弱点3')).toBeInTheDocument();
      expect(screen.getByText('还有 1 个薄弱点')).toBeInTheDocument();
    });
  });

  describe('Responsive Layout', () => {
    it('should have correct container classes for responsive design', () => {
      render(<LearnInsightDashboard />);

      const container = screen.getByTestId('learn-insight-dashboard');
      expect(container).toHaveClass('max-w-2xl', 'mx-auto', 'p-4', 'pb-20', 'md:pb-4');
    });

    it('should have grid layout for quick stats', () => {
      render(<LearnInsightDashboard />);

      const statsContainer = screen.getByText('累计 XP').closest('div');
      expect(statsContainer?.parentElement).toHaveClass('grid', 'grid-cols-2', 'sm:grid-cols-4');
    });

    it('should have two-column layout for charts on larger screens', () => {
      render(<LearnInsightDashboard />);

      // Find the grid container with the charts
      // The charts are in a grid with md:grid-cols-2
      const allDivs = document.querySelectorAll('div');
      let foundGridLayout = false;
      for (const div of allDivs) {
        if (div.classList.contains('md:grid-cols-2') && div.classList.contains('gap-6')) {
          foundGridLayout = true;
          break;
        }
      }
      expect(foundGridLayout).toBe(true);
    });
  });

  describe('Radar-Trend Integration', () => {
    it('shows mode filter indicator when a mode is selected', () => {
      render(<LearnInsightDashboard />);

      // Find radar data points within the ability radar section
      const radarSection = document.querySelector('[data-testid="ability-radar"]');
      const clickableGroups = radarSection?.querySelectorAll('g.cursor-pointer');
      expect(clickableGroups?.length).toBe(4); // 4 modes

      // Click on first mode
      fireEvent.click(clickableGroups![0]);

      // Should show filter indicator with mode label (filter indicator span)
      const filterIndicator = document.querySelector('.bg-blue-100.rounded-full');
      expect(filterIndicator).toBeInTheDocument();
      expect(screen.getByText('填空', { selector: '.bg-blue-100' })).toBeInTheDocument();
    });

    it('removes filter indicator when same mode is clicked again', () => {
      render(<LearnInsightDashboard />);

      const radarSection = document.querySelector('[data-testid="ability-radar"]');
      const clickableGroups = radarSection?.querySelectorAll('g.cursor-pointer');

      // Click on first mode - selects it
      fireEvent.click(clickableGroups![0]);

      // Filter indicator should exist
      expect(document.querySelector('.bg-blue-100.rounded-full')).toBeInTheDocument();

      // Click same mode again - deselects
      fireEvent.click(clickableGroups![0]);

      // Filter indicator should be gone
      expect(document.querySelector('.bg-blue-100.rounded-full')).not.toBeInTheDocument();
    });

    it('switches filter when clicking different mode', () => {
      render(<LearnInsightDashboard />);

      const radarSection = document.querySelector('[data-testid="ability-radar"]');
      const clickableGroups = radarSection?.querySelectorAll('g.cursor-pointer');

      // Click first mode
      fireEvent.click(clickableGroups![0]);
      expect(document.querySelector('.bg-blue-100.rounded-full')).toBeInTheDocument();

      // Click second mode
      fireEvent.click(clickableGroups![1]);
      // Should now show 选择 in the filter indicator
      expect(screen.getByText('选择', { selector: '.bg-blue-100' })).toBeInTheDocument();
      // 填空 should only be in the radar label now
      expect(screen.queryByText('填空', { selector: '.bg-blue-100' })).not.toBeInTheDocument();
    });

    it('has clear filter button in filter indicator', () => {
      render(<LearnInsightDashboard />);

      const radarSection = document.querySelector('[data-testid="ability-radar"]');
      const clickableGroups = radarSection?.querySelectorAll('g.cursor-pointer');
      fireEvent.click(clickableGroups![0]);

      // Should show clear button (×)
      const clearButton = screen.getByRole('button', { name: '清除筛选' });
      expect(clearButton).toBeInTheDocument();

      // Click clear button
      fireEvent.click(clearButton);

      // Filter indicator should be gone
      expect(document.querySelector('.bg-blue-100.rounded-full')).not.toBeInTheDocument();
    });

    it('renders with filter indicator showing correct mode label', () => {
      render(<LearnInsightDashboard />);

      const radarSection = document.querySelector('[data-testid="ability-radar"]');
      const clickableGroups = radarSection?.querySelectorAll('g.cursor-pointer');

      // Click different modes and check labels
      fireEvent.click(clickableGroups![1]); // multiple-choice -> 选择
      expect(screen.getByText('选择', { selector: '.bg-blue-100' })).toBeInTheDocument();

      fireEvent.click(clickableGroups![2]); // sentence-reorder -> 排序
      expect(screen.getByText('排序', { selector: '.bg-blue-100' })).toBeInTheDocument();
      expect(screen.queryByText('选择', { selector: '.bg-blue-100' })).not.toBeInTheDocument();

      fireEvent.click(clickableGroups![3]); // dictation -> 听写
      expect(screen.getByText('听写', { selector: '.bg-blue-100' })).toBeInTheDocument();
      expect(screen.queryByText('排序', { selector: '.bg-blue-100' })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<LearnInsightDashboard />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('学习洞察');
    });

    it('should have buttons with accessible roles', () => {
      render(<LearnInsightDashboard />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});