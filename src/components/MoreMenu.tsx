import { BookOpen, History, Database, Brain, RefreshCw, Trophy, Award, TrendingUp, MoreHorizontal, AlertTriangle, Users, Target, ShieldAlert, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MoreMenuProps {
  mistakeCount: number;
  historyCount: number;
  reviewDueCount: number;
  unclaimedCount: number;
  unlockedCount: number;
  weaknessCount: number;
  isReviewMode: boolean;
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
}

export function MoreMenu({
  mistakeCount,
  historyCount,
  reviewDueCount,
  unclaimedCount,
  unlockedCount,
  weaknessCount,
  isReviewMode,
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
}: MoreMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="text-slate-500 gap-2" data-testid="more-menu-trigger">
          <MoreHorizontal className="w-4 h-4" />
          <span className="hidden lg:inline">更多</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-48 sm:w-52" data-testid="more-menu-content">
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

        {/* 邀请好友 */}
        {onOpenInvite && (
          <DropdownMenuItem onClick={onOpenInvite} className="cursor-pointer" data-testid="menuitem-invite">
            <Users className="w-4 h-4 text-slate-500" />
            <span>邀请好友</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}