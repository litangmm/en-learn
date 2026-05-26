import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LearnInsightPanel } from '../LearnInsightPanel';
import * as useLearnInsightsModule from '@/hooks/useLearnInsights';
import * as useProgressStatsModule from '@/hooks/useProgressStats';

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
    modeAccuracy: [
      { mode: 'fill-in-blanks', accuracy: 80, totalQuestions: 50, correctCount: 40 },
      { mode: 'multiple-choice', accuracy: 75, totalQuestions: 30, correctCount: 22 },
      { mode: 'sentence-reorder', accuracy: 70, totalQuestions: 20, correctCount: 14 },
      { mode: 'dictation', accuracy: 60, totalQuestions: 15, correctCount: 9 },
    ],
  })),
}));

describe('LearnInsightPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<LearnInsightPanel />);

    expect(screen.getByTestId('learn-insight-panel')).toBeInTheDocument();
  });

  it('should render header with title', () => {
    render(<LearnInsightPanel />);

    expect(screen.getByText('学习洞察')).toBeInTheDocument();
  });

  it('should render health gauge', () => {
    render(<LearnInsightPanel />);

    expect(screen.getByTestId('health-gauge')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('should render health level label', () => {
    render(<LearnInsightPanel />);

    expect(screen.getByText('优秀')).toBeInTheDocument();
  });

  it('should render XP stats', () => {
    render(<LearnInsightPanel />);

    expect(screen.getByText('1,000')).toBeInTheDocument();
  });

  it('should render level info', () => {
    render(<LearnInsightPanel />);

    expect(screen.getByText('Lv.3')).toBeInTheDocument();
  });

  it('should render accuracy', () => {
    render(<LearnInsightPanel />);

    expect(screen.getAllByText('75%').length).toBeGreaterThan(0);
  });

  it('should render learning days', () => {
    render(<LearnInsightPanel />);

    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should render goal progress section', () => {
    render(<LearnInsightPanel />);

    expect(screen.getByText('目标进度')).toBeInTheDocument();
    expect(screen.getByText('今日目标')).toBeInTheDocument();
    expect(screen.getByText('本周目标')).toBeInTheDocument();
  });

  it('should render ability radar section', () => {
    render(<LearnInsightPanel />);

    expect(screen.getByText('能力雷达')).toBeInTheDocument();
  });

  it('should render weakness patterns', () => {
    render(<LearnInsightPanel />);

    expect(screen.getByText('薄弱点分析')).toBeInTheDocument();
    expect(screen.getByText('高频错误')).toBeInTheDocument();
  });

  it('should render insights section', () => {
    render(<LearnInsightPanel />);

    expect(screen.getByText('个性化建议')).toBeInTheDocument();
    expect(screen.getByText('学习状态优秀')).toBeInTheDocument();
  });

  it('should render back button when onBack provided', () => {
    const handleBack = vi.fn();
    render(<LearnInsightPanel onBack={handleBack} />);

    // Component renders a back button (icon button)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should call onBack when back button clicked', async () => {
    const user = userEvent.setup();
    const handleBack = vi.fn();
    render(<LearnInsightPanel onBack={handleBack} />);

    // Click the first button (back button)
    const buttons = screen.getAllByRole('button');
    if (buttons.length > 0) {
      await user.click(buttons[0]);
      expect(handleBack).toHaveBeenCalled();
    }
  });

  it('should render detailed data button when onNavigate provided', () => {
    const handleNavigate = vi.fn();
    render(<LearnInsightPanel onNavigate={handleNavigate} />);

    expect(screen.getByText('详细数据')).toBeInTheDocument();
  });

  it('should call onNavigate when detailed data button clicked', async () => {
    const user = userEvent.setup();
    const handleNavigate = vi.fn();
    render(<LearnInsightPanel onNavigate={handleNavigate} />);

    const detailButton = screen.getByText('详细数据');
    await user.click(detailButton);

    expect(handleNavigate).toHaveBeenCalledWith('progress');
  });

  it('should render quick stats cards', () => {
    render(<LearnInsightPanel />);

    expect(screen.getByText('累计 XP')).toBeInTheDocument();
    expect(screen.getByText('当前等级')).toBeInTheDocument();
    expect(screen.getByText('正确率')).toBeInTheDocument();
    expect(screen.getByText('学习天数')).toBeInTheDocument();
  });

  it('should show empty state when no questions answered', () => {
    (useProgressStatsModule.useProgressStats as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      totalXP: 0,
      level: 1,
      progressToNextLevel: 0,
      learningDays: 0,
      totalAccuracy: 0,
      totalQuestions: 0,
      totalCorrect: 0,
      completedDictionaries: 0,
      modeAccuracy: [],
    });

    render(<LearnInsightPanel />);

    expect(screen.getByText('开始你的学习之旅')).toBeInTheDocument();
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

    render(<LearnInsightPanel />);

    expect(screen.queryByText('薄弱点分析')).not.toBeInTheDocument();
  });

  it('should not show insights section when no insights', () => {
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

    render(<LearnInsightPanel />);

    expect(screen.queryByText('个性化建议')).not.toBeInTheDocument();
  });

  it('should show churn risk alert when at risk', () => {
    (useLearnInsightsModule.useLearnInsights as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      healthScore: { level: 'high', score: 85, color: '#22c55e', icon: 'activity' },
      xpProfile: { totalXP: 1000, currentLevel: 3, progressToNextLevel: 50 },
      streak: { currentStreak: 5, longestStreak: 10, isActive: true },
      accuracy: { total: 75, trend: 'up' },
      weaknessPatterns: [],
      churnRisk: { level: 'high', isAtRisk: true },
      goalCompletion: { dailyCompleted: 5, dailyTotal: 10, weeklyCompleted: 3, weeklyTotal: 5 },
      flowState: { currentState: 'normal', isFatigued: false, recommendedBreak: false },
      insights: [],
      lastUpdated: Date.now(),
    });

    render(<LearnInsightPanel />);

    expect(screen.getByText('流失风险提醒')).toBeInTheDocument();
  });

  it('should show flow state alert when break recommended', () => {
    (useLearnInsightsModule.useLearnInsights as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      healthScore: { level: 'high', score: 85, color: '#22c55e', icon: 'activity' },
      xpProfile: { totalXP: 1000, currentLevel: 3, progressToNextLevel: 50 },
      streak: { currentStreak: 5, longestStreak: 10, isActive: true },
      accuracy: { total: 75, trend: 'up' },
      weaknessPatterns: [],
      churnRisk: { level: 'low', isAtRisk: false },
      goalCompletion: { dailyCompleted: 5, dailyTotal: 10, weeklyCompleted: 3, weeklyTotal: 5 },
      flowState: { currentState: 'fatigued', isFatigued: true, recommendedBreak: true },
      insights: [],
      lastUpdated: Date.now(),
    });

    render(<LearnInsightPanel />);

    expect(screen.getByText('建议休息一下')).toBeInTheDocument();
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

    render(<LearnInsightPanel />);

    expect(screen.getByText('弱点1')).toBeInTheDocument();
    expect(screen.getByText('弱点2')).toBeInTheDocument();
    expect(screen.getByText('弱点3')).toBeInTheDocument();
    expect(screen.getByText('还有 1 个薄弱点')).toBeInTheDocument();
  });

  it('should limit displayed insights to 4', () => {
    (useLearnInsightsModule.useLearnInsights as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      healthScore: { level: 'high', score: 85, color: '#22c55e', icon: 'activity' },
      xpProfile: { totalXP: 1000, currentLevel: 3, progressToNextLevel: 50 },
      streak: { currentStreak: 5, longestStreak: 10, isActive: true },
      accuracy: { total: 75, trend: 'up' },
      weaknessPatterns: [],
      churnRisk: { level: 'low', isAtRisk: false },
      goalCompletion: { dailyCompleted: 5, dailyTotal: 10, weeklyCompleted: 3, weeklyTotal: 5 },
      flowState: { currentState: 'normal', isFatigued: false, recommendedBreak: false },
      insights: [
        { id: 'i1', section: 'health', title: '建议1', description: '', priority: 1, generatedAt: Date.now() },
        { id: 'i2', section: 'health', title: '建议2', description: '', priority: 2, generatedAt: Date.now() },
        { id: 'i3', section: 'health', title: '建议3', description: '', priority: 3, generatedAt: Date.now() },
        { id: 'i4', section: 'health', title: '建议4', description: '', priority: 4, generatedAt: Date.now() },
        { id: 'i5', section: 'health', title: '建议5', description: '', priority: 5, generatedAt: Date.now() },
      ],
      lastUpdated: Date.now(),
    });

    render(<LearnInsightPanel />);

    expect(screen.getByText('建议1')).toBeInTheDocument();
    expect(screen.getByText('建议4')).toBeInTheDocument();
    expect(screen.queryByText('建议5')).not.toBeInTheDocument();
  });

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

    render(<LearnInsightPanel />);

    expect(screen.queryByText('目标进度')).not.toBeInTheDocument();
  });
});
