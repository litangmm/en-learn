import { useMemo } from 'react';
import { useLearningProfile } from '@/hooks/useLearningProfile';
import { MILESTONE_DEFINITIONS, type MilestoneDefinition } from '@/data/types';

/**
 * Props for MilestoneTimeline component.
 */
export interface MilestoneTimelineProps {
  /** Custom class name */
  className?: string;
  /** Whether to show XP rewards */
  showXP?: boolean;
  /** Number of weeks to show in horizontal timeline mode (desktop) */
  weeks?: number;
}

/**
 * A single milestone item for rendering.
 */
interface TimelineMilestone extends MilestoneDefinition {
  /** Whether this milestone has been unlocked */
  isUnlocked: boolean;
  /** Timestamp when unlocked (null if not unlocked) */
  unlockedAt: number | null;
}

/**
 * Formats a timestamp to a readable date string.
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * MilestoneTimeline displays learning milestones in a timeline format.
 * Shows unlocked milestones with their unlock dates, and locked milestones
 * as grayed-out future achievements.
 */
export function MilestoneTimeline({
  className = '',
  showXP = true,
  weeks: _weeks = 4,
}: MilestoneTimelineProps) {
  const { unlockedMilestones } = useLearningProfile();

  // Build timeline milestones combining definitions with unlock data
  const timelineMilestones = useMemo((): TimelineMilestone[] => {
    const unlockedMap = new Map(
      unlockedMilestones.map((m) => [m.id, m.unlockedAt])
    );

    return MILESTONE_DEFINITIONS.map((def) => ({
      ...def,
      isUnlocked: unlockedMap.has(def.id),
      unlockedAt: unlockedMap.get(def.id) ?? null,
    }));
  }, [unlockedMilestones]);

  // Group milestones by unlock status
  const unlockedItems = timelineMilestones.filter((m) => m.isUnlocked);
  const lockedItems = timelineMilestones.filter((m) => !m.isUnlocked);

  // Calculate counts
  const totalCount = timelineMilestones.length;
  const unlockedCount = unlockedItems.length;

  return (
    <div
      className={`bg-white rounded-xl p-4 ${className}`}
      data-testid="milestone-timeline"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">学习里程碑</h2>
        <span className="text-sm text-slate-500">
          {unlockedCount}/{totalCount}
        </span>
      </div>

      {/* Timeline content */}
      <div className="space-y-3">
        {/* Empty state */}
        {totalCount === 0 && (
          <div className="text-center py-8 text-slate-400" data-testid="timeline-empty">
            <p>暂无里程碑数据</p>
          </div>
        )}

        {/* Unlocked milestones */}
        {unlockedItems.map((milestone, index) => (
          <div
            key={milestone.id}
            className="flex items-start gap-3"
            data-testid={`milestone-unlocked-${milestone.id}`}
            data-unlocked="true"
          >
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <span className="text-lg">{milestone.icon}</span>
              </div>
              {index < unlockedItems.length - 1 && (
                <div className="w-0.5 h-8 bg-green-200" data-testid="timeline-connector" />
              )}
            </div>

            {/* Milestone content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-slate-800">
                    {milestone.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {milestone.titleEn}
                  </p>
                </div>
                {showXP && (
                  <span
                    className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full"
                    data-testid={`milestone-xp-${milestone.id}`}
                  >
                    +{milestone.xpReward} XP
                  </span>
                )}
              </div>
              {milestone.unlockedAt && (
                <p
                  className="text-xs text-slate-400 mt-1"
                  data-testid={`milestone-date-${milestone.id}`}
                >
                  解锁于 {formatDate(milestone.unlockedAt)}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Locked milestones (gray) */}
        {lockedItems.map((milestone, index) => (
          <div
            key={milestone.id}
            className="flex items-start gap-3 opacity-50"
            data-testid={`milestone-locked-${milestone.id}`}
            data-unlocked="false"
          >
            {/* Timeline connector */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <span className="text-lg">{milestone.icon}</span>
              </div>
              {/* Show connector only if there are more items after this locked one */}
              {index < lockedItems.length - 1 && (
                <div className="w-0.5 h-8 bg-slate-200" data-testid="timeline-connector-locked" />
              )}
              {/* Connect to first unlocked if this is the first locked item */}
              {index === 0 && unlockedItems.length > 0 && (
                <div className="w-0.5 h-8 bg-gradient-to-b from-green-200 to-slate-200" />
              )}
            </div>

            {/* Milestone content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-slate-500">
                    {milestone.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {milestone.titleEn}
                  </p>
                </div>
                {showXP && (
                  <span
                    className="text-xs px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full"
                    data-testid={`milestone-xp-locked-${milestone.id}`}
                  >
                    +{milestone.xpReward} XP
                  </span>
                )}
              </div>
              <p
                className="text-xs text-slate-400 mt-1"
                data-testid={`milestone-days-${milestone.id}`}
              >
                需要 {milestone.requiredDays} 天
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
              style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              data-testid="milestone-progress-bar"
            />
          </div>
          <span className="text-sm font-medium text-slate-600">
            {Math.round((unlockedCount / totalCount) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
}