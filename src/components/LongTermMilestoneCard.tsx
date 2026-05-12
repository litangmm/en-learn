import { Calendar, Award, ChevronRight } from 'lucide-react';
import { MILESTONE_DEFINITIONS, type Milestone, type MilestoneDefinition } from '@/data/types';
import type { NextMilestoneInfo } from '@/hooks/useMilestones';

export interface LongTermMilestoneCardProps {
  /** Total cumulative learning days */
  totalLearningDays: number;
  /** List of unlocked milestones */
  unlockedMilestones: Milestone[];
  /** Next milestone info with progress, or null if all unlocked */
  nextMilestone: NextMilestoneInfo | null;
  /** Progress percentage to next milestone (0-100), -1 if all unlocked */
  milestoneProgress: number;
  /** Callback when clicking an unlocked milestone badge */
  onMilestoneClick?: (_milestone: MilestoneDefinition) => void;
  /** Callback when clicking the progress area */
  onProgressClick?: () => void;
}

/**
 * Get milestone definition by ID from the central definitions
 */
function getMilestoneDefinition(id: string): MilestoneDefinition | undefined {
  return MILESTONE_DEFINITIONS.find((d) => d.id === id);
}

/**
 * LongTermMilestoneCard displays cumulative learning days and milestone progress.
 * Shows current days, progress to next milestone, and unlocked achievement badges.
 */
export function LongTermMilestoneCard({
  totalLearningDays,
  unlockedMilestones,
  nextMilestone,
  milestoneProgress,
  onMilestoneClick,
  onProgressClick,
}: LongTermMilestoneCardProps) {
  const allUnlocked = nextMilestone === null;
  const unlockedCount = unlockedMilestones.length;
  const totalCount = MILESTONE_DEFINITIONS.length;
  const firstMilestoneDays = MILESTONE_DEFINITIONS[0]?.requiredDays ?? 7;

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-200" />
          <span className="text-sm font-medium text-indigo-100">累计学习天数</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Award className="w-4 h-4 text-amber-300" />
          <span className="text-sm text-indigo-100">
            {unlockedCount}/{totalCount} 里程碑
          </span>
        </div>
      </div>

      {/* Main Number Display */}
      <div className="text-center mb-4">
        <div className="text-5xl font-bold mb-1">{totalLearningDays}</div>
        <div className="text-indigo-200 text-sm">天</div>
      </div>

      {/* Progress Section */}
      {!allUnlocked && nextMilestone && (
        <div
          className={`bg-white/10 rounded-lg p-4 ${onProgressClick ? 'cursor-pointer hover:bg-white/20 transition-colors' : ''}`}
          onClick={onProgressClick}
          data-testid="milestone-progress-section"
        >
          {/* Next Milestone Info */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{nextMilestone.definition.icon}</span>
              <div>
                <div className="text-sm font-medium">{nextMilestone.definition.title}</div>
                <div className="text-xs text-indigo-200">{nextMilestone.definition.titleEn}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-indigo-200">还差</div>
              <div className="text-lg font-semibold">{nextMilestone.daysRemaining} 天</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500 ease-out"
              style={{ width: `${milestoneProgress}%` }}
              data-testid="milestone-progress-bar"
            />
          </div>

          {/* Progress Stats */}
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-indigo-200">
              {nextMilestone.currentDays} / {nextMilestone.requiredDays} 天
            </span>
            <span className="text-xs text-indigo-200">{milestoneProgress}%</span>
          </div>
        </div>
      )}

      {/* All Unlocked Congratulations */}
      {allUnlocked && (
        <div className="bg-white/10 rounded-lg p-4 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <div className="font-semibold text-lg mb-1">恭喜达成所有里程碑!</div>
          <div className="text-sm text-indigo-200">
            已坚持学习 {totalLearningDays} 天，了不起的成就!
          </div>
        </div>
      )}

      {/* Unlocked Badges Row */}
      {unlockedCount > 0 && (
        <div className="mt-4">
          <div className="text-xs text-indigo-200 mb-2">已解锁里程碑</div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {unlockedMilestones.map((milestone) => {
              const definition = getMilestoneDefinition(milestone.id);
              if (!definition) return null;

              return (
                <button
                  key={milestone.id}
                  onClick={() => onMilestoneClick?.(definition)}
                  className="flex-shrink-0 bg-white/15 hover:bg-white/25 rounded-lg px-3 py-2 flex items-center gap-2 transition-colors"
                  data-testid={`milestone-badge-${milestone.id}`}
                >
                  <span className="text-xl">{definition.icon}</span>
                  <div className="text-left">
                    <div className="text-xs font-medium">{definition.title}</div>
                    <div className="text-[10px] text-indigo-200">{definition.requiredDays}天</div>
                  </div>
                  <ChevronRight className="w-3 h-3 text-indigo-300" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State - No Milestones Yet */}
      {unlockedCount === 0 && (
        <div className="mt-4 text-center text-sm text-indigo-200">
          开始你的学习之旅，第一个里程碑在 {firstMilestoneDays - totalLearningDays} 天后解锁
        </div>
      )}
    </div>
  );
}