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
  type LucideIcon,
} from 'lucide-react';
import { useAdaptiveSuggestions } from '@/hooks/useAdaptiveSuggestions';
import type { SuggestedAction } from '@/hooks/useAdaptiveSuggestions';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

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
 */
export function AdaptiveSuggestionPanel({ onActionSelect }: AdaptiveSuggestionPanelProps) {
  const { statusSummary, suggestedActions } = useAdaptiveSuggestions();

  // Determine UI state based on data
  const isEmpty = suggestedActions.length === 0;
  const hasStatusSummary = statusSummary && statusSummary.trim().length > 0;

  // Show skeleton only if statusSummary is also empty (initial loading state)
  const isInitialLoading = isEmpty && !hasStatusSummary;

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