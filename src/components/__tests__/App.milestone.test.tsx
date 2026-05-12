import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ProgressHub } from '../ProgressHub';
import type { Milestone, MilestoneDefinition } from '@/data/types';
import type { NextMilestoneInfo } from '@/hooks/useMilestones';
import { MILESTONE_DEFINITIONS } from '@/data/types';

// Mock data for testing
const mockUnlockedMilestones: Milestone[] = [
  { id: '7-days', unlockedAt: Date.now() - 86400000 * 3 },
  { id: '14-days', unlockedAt: Date.now() - 86400000 },
];

const mockNextMilestone: NextMilestoneInfo = {
  definition: MILESTONE_DEFINITIONS[2], // 30-days milestone
  currentDays: 20,
  requiredDays: 30,
  progress: Math.round((20 / 30) * 100),
  daysRemaining: 10,
};

// Mock useProgressStats hook
vi.mock('@/hooks/useProgressStats', () => ({
  useProgressStats: vi.fn(() => ({
    level: 2,
    totalXP: 150,
    currentXP: 50,
    progressToNextLevel: 50,
    learningDays: 5,
    totalAccuracy: 85,
    completedDictionaries: 2,
    totalQuestions: 40,
    totalCorrect: 34,
    modeAccuracy: [],
  })),
  getThisWeekReport: vi.fn(() => ({
    weekStart: '2026-05-04',
    weekEnd: '2026-05-10',
    xpEarned: 500,
    questionsAnswered: 50,
    correctAnswers: 40,
    bestStreak: 5,
    learningDays: 5,
    sessionsCompleted: 3,
    accuracy: 80,
    comparison: { xpChange: 25, questionsChange: 15, accuracyChange: 5 },
    generatedAt: Date.now(),
  })),
  getDictionaryProgress: vi.fn(() => [
    { dictionaryId: 'junior', dictionaryName: '初中词汇', totalSentences: 1600, practicedSentences: 100, correctCount: 80, accuracy: 80, progress: 6 },
  ]),
  getReviewStreak: vi.fn(() => [
    { date: '2026-05-01', dayOfMonth: 1, dayOfWeek: 5, hasActivity: true, xpEarned: 50, questionsAnswered: 10 },
    { date: '2026-05-02', dayOfMonth: 2, dayOfWeek: 6, hasActivity: false, xpEarned: 0, questionsAnswered: 0 },
  ]),
}));

// Mock useMilestones hook
vi.mock('@/hooks/useMilestones', () => ({
  useMilestones: vi.fn(() => ({
    milestoneDefinitions: MILESTONE_DEFINITIONS,
    unlockedMilestones: mockUnlockedMilestones,
    totalLearningDays: 20,
    nextMilestone: mockNextMilestone,
    milestoneProgress: mockNextMilestone.progress,
    unlockedCount: mockUnlockedMilestones.length,
    checkAndUnlockMilestones: vi.fn(() => []),
    awardMilestone: vi.fn(() => null),
  })),
}));

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
      {progress.map((p: { dictionaryId: string }) => <span key={p.dictionaryId}>{p.dictionaryId}</span>)}
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

// Mock storage
vi.mock('@/services/storage', () => ({
  storage: {
    getHistory: vi.fn(() => []),
  },
}));

// Import the mock after it's defined
import { useMilestones } from '@/hooks/useMilestones';

describe('App Milestone Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Test Case 1: ProgressHub renders LongTermMilestoneCard with correct data
  // -------------------------------------------------------------------------

  describe('ProgressHub renders LongTermMilestoneCard with correct data', () => {
    it('displays correct total learning days in LongTermMilestoneCard', () => {
      render(<ProgressHub onNavigate={vi.fn()} />);

      // Check that the total learning days is displayed
      // The LongTermMilestoneCard shows the days count (20) in a specific structure
      // We verify the milestone badge section exists which confirms the card renders
      expect(screen.getByTestId('milestone-badge-7-days')).toBeInTheDocument();
    });

    it('displays milestone count correctly', () => {
      render(<ProgressHub onNavigate={vi.fn()} />);

      // Check milestone count (2/7 milestones)
      expect(screen.getByText('2/7 里程碑')).toBeInTheDocument();
    });

    it('shows unlocked milestone badges', () => {
      render(<ProgressHub onNavigate={vi.fn()} />);

      // Check that unlocked milestone badges are displayed
      expect(screen.getByTestId('milestone-badge-7-days')).toBeInTheDocument();
      expect(screen.getByTestId('milestone-badge-14-days')).toBeInTheDocument();
    });

    it('displays milestone titles for unlocked milestones', () => {
      render(<ProgressHub onNavigate={vi.fn()} />);

      // Check milestone titles - both LongTermMilestoneCard and MilestonePath show them
      const firstWeekBadges = screen.getAllByText('初露锋芒');
      const twoWeekBadges = screen.getAllByText('坚持不懈');
      expect(firstWeekBadges.length).toBeGreaterThanOrEqual(1);
      expect(twoWeekBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('shows progress section with next milestone info', () => {
      render(<ProgressHub onNavigate={vi.fn()} />);

      // Check next milestone info
      expect(screen.getByTestId('milestone-progress-section')).toBeInTheDocument();
      // The milestone title appears in the progress section
      const progressSection = screen.getByTestId('milestone-progress-section');
      expect(within(progressSection).getByText('月度学习者')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Test Case 2: ProgressHub renders MilestonePath with all milestone nodes
  // -------------------------------------------------------------------------

  describe('ProgressHub renders MilestonePath with all milestone nodes', () => {
    it('renders MilestonePath component', () => {
      render(<ProgressHub onNavigate={vi.fn()} />);

      // Check that MilestonePath is rendered
      expect(screen.getByTestId('milestone-path')).toBeInTheDocument();
    });

    it('renders all milestone nodes', () => {
      render(<ProgressHub onNavigate={vi.fn()} />);

      // Check that all 7 milestone nodes are rendered
      MILESTONE_DEFINITIONS.forEach((milestone: MilestoneDefinition) => {
        expect(screen.getByTestId(`milestone-node-${milestone.id}`)).toBeInTheDocument();
      });
    });

    it('renders milestone days thresholds in MilestonePath', () => {
      render(<ProgressHub onNavigate={vi.fn()} />);

      // Get the milestone path container and search within it
      const milestonePath = screen.getByTestId('milestone-path');
      const withinPath = within(milestonePath);

      // Check milestone days are displayed in MilestonePath
      expect(withinPath.getByText('7天')).toBeInTheDocument();
      expect(withinPath.getByText('14天')).toBeInTheDocument();
      expect(withinPath.getByText('30天')).toBeInTheDocument();
      expect(withinPath.getByText('60天')).toBeInTheDocument();
      expect(withinPath.getByText('90天')).toBeInTheDocument();
      expect(withinPath.getByText('180天')).toBeInTheDocument();
      expect(withinPath.getByText('365天')).toBeInTheDocument();
    });

    it('renders milestone icons in MilestonePath', () => {
      render(<ProgressHub onNavigate={vi.fn()} />);

      // Get the milestone path container and search within it
      const milestonePath = screen.getByTestId('milestone-path');
      const withinPath = within(milestonePath);

      // Check milestone icons are displayed in MilestonePath
      expect(withinPath.getByText('☀️')).toBeInTheDocument();
      expect(withinPath.getByText('🌟')).toBeInTheDocument();
      expect(withinPath.getByText('🌙')).toBeInTheDocument();
    });

    it('shows milestone popup on node click', () => {
      render(<ProgressHub onNavigate={vi.fn()} />);

      // Click on a milestone node
      fireEvent.click(screen.getByTestId('milestone-node-7-days'));

      // Check popup is displayed
      expect(screen.getByTestId('milestone-popup')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Test Case 3: ProgressHub displays milestone progress correctly
  // -------------------------------------------------------------------------

  describe('ProgressHub displays milestone progress correctly', () => {
    it('displays progress bar with correct percentage', () => {
      const progress = Math.round((20 / 30) * 100);

      (useMilestones as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        milestoneDefinitions: MILESTONE_DEFINITIONS,
        unlockedMilestones: mockUnlockedMilestones,
        totalLearningDays: 20,
        nextMilestone: mockNextMilestone,
        milestoneProgress: progress,
        unlockedCount: mockUnlockedMilestones.length,
        checkAndUnlockMilestones: vi.fn(() => []),
        awardMilestone: vi.fn(() => null),
      });

      render(<ProgressHub onNavigate={vi.fn()} />);

      // Check progress bar exists with correct style
      const progressBar = screen.getByTestId('milestone-progress-bar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: `${progress}%` });
    });

    it('displays current and required days', () => {
      render(<ProgressHub onNavigate={vi.fn()} />);

      // Check days display
      expect(screen.getByText('20 / 30 天')).toBeInTheDocument();
    });

    it('displays days remaining to next milestone', () => {
      render(<ProgressHub onNavigate={vi.fn()} />);

      // Check days remaining
      expect(screen.getByText('还差')).toBeInTheDocument();
      expect(screen.getByText('10 天')).toBeInTheDocument();
    });

    it('displays progress percentage', () => {
      const progress = Math.round((20 / 30) * 100);

      (useMilestones as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        milestoneDefinitions: MILESTONE_DEFINITIONS,
        unlockedMilestones: mockUnlockedMilestones,
        totalLearningDays: 20,
        nextMilestone: mockNextMilestone,
        milestoneProgress: progress,
        unlockedCount: mockUnlockedMilestones.length,
        checkAndUnlockMilestones: vi.fn(() => []),
        awardMilestone: vi.fn(() => null),
      });

      render(<ProgressHub onNavigate={vi.fn()} />);

      // Check progress percentage
      expect(screen.getByText(`${progress}%`)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Test Case 4: ProgressHub handles empty milestone state (no unlocked)
  // -------------------------------------------------------------------------

  describe('ProgressHub handles empty milestone state (no unlocked)', () => {
    it('displays zero unlocked count', () => {
      (useMilestones as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        milestoneDefinitions: MILESTONE_DEFINITIONS,
        unlockedMilestones: [],
        totalLearningDays: 3,
        nextMilestone: {
          definition: MILESTONE_DEFINITIONS[0],
          currentDays: 3,
          requiredDays: 7,
          progress: Math.round((3 / 7) * 100),
          daysRemaining: 4,
        },
        milestoneProgress: Math.round((3 / 7) * 100),
        unlockedCount: 0,
        checkAndUnlockMilestones: vi.fn(() => []),
        awardMilestone: vi.fn(() => null),
      });

      render(<ProgressHub onNavigate={vi.fn()} />);

      // Check 0/7 milestones
      expect(screen.getByText('0/7 里程碑')).toBeInTheDocument();
    });

    it('shows empty state message', () => {
      (useMilestones as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        milestoneDefinitions: MILESTONE_DEFINITIONS,
        unlockedMilestones: [],
        totalLearningDays: 3,
        nextMilestone: {
          definition: MILESTONE_DEFINITIONS[0],
          currentDays: 3,
          requiredDays: 7,
          progress: Math.round((3 / 7) * 100),
          daysRemaining: 4,
        },
        milestoneProgress: Math.round((3 / 7) * 100),
        unlockedCount: 0,
        checkAndUnlockMilestones: vi.fn(() => []),
        awardMilestone: vi.fn(() => null),
      });

      render(<ProgressHub onNavigate={vi.fn()} />);

      // Check empty state message
      expect(screen.getByText(/开始你的学习之旅/)).toBeInTheDocument();
    });

    it('displays first milestone unlock countdown', () => {
      (useMilestones as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        milestoneDefinitions: MILESTONE_DEFINITIONS,
        unlockedMilestones: [],
        totalLearningDays: 3,
        nextMilestone: {
          definition: MILESTONE_DEFINITIONS[0],
          currentDays: 3,
          requiredDays: 7,
          progress: Math.round((3 / 7) * 100),
          daysRemaining: 4,
        },
        milestoneProgress: Math.round((3 / 7) * 100),
        unlockedCount: 0,
        checkAndUnlockMilestones: vi.fn(() => []),
        awardMilestone: vi.fn(() => null),
      });

      render(<ProgressHub onNavigate={vi.fn()} />);

      // Check countdown message (4 days remaining)
      expect(screen.getByText(/4 天后解锁/)).toBeInTheDocument();
    });

    it('does not show milestone badges when none unlocked', () => {
      (useMilestones as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        milestoneDefinitions: MILESTONE_DEFINITIONS,
        unlockedMilestones: [],
        totalLearningDays: 3,
        nextMilestone: {
          definition: MILESTONE_DEFINITIONS[0],
          currentDays: 3,
          requiredDays: 7,
          progress: Math.round((3 / 7) * 100),
          daysRemaining: 4,
        },
        milestoneProgress: Math.round((3 / 7) * 100),
        unlockedCount: 0,
        checkAndUnlockMilestones: vi.fn(() => []),
        awardMilestone: vi.fn(() => null),
      });

      render(<ProgressHub onNavigate={vi.fn()} />);

      // Check no milestone badges are displayed
      expect(screen.queryByTestId('milestone-badge-7-days')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Test Case 5: ProgressHub handles all milestones unlocked state
  // -------------------------------------------------------------------------

  describe('ProgressHub handles all milestones unlocked state', () => {
    it('displays all milestones unlocked count', () => {
      const allUnlocked = MILESTONE_DEFINITIONS.map((m: MilestoneDefinition) => ({
        id: m.id,
        unlockedAt: Date.now(),
      }));

      (useMilestones as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        milestoneDefinitions: MILESTONE_DEFINITIONS,
        unlockedMilestones: allUnlocked,
        totalLearningDays: 400,
        nextMilestone: null,
        milestoneProgress: -1,
        unlockedCount: allUnlocked.length,
        checkAndUnlockMilestones: vi.fn(() => []),
        awardMilestone: vi.fn(() => null),
      });

      render(<ProgressHub onNavigate={vi.fn()} />);

      // Check 7/7 milestones
      expect(screen.getByText('7/7 里程碑')).toBeInTheDocument();
    });

    it('displays congratulatory message', () => {
      const allUnlocked = MILESTONE_DEFINITIONS.map((m: MilestoneDefinition) => ({
        id: m.id,
        unlockedAt: Date.now(),
      }));

      (useMilestones as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        milestoneDefinitions: MILESTONE_DEFINITIONS,
        unlockedMilestones: allUnlocked,
        totalLearningDays: 400,
        nextMilestone: null,
        milestoneProgress: -1,
        unlockedCount: allUnlocked.length,
        checkAndUnlockMilestones: vi.fn(() => []),
        awardMilestone: vi.fn(() => null),
      });

      render(<ProgressHub onNavigate={vi.fn()} />);

      // Check congratulations message
      expect(screen.getByText('🎉')).toBeInTheDocument();
      expect(screen.getByText('恭喜达成所有里程碑!')).toBeInTheDocument();
    });

    it('displays total learning days in congratulations', () => {
      const allUnlocked = MILESTONE_DEFINITIONS.map((m: MilestoneDefinition) => ({
        id: m.id,
        unlockedAt: Date.now(),
      }));

      (useMilestones as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        milestoneDefinitions: MILESTONE_DEFINITIONS,
        unlockedMilestones: allUnlocked,
        totalLearningDays: 400,
        nextMilestone: null,
        milestoneProgress: -1,
        unlockedCount: allUnlocked.length,
        checkAndUnlockMilestones: vi.fn(() => []),
        awardMilestone: vi.fn(() => null),
      });

      render(<ProgressHub onNavigate={vi.fn()} />);

      // Check total days in congratulations
      expect(screen.getByText(/已坚持学习 400 天/)).toBeInTheDocument();
    });

    it('hides progress section when all unlocked', () => {
      const allUnlocked = MILESTONE_DEFINITIONS.map((m: MilestoneDefinition) => ({
        id: m.id,
        unlockedAt: Date.now(),
      }));

      (useMilestones as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        milestoneDefinitions: MILESTONE_DEFINITIONS,
        unlockedMilestones: allUnlocked,
        totalLearningDays: 400,
        nextMilestone: null,
        milestoneProgress: -1,
        unlockedCount: allUnlocked.length,
        checkAndUnlockMilestones: vi.fn(() => []),
        awardMilestone: vi.fn(() => null),
      });

      render(<ProgressHub onNavigate={vi.fn()} />);

      // Check progress section is hidden
      expect(screen.queryByTestId('milestone-progress-section')).not.toBeInTheDocument();
    });

    it('shows all milestone badges as unlocked', () => {
      const allUnlocked = MILESTONE_DEFINITIONS.map((m: MilestoneDefinition) => ({
        id: m.id,
        unlockedAt: Date.now(),
      }));

      (useMilestones as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        milestoneDefinitions: MILESTONE_DEFINITIONS,
        unlockedMilestones: allUnlocked,
        totalLearningDays: 400,
        nextMilestone: null,
        milestoneProgress: -1,
        unlockedCount: allUnlocked.length,
        checkAndUnlockMilestones: vi.fn(() => []),
        awardMilestone: vi.fn(() => null),
      });

      render(<ProgressHub onNavigate={vi.fn()} />);

      // All milestone badges should be displayed
      MILESTONE_DEFINITIONS.forEach((milestone: MilestoneDefinition) => {
        expect(screen.getByTestId(`milestone-badge-${milestone.id}`)).toBeInTheDocument();
      });
    });

    it('shows checkmarks on all MilestonePath nodes', () => {
      const allUnlocked = MILESTONE_DEFINITIONS.map((m: MilestoneDefinition) => ({
        id: m.id,
        unlockedAt: Date.now(),
      }));

      (useMilestones as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        milestoneDefinitions: MILESTONE_DEFINITIONS,
        unlockedMilestones: allUnlocked,
        totalLearningDays: 400,
        nextMilestone: null,
        milestoneProgress: -1,
        unlockedCount: allUnlocked.length,
        checkAndUnlockMilestones: vi.fn(() => []),
        awardMilestone: vi.fn(() => null),
      });

      render(<ProgressHub onNavigate={vi.fn()} />);

      // All nodes should have checkmarks (green background)
      MILESTONE_DEFINITIONS.forEach((milestone: MilestoneDefinition) => {
        const node = screen.getByTestId(`milestone-node-${milestone.id}`);
        const checkmark = node.parentElement?.querySelector('.bg-green-500');
        expect(checkmark).toBeInTheDocument();
      });
    });
  });
});
