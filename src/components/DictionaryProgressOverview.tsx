import { BookOpen, CheckCircle2, Circle, TrendingUp } from 'lucide-react';
import type { DictionaryProgress } from '@/hooks/useProgressStats';

/**
 * Props for the DictionaryProgressOverview component.
 */
export interface DictionaryProgressOverviewProps {
  /** Array of dictionary progress data */
  progress: DictionaryProgress[];
  /** Optional click handler for viewing dictionary details */
  onDictionaryClick?: (dictionaryId: string) => void;
}

/**
 * Single dictionary progress item component.
 */
function DictionaryProgressItem({
  progress,
  onClick,
}: {
  progress: DictionaryProgress;
  onClick?: (id: string) => void;
}) {
  const isStarted = progress.practicedSentences > 0;
  const isCompleted = progress.progress >= 100;

  return (
    <button
      onClick={() => onClick?.(progress.dictionaryId)}
      disabled={!onClick}
      className={`
        w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200
        ${onClick ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'}
      `}
      data-testid={`dictionary-progress-item-${progress.dictionaryId}`}
    >
      {/* Status Icon */}
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
        ${isCompleted ? 'bg-green-100 text-green-600' : isStarted ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}
      `}>
        {isCompleted ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : isStarted ? (
          <TrendingUp className="w-4 h-4" />
        ) : (
          <Circle className="w-4 h-4" />
        )}
      </div>

      {/* Progress Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-slate-700 truncate">
            {progress.dictionaryName}
          </span>
          <span className="text-xs text-slate-400 ml-2 flex-shrink-0">
            {progress.practicedSentences}/{progress.totalSentences} 题
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isCompleted ? 'bg-green-500' : isStarted ? 'bg-blue-500' : 'bg-slate-300'
            }`}
            style={{ width: `${progress.progress}%` }}
          />
        </div>
      </div>

      {/* Accuracy Badge (if practiced) */}
      {isStarted && (
        <div className="flex-shrink-0 text-xs text-slate-500">
          {progress.accuracy}%
        </div>
      )}
    </button>
  );
}

/**
 * Dictionary Progress Overview component for ProgressHub.
 * Shows a list of dictionaries with their practice progress and accuracy.
 */
export function DictionaryProgressOverview({
  progress,
  onDictionaryClick,
}: DictionaryProgressOverviewProps) {
  // Sort by progress (practiced first, then by name)
  const sortedProgress = [...progress].sort((a, b) => {
    // Put started dictionaries first
    if (a.practicedSentences > 0 && b.practicedSentences === 0) return -1;
    if (a.practicedSentences === 0 && b.practicedSentences > 0) return 1;
    // Then by name
    return a.dictionaryName.localeCompare(b.dictionaryName);
  });

  // Calculate summary stats
  const totalDictionaries = progress.length;
  const startedCount = progress.filter(p => p.practicedSentences > 0).length;
  const completedCount = progress.filter(p => p.progress >= 100).length;

  return (
    <div
      className="bg-white rounded-xl border border-slate-200 p-4"
      data-testid="dictionary-progress-overview"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
          <BookOpen className="w-4 h-4 text-green-500" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-700">词库进度</h3>
          <p className="text-xs text-slate-400">
            已开始 {startedCount}/{totalDictionaries} 个词库
            {completedCount > 0 && ` · 完成 ${completedCount} 个`}
          </p>
        </div>
      </div>

      {/* Progress List */}
      <div className="space-y-1">
        {sortedProgress.map(p => (
          <DictionaryProgressItem
            key={p.dictionaryId}
            progress={p}
            onClick={onDictionaryClick}
          />
        ))}
      </div>
    </div>
  );
}

export default DictionaryProgressOverview;