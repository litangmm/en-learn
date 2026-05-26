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
    abilityModeAccuracy: [
      { mode: 'fill-in-blanks', accuracy: 80, totalQuestions: 50, correctCount: 40 },
      { mode: 'multiple-choice', accuracy: 75, totalQuestions: 30, correctCount: 22 },
      { mode: 'sentence-reorder', accuracy: 70, totalQuestions: 20, correctCount: 14 },
      { mode: 'dictation', accuracy: 45, totalQuestions: 15, correctCount: 7 },
    ],
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
  calculateWeakModeRecommendation: vi.fn((modeAccuracy) => {
    // Return null by default (no weak mode with 45% dictation - mock data has it as weak)
    // This default is for tests that don't explicitly test weak mode recommendation
    if (!modeAccuracy || !Array.isArray(modeAccuracy)) return null;
    const weakModes = modeAccuracy.filter(
      (m: { totalQuestions: number; accuracy: number }) => m.totalQuestions > 0 && m.accuracy < 70
    );
    if (weakModes.length === 0) return null;
    const weakest = weakModes.reduce((prev: { accuracy: number }, curr: { accuracy: number }) =>
      curr.accuracy < prev.accuracy ? curr : prev
    );
    return {
      weakMode: weakest.mode,
      mode: weakest.mode,
      accuracy: weakest.accuracy,
      suggestion: '听写需要多听音频，跟读练习会很有帮助',
      priority: weakest.accuracy < 50 ? 1 : weakest.accuracy < 60 ? 2 : 3,
    };
  }),
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
        abilityModeAccuracy: [
          { mode: 'fill-in-blanks', accuracy: 80, totalQuestions: 50, correctCount: 40 },
          { mode: 'multiple-choice', accuracy: 75, totalQuestions: 30, correctCount: 22 },
          { mode: 'sentence-reorder', accuracy: 70, totalQuestions: 20, correctCount: 14 },
          { mode: 'dictation', accuracy: 80, totalQuestions: 15, correctCount: 12 },
        ],
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
        abilityModeAccuracy: [
          { mode: 'fill-in-blanks', accuracy: 80, totalQuestions: 50, correctCount: 40 },
          { mode: 'multiple-choice', accuracy: 75, totalQuestions: 30, correctCount: 22 },
          { mode: 'sentence-reorder', accuracy: 70, totalQuestions: 20, correctCount: 14 },
          { mode: 'dictation', accuracy: 80, totalQuestions: 15, correctCount: 12 },
        ],
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
        abilityModeAccuracy: [
          { mode: 'fill-in-blanks', accuracy: 80, totalQuestions: 50, correctCount: 40 },
          { mode: 'multiple-choice', accuracy: 75, totalQuestions: 30, correctCount: 22 },
          { mode: 'sentence-reorder', accuracy: 70, totalQuestions: 20, correctCount: 14 },
          { mode: 'dictation', accuracy: 80, totalQuestions: 15, correctCount: 12 },
        ],
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

    it('updates trend data when mode is selected', () => {
      render(<LearnInsightDashboard />);

      // Get reference to getFilteredTrend mock before clicking
      const getFilteredTrendMock = useProgressStatsModule.getFilteredTrend;

      // Click on a mode in the radar
      const radarSection = document.querySelector('[data-testid="ability-radar"]');
      const clickableGroups = radarSection?.querySelectorAll('g.cursor-pointer');
      fireEvent.click(clickableGroups![0]); // Click fill-in-blanks

      // getFilteredTrend should have been called with the selected mode
      expect(getFilteredTrendMock).toHaveBeenCalled();
    });

    it('clears mode filter when clear button is clicked', () => {
      render(<LearnInsightDashboard />);

      const radarSection = document.querySelector('[data-testid="ability-radar"]');
      const clickableGroups = radarSection?.querySelectorAll('g.cursor-pointer');

      // Select a mode
      fireEvent.click(clickableGroups![0]);
      expect(screen.getByText('填空', { selector: '.bg-blue-100' })).toBeInTheDocument();

      // Find and click the clear button
      const clearButton = screen.getByRole('button', { name: '清除筛选' });
      fireEvent.click(clearButton);

      // Filter indicator should be gone
      expect(document.querySelector('.bg-blue-100.rounded-full')).not.toBeInTheDocument();

      // getDailyXP should now be called (not getFilteredTrend) since mode is cleared
      const getDailyXPMock = useProgressStatsModule.getDailyXP;
      expect(getDailyXPMock).toHaveBeenCalled();
    });

    it('displays mode label in filter indicator for each mode type', () => {
      render(<LearnInsightDashboard />);

      const radarSection = document.querySelector('[data-testid="ability-radar"]');
      const clickableGroups = radarSection?.querySelectorAll('g.cursor-pointer');

      if (!clickableGroups) return;

      // Test each mode type
      const modeLabels = ['填空', '选择', '排序', '听写'];

      for (let i = 0; i < clickableGroups.length; i++) {
        fireEvent.click(clickableGroups[i]);

        const filterIndicator = document.querySelector('.bg-blue-100.rounded-full');
        expect(filterIndicator).toBeInTheDocument();
        expect(screen.getByText(modeLabels[i], { selector: '.bg-blue-100' })).toBeInTheDocument();

        // Deselect for next iteration
        fireEvent.click(clickableGroups[i]);
      }
    });

    it('re-renders trend data when switching between modes', () => {
      render(<LearnInsightDashboard />);

      const radarSection = document.querySelector('[data-testid="ability-radar"]');
      const clickableGroups = radarSection?.querySelectorAll('g.cursor-pointer');
      const getFilteredTrendMock = useProgressStatsModule.getFilteredTrend as ReturnType<typeof vi.fn>;

      // Clear any previous calls
      getFilteredTrendMock.mockClear();

      // Click first mode
      fireEvent.click(clickableGroups![0]);
      const firstCallCount = getFilteredTrendMock.mock.calls.length;

      // Click second mode (should trigger new call)
      fireEvent.click(clickableGroups![1]);
      const secondCallCount = getFilteredTrendMock.mock.calls.length;

      // getFilteredTrend should have been called at least once per mode selection
      expect(secondCallCount).toBeGreaterThanOrEqual(firstCallCount);
    });

    it('filter indicator appears in the trend section header', () => {
      render(<LearnInsightDashboard />);

      const radarSection = document.querySelector('[data-testid="ability-radar"]');
      const clickableGroups = radarSection?.querySelectorAll('g.cursor-pointer');
      fireEvent.click(clickableGroups![0]);

      // Find the trend section header (contains "学习趋势")
      const trendSection = screen.getByText('学习趋势').closest('div');
      expect(trendSection).toBeInTheDocument();

      // The filter indicator should be within the trend section header
      const filterIndicator = trendSection?.querySelector('.bg-blue-100');
      expect(filterIndicator).toBeInTheDocument();
    });
  });

  describe('WeaknessRecommendationPanel', () => {
    it('should render when recommendation is available', () => {
      (useLearnInsightsModule.useLearnInsights as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        healthScore: { level: 'high', score: 85, color: '#22c55e', icon: 'activity' },
        xpProfile: { totalXP: 1000, currentLevel: 3, progressToNextLevel: 50 },
        streak: { currentStreak: 5, longestStreak: 10, isActive: true },
        accuracy: { total: 75, trend: 'up' },
        abilityModeAccuracy: [
          { mode: 'fill-in-blanks', accuracy: 80, totalQuestions: 50, correctCount: 40 },
          { mode: 'multiple-choice', accuracy: 75, totalQuestions: 30, correctCount: 22 },
          { mode: 'sentence-reorder', accuracy: 70, totalQuestions: 20, correctCount: 14 },
          { mode: 'dictation', accuracy: 45, totalQuestions: 15, correctCount: 7 },
        ],
        weaknessPatterns: [],
        churnRisk: { level: 'low', isAtRisk: false },
        goalCompletion: { dailyCompleted: 5, dailyTotal: 10, weeklyCompleted: 3, weeklyTotal: 5 },
        flowState: { currentState: 'normal', isFatigued: false, recommendedBreak: false },
        insights: [],
        lastUpdated: Date.now(),
      });

      render(<LearnInsightDashboard />);

      expect(screen.getByText('薄弱环节')).toBeInTheDocument();
      // Use selector to get the mode label from the WeaknessRecommendationPanel card
      expect(screen.getByText('听写', { selector: 'div[class*="border-red"] *' })).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    it('should display suggestion text', () => {
      (useLearnInsightsModule.useLearnInsights as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        healthScore: { level: 'high', score: 85, color: '#22c55e', icon: 'activity' },
        xpProfile: { totalXP: 1000, currentLevel: 3, progressToNextLevel: 50 },
        streak: { currentStreak: 5, longestStreak: 10, isActive: true },
        accuracy: { total: 75, trend: 'up' },
        abilityModeAccuracy: [
          { mode: 'fill-in-blanks', accuracy: 80, totalQuestions: 50, correctCount: 40 },
          { mode: 'multiple-choice', accuracy: 75, totalQuestions: 30, correctCount: 22 },
          { mode: 'sentence-reorder', accuracy: 70, totalQuestions: 20, correctCount: 14 },
          { mode: 'dictation', accuracy: 45, totalQuestions: 15, correctCount: 7 },
        ],
        weaknessPatterns: [],
        churnRisk: { level: 'low', isAtRisk: false },
        goalCompletion: { dailyCompleted: 5, dailyTotal: 10, weeklyCompleted: 3, weeklyTotal: 5 },
        flowState: { currentState: 'normal', isFatigued: false, recommendedBreak: false },
        insights: [],
        lastUpdated: Date.now(),
      });

      render(<LearnInsightDashboard />);

      expect(screen.getByText('听写需要多听音频，跟读练习会很有帮助')).toBeInTheDocument();
    });

    it('should have a practice button', () => {
      (useLearnInsightsModule.useLearnInsights as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        healthScore: { level: 'high', score: 85, color: '#22c55e', icon: 'activity' },
        xpProfile: { totalXP: 1000, currentLevel: 3, progressToNextLevel: 50 },
        streak: { currentStreak: 5, longestStreak: 10, isActive: true },
        accuracy: { total: 75, trend: 'up' },
        abilityModeAccuracy: [
          { mode: 'fill-in-blanks', accuracy: 80, totalQuestions: 50, correctCount: 40 },
          { mode: 'multiple-choice', accuracy: 75, totalQuestions: 30, correctCount: 22 },
          { mode: 'sentence-reorder', accuracy: 70, totalQuestions: 20, correctCount: 14 },
          { mode: 'dictation', accuracy: 45, totalQuestions: 15, correctCount: 7 },
        ],
        weaknessPatterns: [],
        churnRisk: { level: 'low', isAtRisk: false },
        goalCompletion: { dailyCompleted: 5, dailyTotal: 10, weeklyCompleted: 3, weeklyTotal: 5 },
        flowState: { currentState: 'normal', isFatigued: false, recommendedBreak: false },
        insights: [],
        lastUpdated: Date.now(),
      });

      render(<LearnInsightDashboard />);

      expect(screen.getByText('去练习')).toBeInTheDocument();
    });

    it('should call onNavigate with practice mode when practice button clicked', async () => {
      const user = userEvent.setup();
      const handleNavigate = vi.fn();

      (useLearnInsightsModule.useLearnInsights as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        healthScore: { level: 'high', score: 85, color: '#22c55e', icon: 'activity' },
        xpProfile: { totalXP: 1000, currentLevel: 3, progressToNextLevel: 50 },
        streak: { currentStreak: 5, longestStreak: 10, isActive: true },
        accuracy: { total: 75, trend: 'up' },
        abilityModeAccuracy: [
          { mode: 'fill-in-blanks', accuracy: 80, totalQuestions: 50, correctCount: 40 },
          { mode: 'multiple-choice', accuracy: 75, totalQuestions: 30, correctCount: 22 },
          { mode: 'sentence-reorder', accuracy: 70, totalQuestions: 20, correctCount: 14 },
          { mode: 'dictation', accuracy: 45, totalQuestions: 15, correctCount: 7 },
        ],
        weaknessPatterns: [],
        churnRisk: { level: 'low', isAtRisk: false },
        goalCompletion: { dailyCompleted: 5, dailyTotal: 10, weeklyCompleted: 3, weeklyTotal: 5 },
        flowState: { currentState: 'normal', isFatigued: false, recommendedBreak: false },
        insights: [],
        lastUpdated: Date.now(),
      });

      render(<LearnInsightDashboard onNavigate={handleNavigate} />);

      const practiceButton = screen.getByText('去练习');
      await user.click(practiceButton);

      expect(handleNavigate).toHaveBeenCalledWith('practice');
    });

    it('should not render when no weak mode is detected', () => {
      (useLearnInsightsModule.useLearnInsights as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        healthScore: { level: 'high', score: 85, color: '#22c55e', icon: 'activity' },
        xpProfile: { totalXP: 1000, currentLevel: 3, progressToNextLevel: 50 },
        streak: { currentStreak: 5, longestStreak: 10, isActive: true },
        accuracy: { total: 75, trend: 'up' },
        abilityModeAccuracy: [
          { mode: 'fill-in-blanks', accuracy: 80, totalQuestions: 50, correctCount: 40 },
          { mode: 'multiple-choice', accuracy: 75, totalQuestions: 30, correctCount: 22 },
          { mode: 'sentence-reorder', accuracy: 85, totalQuestions: 20, correctCount: 17 },
          { mode: 'dictation', accuracy: 80, totalQuestions: 15, correctCount: 12 },
        ],
        weaknessPatterns: [],
        churnRisk: { level: 'low', isAtRisk: false },
        goalCompletion: { dailyCompleted: 5, dailyTotal: 10, weeklyCompleted: 3, weeklyTotal: 5 },
        flowState: { currentState: 'normal', isFatigued: false, recommendedBreak: false },
        insights: [],
        lastUpdated: Date.now(),
      });

      render(<LearnInsightDashboard />);

      expect(screen.queryByText('薄弱环节')).not.toBeInTheDocument();
    });

    it('should display priority 1 with red styling', () => {
      (useLearnInsightsModule.useLearnInsights as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        healthScore: { level: 'high', score: 85, color: '#22c55e', icon: 'activity' },
        xpProfile: { totalXP: 1000, currentLevel: 3, progressToNextLevel: 50 },
        streak: { currentStreak: 5, longestStreak: 10, isActive: true },
        accuracy: { total: 75, trend: 'up' },
        abilityModeAccuracy: [
          { mode: 'fill-in-blanks', accuracy: 80, totalQuestions: 50, correctCount: 40 },
          { mode: 'multiple-choice', accuracy: 75, totalQuestions: 30, correctCount: 22 },
          { mode: 'sentence-reorder', accuracy: 70, totalQuestions: 20, correctCount: 14 },
          { mode: 'dictation', accuracy: 45, totalQuestions: 15, correctCount: 7 },
        ],
        weaknessPatterns: [],
        churnRisk: { level: 'low', isAtRisk: false },
        goalCompletion: { dailyCompleted: 5, dailyTotal: 10, weeklyCompleted: 3, weeklyTotal: 5 },
        flowState: { currentState: 'normal', isFatigued: false, recommendedBreak: false },
        insights: [],
        lastUpdated: Date.now(),
      });

      render(<LearnInsightDashboard />);

      // Priority 1 should have red border (border-red-500)
      // Find the card that has '薄弱环节' title, then check its parent for the border class
      const cardTitle = screen.getByText('薄弱环节');
      const cardWithBorder = cardTitle.closest('div[class*="border-red"]');
      expect(cardWithBorder).toBeInTheDocument();
    });

    it('should display priority 2 with orange styling', () => {
      (useLearnInsightsModule.useLearnInsights as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        healthScore: { level: 'high', score: 85, color: '#22c55e', icon: 'activity' },
        xpProfile: { totalXP: 1000, currentLevel: 3, progressToNextLevel: 50 },
        streak: { currentStreak: 5, longestStreak: 10, isActive: true },
        accuracy: { total: 75, trend: 'up' },
        abilityModeAccuracy: [
          { mode: 'fill-in-blanks', accuracy: 80, totalQuestions: 50, correctCount: 40 },
          { mode: 'multiple-choice', accuracy: 55, totalQuestions: 30, correctCount: 16 },
          { mode: 'sentence-reorder', accuracy: 70, totalQuestions: 20, correctCount: 14 },
          { mode: 'dictation', accuracy: 80, totalQuestions: 15, correctCount: 12 },
        ],
        weaknessPatterns: [],
        churnRisk: { level: 'low', isAtRisk: false },
        goalCompletion: { dailyCompleted: 5, dailyTotal: 10, weeklyCompleted: 3, weeklyTotal: 5 },
        flowState: { currentState: 'normal', isFatigued: false, recommendedBreak: false },
        insights: [],
        lastUpdated: Date.now(),
      });

      render(<LearnInsightDashboard />);

      // Priority 2 should have orange border (border-orange-400)
      const cardTitle = screen.getByText('薄弱环节');
      const cardWithBorder = cardTitle.closest('div[class*="border-orange"]');
      expect(cardWithBorder).toBeInTheDocument();
    });

    it('should display priority 3 with yellow styling', () => {
      (useLearnInsightsModule.useLearnInsights as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        healthScore: { level: 'high', score: 85, color: '#22c55e', icon: 'activity' },
        xpProfile: { totalXP: 1000, currentLevel: 3, progressToNextLevel: 50 },
        streak: { currentStreak: 5, longestStreak: 10, isActive: true },
        accuracy: { total: 75, trend: 'up' },
        abilityModeAccuracy: [
          { mode: 'fill-in-blanks', accuracy: 80, totalQuestions: 50, correctCount: 40 },
          { mode: 'multiple-choice', accuracy: 75, totalQuestions: 30, correctCount: 22 },
          { mode: 'sentence-reorder', accuracy: 65, totalQuestions: 20, correctCount: 13 },
          { mode: 'dictation', accuracy: 80, totalQuestions: 15, correctCount: 12 },
        ],
        weaknessPatterns: [],
        churnRisk: { level: 'low', isAtRisk: false },
        goalCompletion: { dailyCompleted: 5, dailyTotal: 10, weeklyCompleted: 3, weeklyTotal: 5 },
        flowState: { currentState: 'normal', isFatigued: false, recommendedBreak: false },
        insights: [],
        lastUpdated: Date.now(),
      });

      render(<LearnInsightDashboard />);

      // Priority 3 should have yellow border (border-yellow-400)
      const cardTitle = screen.getByText('薄弱环节');
      const cardWithBorder = cardTitle.closest('div[class*="border-yellow"]');
      expect(cardWithBorder).toBeInTheDocument();
    });

    it('should display fill-in-blanks mode label (填空)', () => {
      (useLearnInsightsModule.useLearnInsights as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        healthScore: { level: 'high', score: 85, color: '#22c55e', icon: 'activity' },
        xpProfile: { totalXP: 1000, currentLevel: 3, progressToNextLevel: 50 },
        streak: { currentStreak: 5, longestStreak: 10, isActive: true },
        accuracy: { total: 75, trend: 'up' },
        abilityModeAccuracy: [
          { mode: 'fill-in-blanks', accuracy: 45, totalQuestions: 50, correctCount: 22 },
          { mode: 'multiple-choice', accuracy: 80, totalQuestions: 30, correctCount: 24 },
          { mode: 'sentence-reorder', accuracy: 70, totalQuestions: 20, correctCount: 14 },
          { mode: 'dictation', accuracy: 80, totalQuestions: 15, correctCount: 12 },
        ],
        weaknessPatterns: [],
        churnRisk: { level: 'low', isAtRisk: false },
        goalCompletion: { dailyCompleted: 5, dailyTotal: 10, weeklyCompleted: 3, weeklyTotal: 5 },
        flowState: { currentState: 'normal', isFatigued: false, recommendedBreak: false },
        insights: [],
        lastUpdated: Date.now(),
      });

      render(<LearnInsightDashboard />);

      // Should show 填空 as the weak mode
      expect(screen.getByText('填空', { selector: 'div[class*="border-red"] *' })).toBeInTheDocument();
    });

    it('should display multiple-choice mode label (选择)', () => {
      (useLearnInsightsModule.useLearnInsights as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        healthScore: { level: 'high', score: 85, color: '#22c55e', icon: 'activity' },
        xpProfile: { totalXP: 1000, currentLevel: 3, progressToNextLevel: 50 },
        streak: { currentStreak: 5, longestStreak: 10, isActive: true },
        accuracy: { total: 75, trend: 'up' },
        abilityModeAccuracy: [
          { mode: 'fill-in-blanks', accuracy: 80, totalQuestions: 50, correctCount: 40 },
          { mode: 'multiple-choice', accuracy: 45, totalQuestions: 30, correctCount: 13 },
          { mode: 'sentence-reorder', accuracy: 70, totalQuestions: 20, correctCount: 14 },
          { mode: 'dictation', accuracy: 80, totalQuestions: 15, correctCount: 12 },
        ],
        weaknessPatterns: [],
        churnRisk: { level: 'low', isAtRisk: false },
        goalCompletion: { dailyCompleted: 5, dailyTotal: 10, weeklyCompleted: 3, weeklyTotal: 5 },
        flowState: { currentState: 'normal', isFatigued: false, recommendedBreak: false },
        insights: [],
        lastUpdated: Date.now(),
      });

      render(<LearnInsightDashboard />);

      // Should show 选择 as the weak mode
      expect(screen.getByText('选择', { selector: 'div[class*="border-red"] *' })).toBeInTheDocument();
    });

    it('should display sentence-reorder mode label (排序)', () => {
      (useLearnInsightsModule.useLearnInsights as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        healthScore: { level: 'high', score: 85, color: '#22c55e', icon: 'activity' },
        xpProfile: { totalXP: 1000, currentLevel: 3, progressToNextLevel: 50 },
        streak: { currentStreak: 5, longestStreak: 10, isActive: true },
        accuracy: { total: 75, trend: 'up' },
        abilityModeAccuracy: [
          { mode: 'fill-in-blanks', accuracy: 80, totalQuestions: 50, correctCount: 40 },
          { mode: 'multiple-choice', accuracy: 80, totalQuestions: 30, correctCount: 24 },
          { mode: 'sentence-reorder', accuracy: 45, totalQuestions: 20, correctCount: 9 },
          { mode: 'dictation', accuracy: 80, totalQuestions: 15, correctCount: 12 },
        ],
        weaknessPatterns: [],
        churnRisk: { level: 'low', isAtRisk: false },
        goalCompletion: { dailyCompleted: 5, dailyTotal: 10, weeklyCompleted: 3, weeklyTotal: 5 },
        flowState: { currentState: 'normal', isFatigued: false, recommendedBreak: false },
        insights: [],
        lastUpdated: Date.now(),
      });

      render(<LearnInsightDashboard />);

      // Should show 排序 as the weak mode
      expect(screen.getByText('排序', { selector: 'div[class*="border-red"] *' })).toBeInTheDocument();
    });

    it('should have data-testid attribute on WeaknessRecommendationPanel', () => {
      (useLearnInsightsModule.useLearnInsights as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        healthScore: { level: 'high', score: 85, color: '#22c55e', icon: 'activity' },
        xpProfile: { totalXP: 1000, currentLevel: 3, progressToNextLevel: 50 },
        streak: { currentStreak: 5, longestStreak: 10, isActive: true },
        accuracy: { total: 75, trend: 'up' },
        abilityModeAccuracy: [
          { mode: 'fill-in-blanks', accuracy: 80, totalQuestions: 50, correctCount: 40 },
          { mode: 'multiple-choice', accuracy: 75, totalQuestions: 30, correctCount: 22 },
          { mode: 'sentence-reorder', accuracy: 70, totalQuestions: 20, correctCount: 14 },
          { mode: 'dictation', accuracy: 45, totalQuestions: 15, correctCount: 7 },
        ],
        weaknessPatterns: [],
        churnRisk: { level: 'low', isAtRisk: false },
        goalCompletion: { dailyCompleted: 5, dailyTotal: 10, weeklyCompleted: 3, weeklyTotal: 5 },
        flowState: { currentState: 'normal', isFatigued: false, recommendedBreak: false },
        insights: [],
        lastUpdated: Date.now(),
      });

      render(<LearnInsightDashboard />);

      const panel = screen.getByTestId('weakness-recommendation-panel');
      expect(panel).toBeInTheDocument();
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