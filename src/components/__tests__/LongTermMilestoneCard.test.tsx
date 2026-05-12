import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LongTermMilestoneCard } from '../LongTermMilestoneCard';
import type { NextMilestoneInfo } from '@/hooks/useMilestones';
import type { Milestone } from '@/data/types';
import { MILESTONE_DEFINITIONS } from '@/data/types';

// Mock milestone definitions for test data
const mockMilestones: Milestone[] = [
  { id: '7-days', unlockedAt: Date.now() },
  { id: '14-days', unlockedAt: Date.now() },
];

const mockNextMilestone: NextMilestoneInfo = {
  definition: MILESTONE_DEFINITIONS[0], // 7-days milestone
  currentDays: 5,
  requiredDays: 7,
  progress: Math.round((5 / 7) * 100),
  daysRemaining: 2,
};

describe('LongTermMilestoneCard', () => {
  // -------------------------------------------------------------------------
  // Basic Rendering Tests
  // -------------------------------------------------------------------------

  describe('Basic Rendering', () => {
    it('renders totalLearningDays correctly', () => {
      render(
        <LongTermMilestoneCard
          totalLearningDays={25}
          unlockedMilestones={[]}
          nextMilestone={mockNextMilestone}
          milestoneProgress={mockNextMilestone.progress}
        />
      );

      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('天')).toBeInTheDocument();
    });

    it('renders header with correct labels', () => {
      render(
        <LongTermMilestoneCard
          totalLearningDays={10}
          unlockedMilestones={[]}
          nextMilestone={mockNextMilestone}
          milestoneProgress={mockNextMilestone.progress}
        />
      );

      expect(screen.getByText('累计学习天数')).toBeInTheDocument();
      expect(screen.getByText('0/7 里程碑')).toBeInTheDocument();
    });

    it('renders milestone count correctly', () => {
      render(
        <LongTermMilestoneCard
          totalLearningDays={50}
          unlockedMilestones={mockMilestones}
          nextMilestone={mockNextMilestone}
          milestoneProgress={mockNextMilestone.progress}
        />
      );

      expect(screen.getByText('2/7 里程碑')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Progress Bar Tests
  // -------------------------------------------------------------------------

  describe('Progress Bar', () => {
    it('shows progress bar with correct percentage', () => {
      render(
        <LongTermMilestoneCard
          totalLearningDays={5}
          unlockedMilestones={[]}
          nextMilestone={mockNextMilestone}
          milestoneProgress={mockNextMilestone.progress}
        />
      );

      const progressBar = screen.getByTestId('milestone-progress-bar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveStyle({ width: `${mockNextMilestone.progress}%` });
    });

    it('displays progress section when nextMilestone is provided', () => {
      render(
        <LongTermMilestoneCard
          totalLearningDays={5}
          unlockedMilestones={[]}
          nextMilestone={mockNextMilestone}
          milestoneProgress={mockNextMilestone.progress}
        />
      );

      expect(screen.getByTestId('milestone-progress-section')).toBeInTheDocument();
      expect(screen.getByText('初露锋芒')).toBeInTheDocument();
      expect(screen.getByText('First Week')).toBeInTheDocument();
    });

    it('shows correct days remaining', () => {
      render(
        <LongTermMilestoneCard
          totalLearningDays={5}
          unlockedMilestones={[]}
          nextMilestone={mockNextMilestone}
          milestoneProgress={mockNextMilestone.progress}
        />
      );

      expect(screen.getByText('还差')).toBeInTheDocument();
      expect(screen.getByText('2 天')).toBeInTheDocument();
    });

    it('shows current/target days in progress stats', () => {
      render(
        <LongTermMilestoneCard
          totalLearningDays={5}
          unlockedMilestones={[]}
          nextMilestone={mockNextMilestone}
          milestoneProgress={mockNextMilestone.progress}
        />
      );

      expect(screen.getByText('5 / 7 天')).toBeInTheDocument();
      expect(screen.getByText(`${mockNextMilestone.progress}%`)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Next Milestone Info Tests
  // -------------------------------------------------------------------------

  describe('Next Milestone Info', () => {
    it('displays next milestone icon', () => {
      render(
        <LongTermMilestoneCard
          totalLearningDays={5}
          unlockedMilestones={[]}
          nextMilestone={mockNextMilestone}
          milestoneProgress={mockNextMilestone.progress}
        />
      );

      // Check that the milestone icon (emoji) is rendered
      const iconElement = screen.getByText('☀️');
      expect(iconElement).toBeInTheDocument();
    });

    it('hides progress section when all milestones are unlocked', () => {
      render(
        <LongTermMilestoneCard
          totalLearningDays={365}
          unlockedMilestones={MILESTONE_DEFINITIONS.map((m) => ({ id: m.id, unlockedAt: Date.now() }))}
          nextMilestone={null}
          milestoneProgress={-1}
        />
      );

      expect(screen.queryByTestId('milestone-progress-section')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Unlocked Milestones Tests
  // -------------------------------------------------------------------------

  describe('Unlocked Milestones', () => {
    it('shows unlocked milestone badges', () => {
      render(
        <LongTermMilestoneCard
          totalLearningDays={20}
          unlockedMilestones={mockMilestones}
          nextMilestone={{
            definition: MILESTONE_DEFINITIONS[2], // 30-days milestone
            currentDays: 20,
            requiredDays: 30,
            progress: Math.round((20 / 30) * 100),
            daysRemaining: 10,
          }}
          milestoneProgress={Math.round((20 / 30) * 100)}
        />
      );

      expect(screen.getByTestId('milestone-badge-7-days')).toBeInTheDocument();
      expect(screen.getByTestId('milestone-badge-14-days')).toBeInTheDocument();
    });

    it('displays milestone titles in badges', () => {
      render(
        <LongTermMilestoneCard
          totalLearningDays={20}
          unlockedMilestones={mockMilestones}
          nextMilestone={{
            definition: MILESTONE_DEFINITIONS[2],
            currentDays: 20,
            requiredDays: 30,
            progress: Math.round((20 / 30) * 100),
            daysRemaining: 10,
          }}
          milestoneProgress={Math.round((20 / 30) * 100)}
        />
      );

      expect(screen.getByText('初露锋芒')).toBeInTheDocument();
      expect(screen.getByText('坚持不懈')).toBeInTheDocument();
    });

    it('displays required days in badges', () => {
      render(
        <LongTermMilestoneCard
          totalLearningDays={20}
          unlockedMilestones={mockMilestones}
          nextMilestone={{
            definition: MILESTONE_DEFINITIONS[2],
            currentDays: 20,
            requiredDays: 30,
            progress: Math.round((20 / 30) * 100),
            daysRemaining: 10,
          }}
          milestoneProgress={Math.round((20 / 30) * 100)}
        />
      );

      expect(screen.getByText('7天')).toBeInTheDocument();
      expect(screen.getByText('14天')).toBeInTheDocument();
    });

    it('calls onMilestoneClick when badge is clicked', () => {
      const handleMilestoneClick = vi.fn();
      render(
        <LongTermMilestoneCard
          totalLearningDays={20}
          unlockedMilestones={mockMilestones}
          nextMilestone={{
            definition: MILESTONE_DEFINITIONS[2],
            currentDays: 20,
            requiredDays: 30,
            progress: Math.round((20 / 30) * 100),
            daysRemaining: 10,
          }}
          milestoneProgress={Math.round((20 / 30) * 100)}
          onMilestoneClick={handleMilestoneClick}
        />
      );

      fireEvent.click(screen.getByTestId('milestone-badge-7-days'));
      expect(handleMilestoneClick).toHaveBeenCalledTimes(1);
      expect(handleMilestoneClick).toHaveBeenCalledWith(
        expect.objectContaining({ id: '7-days' })
      );
    });
  });

  // -------------------------------------------------------------------------
  // All Unlocked Congratulations Tests
  // -------------------------------------------------------------------------

  describe('All Unlocked State', () => {
    it('displays congratulatory message when all unlocked', () => {
      render(
        <LongTermMilestoneCard
          totalLearningDays={365}
          unlockedMilestones={MILESTONE_DEFINITIONS.map((m) => ({ id: m.id, unlockedAt: Date.now() }))}
          nextMilestone={null}
          milestoneProgress={-1}
        />
      );

      expect(screen.getByText('🎉')).toBeInTheDocument();
      expect(screen.getByText('恭喜达成所有里程碑!')).toBeInTheDocument();
      expect(screen.getByText(/了不起的成就!/)).toBeInTheDocument();
    });

    it('shows total days in congratulations message', () => {
      render(
        <LongTermMilestoneCard
          totalLearningDays={500}
          unlockedMilestones={MILESTONE_DEFINITIONS.map((m) => ({ id: m.id, unlockedAt: Date.now() }))}
          nextMilestone={null}
          milestoneProgress={-1}
        />
      );

      expect(screen.getByText(/已坚持学习 500 天/)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Empty State Tests
  // -------------------------------------------------------------------------

  describe('Empty State', () => {
    it('shows empty state when no milestones unlocked', () => {
      render(
        <LongTermMilestoneCard
          totalLearningDays={3}
          unlockedMilestones={[]}
          nextMilestone={mockNextMilestone}
          milestoneProgress={mockNextMilestone.progress}
        />
      );

      expect(screen.getByText(/开始你的学习之旅/)).toBeInTheDocument();
    });

    it('shows correct remaining days in empty state message', () => {
      render(
        <LongTermMilestoneCard
          totalLearningDays={3}
          unlockedMilestones={[]}
          nextMilestone={mockNextMilestone}
          milestoneProgress={mockNextMilestone.progress}
        />
      );

      // Should say "第一个里程碑在 4 天后解锁" (7 - 3 = 4)
      expect(screen.getByText(/4 天后解锁/)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Click Handler Tests
  // -------------------------------------------------------------------------

  describe('Click Handlers', () => {
    it('calls onProgressClick when progress section is clicked', () => {
      const handleProgressClick = vi.fn();
      render(
        <LongTermMilestoneCard
          totalLearningDays={5}
          unlockedMilestones={[]}
          nextMilestone={mockNextMilestone}
          milestoneProgress={mockNextMilestone.progress}
          onProgressClick={handleProgressClick}
        />
      );

      fireEvent.click(screen.getByTestId('milestone-progress-section'));
      expect(handleProgressClick).toHaveBeenCalledTimes(1);
    });

    it('does not apply hover styles when onProgressClick is not provided', () => {
      render(
        <LongTermMilestoneCard
          totalLearningDays={5}
          unlockedMilestones={[]}
          nextMilestone={mockNextMilestone}
          milestoneProgress={mockNextMilestone.progress}
        />
      );

      const progressSection = screen.getByTestId('milestone-progress-section');
      expect(progressSection).not.toHaveClass('cursor-pointer');
    });
  });

  // -------------------------------------------------------------------------
  // Edge Cases
  // -------------------------------------------------------------------------

  describe('Edge Cases', () => {
    it('handles zero totalLearningDays', () => {
      render(
        <LongTermMilestoneCard
          totalLearningDays={0}
          unlockedMilestones={[]}
          nextMilestone={{
            definition: MILESTONE_DEFINITIONS[0],
            currentDays: 0,
            requiredDays: 7,
            progress: 0,
            daysRemaining: 7,
          }}
          milestoneProgress={0}
        />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('7 天')).toBeInTheDocument();
    });

    it('handles progress exactly at 100%', () => {
      const almostCompleteMilestone: NextMilestoneInfo = {
        definition: MILESTONE_DEFINITIONS[0],
        currentDays: 7,
        requiredDays: 7,
        progress: 100,
        daysRemaining: 0,
      };

      render(
        <LongTermMilestoneCard
          totalLearningDays={7}
          unlockedMilestones={[]}
          nextMilestone={almostCompleteMilestone}
          milestoneProgress={100}
        />
      );

      const progressBar = screen.getByTestId('milestone-progress-bar');
      expect(progressBar).toHaveStyle({ width: '100%' });
    });

    it('handles very large totalLearningDays', () => {
      render(
        <LongTermMilestoneCard
          totalLearningDays={9999}
          unlockedMilestones={MILESTONE_DEFINITIONS.map((m) => ({ id: m.id, unlockedAt: Date.now() }))}
          nextMilestone={null}
          milestoneProgress={-1}
        />
      );

      expect(screen.getByText('9999')).toBeInTheDocument();
      expect(screen.getByText('🎉')).toBeInTheDocument();
    });
  });
});
