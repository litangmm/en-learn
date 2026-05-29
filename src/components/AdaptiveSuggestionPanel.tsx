import {
  Flame,
  Trophy,
  Moon,
  BookOpen,
  Target,
  Star,
  Crosshair,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  Gauge,
  type LucideIcon,
} from 'lucide-react';
import { useAdaptiveSuggestions } from '@/hooks/useAdaptiveSuggestions';
import { useAdaptiveDifficulty } from '@/hooks/useAdaptiveDifficulty';
import type { SuggestedAction } from '@/hooks/useAdaptiveSuggestions';
import type { SentenceDifficultyLevel } from '@/data/types';
import { storage } from '@/services/storage';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

// ---------------------------------------------------------------------------
// Icon Mapping
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  fire: Flame,
  trophy: Trophy,
  moon: Moon,
  book: BookOpen,
  'book-open': BookOpen,
  target: Target,
  star: Star,
  crosshair: Crosshair,
  flame: Flame,
  'refresh-cw': RefreshCw,
  alert: AlertTriangle,
  'trending-up': TrendingUp,
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdaptiveSuggestionPanelProps {
  /** Optional callback when an action is selected */
  onActionSelect?: (_: SuggestedAction) => void;
  /** Whether the user is in practice mode (shows calibration section when true) */
  isPracticeMode?: boolean;
}

// ---------------------------------------------------------------------------
// Priority Badge Component
// ---------------------------------------------------------------------------

interface PriorityBadgeProps {
  priority: number;
}

function getPriorityLabel(priority: number): string {
  if (priority >= 100) return '急';
  if (priority >= 80) return '高';
  if (priority >= 50) return '中';
  return '低';
}

function getPriorityVariant(priority: number): 'destructive' | 'secondary' | 'outline' {
  if (priority >= 80) return 'destructive';
  if (priority >= 50) return 'secondary';
  return 'outline';
}

function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <Badge
      data-testid="priority-badge"
      variant={getPriorityVariant(priority)}
      className="text-xs px-2 py-0.5"
    >
      {getPriorityLabel(priority)}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Action Item Component
// ---------------------------------------------------------------------------

interface ActionItemProps {
  action: SuggestedAction;
  onSelect?: (_: SuggestedAction) => void;
}

function ActionItem({ action, onSelect }: ActionItemProps) {
  const IconComponent = action.icon ? ICON_MAP[action.icon] : null;

  const handleClick = () => {
    if (onSelect) {
      onSelect(action);
    }
  };

  return (
    <div
      data-testid="action-item"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      data-view-id={action.viewId}
      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
    >
      {/* Icon */}
      <div
        data-testid="action-icon"
        className="flex-shrink-0 w-10 h-10 rounded-full bg-muted flex items-center justify-center"
      >
        {IconComponent ? (
          <IconComponent className="w-5 h-5 text-muted-foreground" />
        ) : (
          <Target className="w-5 h-5 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            data-testid="action-item-title"
            className="font-medium text-sm text-foreground"
          >
            {action.title}
          </span>
          <PriorityBadge priority={action.priority} />
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {action.description}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Difficulty Calibration Section
// ---------------------------------------------------------------------------

interface DifficultyCalibrationSectionProps {
  /** Current difficulty band */
  currentBand: SentenceDifficultyLevel;
  /** Target accuracy from config */
  targetAccuracy: number;
  /** Current actual accuracy (0-1) */
  actualAccuracy: number;
  /** Callback to manually adjust difficulty band */
  onAdjust: (_direction: 'up' | 'down') => void;
}

function getDifficultyLabel(band: SentenceDifficultyLevel): string {
  const labels: Record<SentenceDifficultyLevel, string> = {
    easy: '简单',
    normal: '适中',
    hard: '困难',
  };
  return labels[band];
}

function getDifficultyColor(band: SentenceDifficultyLevel): string {
  const colors: Record<SentenceDifficultyLevel, string> = {
    easy: 'text-green-500 bg-green-500/10',
    normal: 'text-amber-500 bg-amber-500/10',
    hard: 'text-red-500 bg-red-500/10',
  };
  return colors[band];
}

function DifficultyCalibrationSection({
  currentBand,
  targetAccuracy,
  actualAccuracy,
  onAdjust,
}: DifficultyCalibrationSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate progress percentage (how close actual is to target)
  const targetPercent = targetAccuracy * 100;
  const actualPercent = Math.round(actualAccuracy * 100);

  // Determine if user is performing above or below target
  const isAboveTarget = actualAccuracy > targetAccuracy + 0.05;
  const isBelowTarget = actualAccuracy < targetAccuracy - 0.05;

  // Progress bar shows actual accuracy vs target accuracy
  // If above target, progress bar is full (user can go harder)
  // If below target, progress bar shows how far they are from target
  const progressWidth = Math.min(
    100,
    Math.max(0, Math.round((actualAccuracy / targetAccuracy) * 100))
  );

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      data-testid="difficulty-calibration-section"
    >
      {/* Header with expand/collapse */}
      <div className="flex items-center justify-between px-4 py-3 border border-primary/20 rounded-lg bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">难度校准</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Current difficulty band badge */}
          <Badge
            data-testid="current-difficulty-badge"
            className={`${getDifficultyColor(currentBand)} text-xs`}
          >
            {getDifficultyLabel(currentBand)}
          </Badge>

          <CollapsibleTrigger asChild>
            <Button
              data-testid="calibration-expand-trigger"
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      <CollapsibleContent>
        <div className="mt-3 px-4 pb-3 space-y-3">
          {/* Calibration progress bar */}
          <div data-testid="calibration-progress" className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>正确率</span>
              <span>
                {actualPercent}% / {targetPercent}% (目标)
              </span>
            </div>

            {/* Progress bar container */}
            <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
              {/* Target marker */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-primary/50 z-10"
                style={{ left: `${targetPercent}%` }}
              />

              {/* Actual progress */}
              <div
                data-testid="calibration-progress-bar"
                className={`absolute top-0 bottom-0 rounded-full transition-all ${
                  isAboveTarget
                    ? 'bg-green-500'
                    : isBelowTarget
                    ? 'bg-red-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${progressWidth}%` }}
              />
            </div>

            {/* Status indicator */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {isAboveTarget
                  ? '表现优异，可以挑战更高难度'
                  : isBelowTarget
                  ? '需要更多练习巩固基础'
                  : '在目标范围内'}
              </span>
              {isAboveTarget ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : isBelowTarget ? (
                <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />
              ) : (
                <Minus className="w-3 h-3 text-amber-500" />
              )}
            </div>
          </div>

          {/* Difficulty adjustment buttons */}
          <div data-testid="difficulty-adjustment" className="flex items-center justify-center gap-3">
            <Button
              data-testid="adjust-down-button"
              variant="outline"
              size="sm"
              onClick={() => onAdjust('down')}
              className="flex items-center gap-1"
              title="降低难度 - 更多简单题目"
            >
              <Minus className="w-3 h-3" />
              <span>降低难度</span>
            </Button>

            <div className="text-xs text-muted-foreground text-center">
              <div className="font-medium">{getDifficultyLabel(currentBand)}</div>
              <div>当前难度</div>
            </div>

            <Button
              data-testid="adjust-up-button"
              variant="outline"
              size="sm"
              onClick={() => onAdjust('up')}
              className="flex items-center gap-1"
              title="提高难度 - 更多困难题目"
            >
              <Plus className="w-3 h-3" />
              <span>提高难度</span>
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// Skeleton Loading States
// ---------------------------------------------------------------------------

function StatusSummarySkeleton() {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <Skeleton data-testid="status-summary-skeleton" className="h-4 w-48" />
    </div>
  );
}

function ActionItemSkeleton() {
  return (
    <div
      data-testid="action-skeleton"
      className="flex items-start gap-3 p-3 rounded-lg border bg-card"
    >
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/**
 * AdaptiveSuggestionPanel displays the user's current learning state summary
 * and a list of prioritized suggested actions.
 *
 * Uses useAdaptiveSuggestions hook to get real-time recommendations based on:
 * - Flow state (focused/fatigued/normal)
 * - Recent accuracy
 * - XP/level progress
 * - Weakness patterns
 * - Streak status
 *
 * When isPracticeMode is true, also shows a DifficultyCalibrationSection for
 * manually adjusting difficulty and understanding calibration progress.
 */
export function AdaptiveSuggestionPanel({
  onActionSelect,
  isPracticeMode = false,
}: AdaptiveSuggestionPanelProps) {
  const { statusSummary, suggestedActions } = useAdaptiveSuggestions();

  // Get difficulty calibration data when in practice mode
  const { calibrateSessionBand, getUserDifficultyProfile } = useAdaptiveDifficulty();

  // Determine UI state based on data
  const isEmpty = suggestedActions.length === 0;
  const hasStatusSummary = statusSummary && statusSummary.trim().length > 0;

  // Show skeleton only if statusSummary is also empty (initial loading state)
  const isInitialLoading = isEmpty && !hasStatusSummary;

  // Get calibration data
  const currentBand = calibrateSessionBand();
  const userProfile = getUserDifficultyProfile();
  const adaptiveConfig = storage.getAdaptiveConfig();
  const { targetAccuracy } = adaptiveConfig.difficultyCalibration;

  // Calculate current actual accuracy from session history
  const recentHistory = userProfile.sessionAccuracyHistory.slice(-10);
  const actualAccuracy =
    recentHistory.length > 0
      ? recentHistory.reduce((sum, entry) => sum + entry.accuracy, 0) / recentHistory.length
      : 0.5; // Default to 50% if no history

  // Handle difficulty band adjustment
  const handleDifficultyAdjust = (direction: 'up' | 'down') => {
    const current = calibrateSessionBand();
    let newBand: SentenceDifficultyLevel;

    if (direction === 'up') {
      // Up = harder (more 'hard' questions)
      newBand = current === 'easy' ? 'normal' : current === 'normal' ? 'hard' : 'hard';
    } else {
      // Down = easier (more 'easy' questions)
      newBand = current === 'hard' ? 'normal' : current === 'normal' ? 'easy' : 'easy';
    }

    // Save the manual adjustment to storage for this session
    const profile = storage.getDifficultyProfile();
    const updatedProfile = {
      ...profile,
      inferredDifficultyBand: newBand,
    };
    storage.saveDifficultyProfile(updatedProfile);
  };

  return (
    <div
      data-testid="adaptive-suggestion-panel"
      className="w-full space-y-4"
    >
      {/* Header: Status Summary */}
      <div
        data-testid="status-summary"
        className="bg-gradient-to-r from-primary/5 to-transparent border border-primary/20 rounded-lg px-4 py-3"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-foreground">学习状态</span>
        </div>
        {hasStatusSummary ? (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {statusSummary}
          </p>
        ) : (
          <StatusSummarySkeleton />
        )}
      </div>

      {/* Difficulty Calibration Section (only in practice mode) */}
      {isPracticeMode && (
        <DifficultyCalibrationSection
          currentBand={currentBand}
          targetAccuracy={targetAccuracy}
          actualAccuracy={actualAccuracy}
          onAdjust={handleDifficultyAdjust}
        />
      )}

      {/* Actions Section */}
      <div data-testid="suggested-actions" className="space-y-2">
        <span className="text-sm font-semibold text-foreground">建议操作</span>

        {isInitialLoading ? (
          <div className="space-y-2">
            <ActionItemSkeleton />
            <ActionItemSkeleton />
            <ActionItemSkeleton />
          </div>
        ) : isEmpty ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            暂无建议
          </div>
        ) : (
          <div className="space-y-2">
            {suggestedActions.map((action) => (
              <ActionItem
                key={action.id}
                action={action}
                onSelect={onActionSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdaptiveSuggestionPanel;