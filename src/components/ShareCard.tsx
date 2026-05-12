import {
  Flame,
  Target,
  Trophy,
  Star,
  Footprints,
  CheckCircle2,
  BookOpen,
  RefreshCw,
  Award,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { ShareCardData } from '@/data/types';

const ICON_MAP: Record<string, LucideIcon> = {
  Footprints,
  CheckCircle2,
  Flame,
  Trophy,
  BookOpen,
  Star,
  RefreshCw,
  Target,
  Award,
};

interface BadgeIconProps {
  name: string;
  className?: string;
  size?: number;
}

function BadgeIcon({ name, className, size = 32 }: BadgeIconProps) {
  const Icon = ICON_MAP[name] || Sparkles;
  return <Icon className={className} size={size} />;
}

interface ShareCardProps {
  data: ShareCardData;
  /** Optional className for custom styling */
  className?: string;
}

/**
 * A shareable card component that displays learning achievements.
 * Designed for social sharing with mobile-first responsive layout.
 */
export function ShareCard({ data, className }: ShareCardProps) {
  const { xp, session, badges, rank, appName } = data;

  return (
    <Card
      className={`w-full max-w-md mx-auto overflow-hidden ${className}`}
      data-testid="share-card"
    >
      {/* Brand Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-white" size={20} />
            <span className="text-white font-semibold text-lg">{appName}</span>
          </div>
          <Badge
            variant="secondary"
            className="bg-white/20 text-white border-0 hover:bg-white/30"
          >
            成就分享
          </Badge>
        </div>
      </div>

      <CardContent className="p-5 space-y-5">
        {/* Level Section */}
        <div className="flex items-center gap-4">
          {/* Level Badge */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">Lv.{xp.currentLevel}</span>
            </div>
            <span className="text-xs text-slate-500 mt-1">当前等级</span>
          </div>

          {/* XP Progress */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">经验值进度</span>
              <span className="text-sm text-slate-500">{xp.levelProgress}%</span>
            </div>
            <Progress value={xp.levelProgress} className="h-2.5" />
            <span className="text-xs text-slate-400">
              总计 {xp.totalXP.toLocaleString()} XP
            </span>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-3">
          {/* Streak */}
          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Flame className="text-orange-500" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{session.streak}</p>
              <p className="text-xs text-slate-500">连续答题</p>
            </div>
          </div>

          {/* Accuracy */}
          <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Target className="text-emerald-500" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {Math.round(session.accuracy * 100)}%
              </p>
              <p className="text-xs text-slate-500">正确率</p>
            </div>
          </div>
        </div>

        {/* Score */}
        <div className="bg-slate-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">本次得分</span>
            <span className="text-2xl font-bold text-blue-600">{session.score}</span>
          </div>
        </div>

        {/* Badges Section */}
        {badges.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Award className="text-amber-500" size={16} />
              <span className="text-sm font-medium text-slate-700">获得成就</span>
            </div>
            <div className="flex items-center gap-3">
              {badges.slice(0, 3).map((badge) => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center gap-1 p-2 bg-amber-50 rounded-xl"
                >
                  <BadgeIcon
                    name={badge.icon}
                    className="text-amber-500"
                    size={28}
                  />
                </div>
              ))}
              {badges.length > 3 && (
                <div className="flex items-center justify-center w-14 h-14 bg-slate-100 rounded-xl">
                  <span className="text-sm font-medium text-slate-500">
                    +{badges.length - 3}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rank Section */}
        {rank > 0 && (
          <div className="flex items-center justify-center gap-2 py-2">
            <Trophy className="text-amber-500" size={20} />
            <span className="text-sm text-slate-600">排行榜</span>
            <Badge variant="default" className="bg-amber-500">
              第 {rank} 名
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ShareCard;
