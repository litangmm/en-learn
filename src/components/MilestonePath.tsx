import { useState, useMemo } from 'react';
import { X, Gift } from 'lucide-react';
import type { Milestone, MilestoneDefinition } from '@/data/types';

export interface MilestonePathProps {
  /** All milestone definitions */
  milestoneDefinitions: MilestoneDefinition[];
  /** List of unlocked milestones */
  unlockedMilestones: Milestone[];
  /** Callback when clicking a milestone node */
  onMilestoneClick?: (milestone: MilestoneDefinition) => void;
}

/**
 * MilestonePath displays all milestones in a horizontal achievement path.
 * Shows nodes connected by lines, with different styles for unlocked vs locked.
 */
export function MilestonePath({
  milestoneDefinitions,
  unlockedMilestones,
  onMilestoneClick,
}: MilestonePathProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneDefinition | null>(null);
  const unlockedIds = useMemo(
    () => new Set(unlockedMilestones.map((m) => m.id)),
    [unlockedMilestones]
  );

  const handleNodeClick = (milestone: MilestoneDefinition) => {
    setSelectedMilestone(milestone);
    onMilestoneClick?.(milestone);
  };

  const handleClosePopup = () => {
    setSelectedMilestone(null);
  };

  return (
    <>
      {/* Calculate min-width based on number of milestones */}
      <div
        className="relative py-4 px-2 overflow-x-auto scrollbar-hide"
        data-testid="milestone-path"
        style={{ minWidth: `${milestoneDefinitions.length * 80}px` }}
      >
        {/* SVG Lines Container */}
        <svg
          className="absolute top-1/2 left-0 w-full h-4 pointer-events-none"
          style={{ transform: 'translateY(-50%)' }}
        >
          {milestoneDefinitions.map((milestone, index) => {
            if (index === milestoneDefinitions.length - 1) return null;

            const isUnlocked = unlockedIds.has(milestone.id);
            const isNextUnlocked = unlockedIds.has(milestoneDefinitions[index + 1].id);

            return (
              <line
                key={`line-${milestone.id}`}
                x1={`${(index + 1) * (100 / milestoneDefinitions.length)}%`}
                y1="50%"
                x2={`${(index + 2) * (100 / milestoneDefinitions.length)}%`}
                y2="50%"
                stroke={isUnlocked && isNextUnlocked ? '#818cf8' : '#cbd5e1'}
                strokeWidth="3"
                strokeDasharray={isUnlocked && isNextUnlocked ? '0' : '6,4'}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* Milestone Nodes */}
        <div className="relative flex items-center justify-between">
          {milestoneDefinitions.map((milestone) => {
            const isUnlocked = unlockedIds.has(milestone.id);

            return (
              <div
                key={milestone.id}
                className="relative flex flex-col items-center z-10"
              >
                {/* Node Circle */}
                <button
                  onClick={() => handleNodeClick(milestone)}
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-xl
                    transition-all duration-200 transform
                    ${isUnlocked
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 hover:scale-110'
                      : 'bg-slate-100 text-slate-400 border-2 border-slate-200 hover:border-slate-300 hover:scale-105'
                    }
                  `}
                  data-testid={`milestone-node-${milestone.id}`}
                >
                  {milestone.icon}
                </button>

                {/* Days Label */}
                <div
                  className={`
                    mt-2 text-xs font-medium text-center
                    ${isUnlocked ? 'text-indigo-600' : 'text-slate-400'}
                  `}
                >
                  {milestone.requiredDays}天
                </div>

                {/* Title */}
                <div
                  className={`
                    mt-1 text-xs text-center max-w-[60px] leading-tight
                    ${isUnlocked ? 'text-slate-700' : 'text-slate-400'}
                  `}
                >
                  {milestone.title}
                </div>

                {/* Unlocked Checkmark */}
                {isUnlocked && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Popup Modal */}
      {selectedMilestone && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleClosePopup}
          data-testid="milestone-popup-overlay"
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            data-testid="milestone-popup"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-3xl">
                  {selectedMilestone.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{selectedMilestone.title}</h3>
                  <p className="text-sm text-slate-500">{selectedMilestone.titleEn}</p>
                </div>
              </div>
              <button
                onClick={handleClosePopup}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                data-testid="milestone-popup-close"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Requirement */}
            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">达成条件</span>
                <span className="text-sm font-medium text-slate-700">
                  {selectedMilestone.requiredDays} 天学习
                </span>
              </div>
            </div>

            {/* Reward */}
            <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Gift className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-amber-800">奖励</div>
                <div className="text-lg font-bold text-amber-600">{selectedMilestone.xpReward} XP</div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 mb-4">
              {unlockedIds.has(selectedMilestone.id) ? (
                <>
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-green-600 font-medium">已解锁</span>
                </>
              ) : (
                <>
                  <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-slate-400 rounded-full" />
                  </div>
                  <span className="text-sm text-slate-500">未解锁</span>
                </>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={handleClosePopup}
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </>
  );
}