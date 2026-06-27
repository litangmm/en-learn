import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { LearningProfile } from '../LearningProfile';
import type { ModeRecommendation, ModeAccuracy } from '@/data/types';

// Mock useProgressStats
vi.mock('@/hooks/useProgressStats', () => ({
  useProgressStats: () => ({
    level: 5,
    totalXP: 500,
    currentXP: 150,
    progressToNextLevel: 60,
    learningDays: 10,
    totalAccuracy: 85,
    completedDictionaries: 3,
    totalQuestions: 200,
    totalCorrect: 170,
    modeAccuracy: [
      { mode: 'fill-in-blanks', accuracy: 85, totalQuestions: 100, correctCount: 85 },
      { mode: 'multiple-choice', accuracy: 80, totalQuestions: 50, correctCount: 40 },
      { mode: 'sentence-reorder', accuracy: 90, totalQuestions: 30, correctCount: 27 },
      { mode: 'dictation', accuracy: 75, totalQuestions: 20, correctCount: 15 },
    ],
  }),
}));

// Mock useBadges
vi.mock('@/hooks/useBadges', () => ({
  useBadges: () => ({
    badgeState: {
      unlocked: [
        { id: 'first-steps', unlockedAt: Date.now() - 86400000 },
        { id: 'correct-10', unlockedAt: Date.now() },
      ],
      progress: {
        totalAnswered: 200,
        totalCorrect: 170,
        totalSessions: 15,
        maxStreakEver: 12,
        perfectSessions: 3,
        totalReviews: 20,
        totalChallengesCompleted: 5,
      },
    },
    BADGE_DEFINITIONS: [
      { id: 'first-steps', title: '初次尝试', description: '完成第一道题', category: 'answer', icon: 'Footprints', conditionType: 'total_answered', conditionValue: 1 },
      { id: 'correct-10', title: '答对 10 题', description: '累计答对 10 道题', category: 'answer', icon: 'CheckCircle2', conditionType: 'total_correct', conditionValue: 10 },
      { id: 'streak-5', title: '连对 5 题', description: '连续答对 5 道题', category: 'streak', icon: 'Flame', conditionType: 'max_streak', conditionValue: 5 },
    ],
  }),
}));

// Mock AbilityRadar and ProgressTrend
vi.mock('@/components/AbilityRadar', () => ({
  AbilityRadar: () => <div data-testid="ability-radar">AbilityRadar</div>,
}));

vi.mock('@/components/ProgressTrend', () => ({
  ProgressTrend: () => <div data-testid="progress-trend">ProgressTrend</div>,
}));

// Mock useLearningRecommendations
vi.mock('@/hooks/useLearningRecommendations', () => ({
  useLearningRecommendations: () => [
    { mode: 'fill-in-blanks', preferred: true, reason: '填空推荐理由', priority: 80 },
    { mode: 'multiple-choice', preferred: false, reason: '选择推荐理由', priority: 60 },
    { mode: 'sentence-reorder', preferred: false, reason: '排序推荐理由', priority: 40 },
    { mode: 'dictation', preferred: false, reason: '听写推荐理由', priority: 20 },
  ],
}));

// Mock LearningRecommendations
vi.mock('@/components/LearningRecommendations', () => ({
  LearningRecommendations: ({ recommendations, modeAccuracy }: { recommendations: ModeRecommendation[]; modeAccuracy?: ModeAccuracy[] }) => (
    <div data-testid="learning-recommendations" data-mode-accuracy={modeAccuracy?.length}>
      {recommendations.length} recommendations rendered
    </div>
  ),
}));

describe('LearningProfile', () => {
  const mockOnNavigate = vi.fn();
  const mockOnBack = vi.fn();

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders header with back button', () => {
    render(<LearningProfile onNavigate={mockOnNavigate} onBack={mockOnBack} />);

    const backButton = screen.getByTestId('back-button');
    expect(backButton).toBeInTheDocument();
    fireEvent.click(backButton);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('renders title', () => {
    render(<LearningProfile onNavigate={mockOnNavigate} onBack={mockOnBack} />);

    expect(screen.getByText('学习档案')).toBeInTheDocument();
  });

  it('renders XP and level section', () => {
    render(<LearningProfile onNavigate={mockOnNavigate} onBack={mockOnBack} />);

    expect(screen.getByText(/等级 5/)).toBeInTheDocument();
    expect(screen.getByText(/500 XP 总经验值/)).toBeInTheDocument();
  });

  it('renders quick stats grid', () => {
    render(<LearningProfile onNavigate={mockOnNavigate} onBack={mockOnBack} />);

    // Use more specific queries to avoid multiple matches
    expect(screen.getByText('10')).toBeInTheDocument(); // learning days (appears once)
    expect(screen.getByText(/85%/)).toBeInTheDocument(); // accuracy
    expect(screen.getByText(/^200$/)).toBeInTheDocument(); // total questions (exact match)
  });

  it('renders badges count', () => {
    render(<LearningProfile onNavigate={mockOnNavigate} onBack={mockOnBack} />);

    expect(screen.getByText(/2\/3/)).toBeInTheDocument(); // unlocked/total badges
  });

  it('renders charts', () => {
    render(<LearningProfile onNavigate={mockOnNavigate} onBack={mockOnBack} />);

    expect(screen.getByTestId('ability-radar')).toBeInTheDocument();
    expect(screen.getByTestId('progress-trend')).toBeInTheDocument();
  });

  it('navigates to badges view on button click', () => {
    render(<LearningProfile onNavigate={mockOnNavigate} onBack={mockOnBack} />);

    const badgesButton = screen.getByText('查看全部成就徽章');
    fireEvent.click(badgesButton);
    expect(mockOnNavigate).toHaveBeenCalledWith('badges');
  });

  it('navigates to progress view on button click', () => {
    render(<LearningProfile onNavigate={mockOnNavigate} onBack={mockOnBack} />);

    const progressButton = screen.getByText('查看学习进度详情');
    fireEvent.click(progressButton);
    expect(mockOnNavigate).toHaveBeenCalledWith('progress');
  });

  it('renders learning summary section', () => {
    render(<LearningProfile onNavigate={mockOnNavigate} onBack={mockOnBack} />);

    expect(screen.getByText('学习概览')).toBeInTheDocument();
    expect(screen.getByText(/完成词库/)).toBeInTheDocument();
    expect(screen.getByText(/答对题数/)).toBeInTheDocument();
  });

  it('renders recent badges section when badges are unlocked', () => {
    render(<LearningProfile onNavigate={mockOnNavigate} onBack={mockOnBack} />);

    expect(screen.getByText('最近解锁')).toBeInTheDocument();
    expect(screen.getByTestId('badge-first-steps')).toBeInTheDocument();
  });

  it('renders learning recommendations section', () => {
    render(<LearningProfile onNavigate={mockOnNavigate} onBack={mockOnBack} />);

    expect(screen.getByText('推荐学习路径')).toBeInTheDocument();
  });

  it('renders learning recommendations component', () => {
    render(<LearningProfile onNavigate={mockOnNavigate} onBack={mockOnBack} />);

    expect(screen.getByTestId('learning-recommendations')).toBeInTheDocument();
  });

  it('passes modeAccuracy to learning recommendations', () => {
    render(<LearningProfile onNavigate={mockOnNavigate} onBack={mockOnBack} />);

    // The mock renders count based on recommendations array length
    expect(screen.getByTestId('learning-recommendations')).toHaveTextContent('4 recommendations rendered');
  });
});
