import { BookOpen, History, Database, Brain, RefreshCw, Trophy, Award, TrendingUp, MoreHorizontal, AlertTriangle, Users, Target, ShieldAlert, Activity, User, Sparkles, Lightbulb } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdaptiveViewRegistry } from '@/hooks/useAdaptiveViewRegistry';
import { AdaptiveSuggestionPanel } from './AdaptiveSuggestionPanel';

export interface MoreMenuProps {
  mistakeCount: number;
  historyCount: number;
  reviewDueCount: number;
  unclaimedCount: number;
  unlockedCount: number;
  weaknessCount: number;
  isReviewMode: boolean;
  /** Whether the user is currently in practice mode (used for calibration visibility) */
  isPracticeMode?: boolean;
  onOpenMistakeBook: () => void;
  onOpenHistory: () => void;
  onOpenDataManager: () => void;
  onOpenSmartReview: () => void;
  onOpenChallenges: () => void;
  onOpenBadges: () => void;
  onOpenLeaderboard: () => void;
  onOpenWeakness: () => void;
  onOpenInvite?: () => void;
  onOpenGoals?: () => void;
  onOpenChurnDashboard?: () => void;
  onOpenLearnInsight?: () => void;
  onOpenLearnProfile?: () => void;
}

// ---------------------------------------------------------------------------
// View ID to Chinese Title Mapping
// ---------------------------------------------------------------------------

const VIEW_TITLE_MAP: Record<string, string> = {
  practice: '练习',
  review: '复习',
  'learn-insight': '学习洞察',
  learnInsight: '学习洞察',
  'learn-profile': '学习画像',
  learnProfile: '学习画像',
  challenge: '挑战',
  challenges: '挑战',
  badges: '成就',
  leaderboard: '排行',
};

/**
 * Get Chinese title from view ID
 */
function getViewTitle(viewId: string): string {
  return VIEW_TITLE_MAP[viewId] ?? viewId;
}

/**
 * Get priority label from priority score
 */
function getPriorityLabel(priority: number): string {
  if (priority >= 80) return '高优先级';
  if (priority >= 50) return '待复习';
  if (priority >= 20) return '可学习';
  return '低优先级';
}

// ---------------------------------------------------------------------------
// AdaptivePrioritySection Component
// ---------------------------------------------------------------------------

interface AdaptivePrioritySectionProps {
  views: Array<{ id: string; priority: number }>;
}

function AdaptivePrioritySection({ views }: AdaptivePrioritySectionProps) {
  // Show only top 3 views
  const displayViews = views.slice(0, 3);

  return (
    <div className="px-2 py-1.5">
      <div className="flex items-center gap-1.5 mb-1.5 text-xs text-muted-foreground">
        <Sparkles className="w-3 h-3" />
        <span className="font-medium">为你推荐</span>
      </div>
      <div className="space-y-0.5">
        {displayViews.map((view, index) => {
          const isLast = index === displayViews.length - 1;
          const prefix = isLast ? '└' : '├';
          const priorityLabel = getPriorityLabel(view.priority);

          return (
            <div key={view.id} className="flex items-center gap-2 text-xs pl-1">
              <span className="text-muted-foreground font-mono">{prefix}</span>
              <span className="flex-1 text-foreground">{getViewTitle(view.id)}</span>
              <span className="text-muted-foreground text-[10px]">({priorityLabel})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MoreMenu({
  mistakeCount,
  historyCount,
  reviewDueCount,
  unclaimedCount,
  unlockedCount,
  weaknessCount,
  isReviewMode,
  isPracticeMode = false,
  onOpenMistakeBook,
  onOpenHistory,
  onOpenDataManager,
  onOpenSmartReview,
  onOpenChallenges,
  onOpenBadges,
  onOpenLeaderboard,
  onOpenWeakness,
  onOpenInvite,
  onOpenGoals,
  onOpenChurnDashboard,
  onOpenLearnInsight,
  onOpenLearnProfile,
}: MoreMenuProps) {
  // Get top views from adaptive view registry (internally uses useViewRegistry which is available via ViewRegistryProvider)
  const { topViews: recommendedViews } = useAdaptiveViewRegistry(3);

  // Dialog state for adaptive suggestions
  const [showAdaptiveSuggestions, setShowAdaptiveSuggestions] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="text-slate-500 gap-2" data-testid="more-menu-trigger">
            <MoreHorizontal className="w-4 h-4" />
            <span className="hidden lg:inline">更多</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-48 sm:w-52" data-testid="more-menu-content">
          {/* Adaptive Priority Recommendation Section */}
          {recommendedViews && recommendedViews.length > 0 && (
            <>
              <AdaptivePrioritySection views={recommendedViews} />
              <DropdownMenuSeparator />
            </>
          )}
          {/* 学习建议 */}
          <DropdownMenuItem onClick={() => setShowAdaptiveSuggestions(true)} className="cursor-pointer" data-testid="menuitem-adaptive-suggestions">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span className="flex-1">学习建议</span>
          </DropdownMenuItem>
          {/* 错题本 */}
        <DropdownMenuItem onClick={onOpenMistakeBook} className="cursor-pointer" data-testid="menuitem-mistake-book">
          <BookOpen className="w-4 h-4 text-slate-500" />
          <span className="flex-1">错题本</span>
          {mistakeCount > 0 && (
            <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
              {mistakeCount}
            </Badge>
          )}
        </DropdownMenuItem>

        {/* 学习记录 */}
        <DropdownMenuItem onClick={onOpenHistory} className="cursor-pointer" data-testid="menuitem-history">
          <History className="w-4 h-4 text-slate-500" />
          <span className="flex-1">学习记录</span>
          {historyCount > 0 && (
            <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
              {historyCount}
            </Badge>
          )}
        </DropdownMenuItem>

        {/* 数据管理 */}
        <DropdownMenuItem onClick={onOpenDataManager} className="cursor-pointer" data-testid="menuitem-data-manager">
          <Database className="w-4 h-4 text-slate-500" />
          <span>数据管理</span>
        </DropdownMenuItem>

        {/* 智能复习 */}
        <DropdownMenuItem onClick={onOpenSmartReview} className="cursor-pointer" data-testid="menuitem-smart-review">
          {isReviewMode ? (
            <RefreshCw className="w-4 h-4 text-slate-500" />
          ) : (
            <Brain className="w-4 h-4 text-slate-500" />
          )}
          <span className="flex-1">智能复习</span>
          {reviewDueCount > 0 && (
            <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
              {reviewDueCount}
            </Badge>
          )}
        </DropdownMenuItem>

        {/* 薄弱点训练 */}
        <DropdownMenuItem onClick={onOpenWeakness} className="cursor-pointer" data-testid="menuitem-weakness">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="flex-1">薄弱点训练</span>
          {weaknessCount > 0 && (
            <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
              {weaknessCount}
            </Badge>
          )}
        </DropdownMenuItem>

        {/* 每日挑战 */}
        <DropdownMenuItem onClick={onOpenChallenges} className="cursor-pointer" data-testid="menuitem-challenges">
          <Trophy className="w-4 h-4 text-slate-500" />
          <span className="flex-1">每日挑战</span>
          {unclaimedCount > 0 && (
            <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
              {unclaimedCount}
            </Badge>
          )}
        </DropdownMenuItem>

        {/* 成就 */}
        <DropdownMenuItem onClick={onOpenBadges} className="cursor-pointer" data-testid="menuitem-badges">
          <Award className="w-4 h-4 text-slate-500" />
          <span className="flex-1">成就</span>
          {unlockedCount > 0 && (
            <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-xs">
              {unlockedCount}
            </Badge>
          )}
        </DropdownMenuItem>

        {/* 排行 */}
        <DropdownMenuItem onClick={onOpenLeaderboard} className="cursor-pointer" data-testid="menuitem-leaderboard">
          <TrendingUp className="w-4 h-4 text-slate-500" />
          <span>排行</span>
        </DropdownMenuItem>

        {/* 流失预警看板 */}
        {onOpenChurnDashboard && (
          <DropdownMenuItem onClick={onOpenChurnDashboard} className="cursor-pointer" data-testid="menuitem-churn-dashboard">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <span>流失预警看板</span>
          </DropdownMenuItem>
        )}

        {/* 学习目标 */}
        {onOpenGoals && (
          <DropdownMenuItem onClick={onOpenGoals} className="cursor-pointer" data-testid="menuitem-goals">
            <Target className="w-4 h-4 text-blue-500" />
            <span>学习目标</span>
          </DropdownMenuItem>
        )}

        {/* 学习洞察 */}
        {onOpenLearnInsight && (
          <DropdownMenuItem onClick={onOpenLearnInsight} className="cursor-pointer" data-testid="menuitem-learn-insight">
            <Activity className="w-4 h-4 text-green-500" />
            <span>学习洞察</span>
          </DropdownMenuItem>
        )}

        {/* 学习画像 */}
        {onOpenLearnProfile && (
          <DropdownMenuItem onClick={onOpenLearnProfile} className="cursor-pointer" data-testid="menuitem-learn-profile">
            <User className="w-4 h-4 text-purple-500" />
            <span>学习画像</span>
          </DropdownMenuItem>
        )}

        {/* 邀请好友 */}
        {onOpenInvite && (
          <DropdownMenuItem onClick={onOpenInvite} className="cursor-pointer" data-testid="menuitem-invite">
            <Users className="w-4 h-4 text-slate-500" />
            <span>邀请好友</span>
          </DropdownMenuItem>
        )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Adaptive Suggestions Dialog */}
      <Dialog open={showAdaptiveSuggestions} onOpenChange={setShowAdaptiveSuggestions}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              学习建议
            </DialogTitle>
          </DialogHeader>
          <AdaptiveSuggestionPanel isPracticeMode={isPracticeMode && !isReviewMode} />
        </DialogContent>
      </Dialog>
    </>
  );
}