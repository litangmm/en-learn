import { Star, Trophy, Target, Calendar, TrendingUp, Award, ChevronLeft, Zap } from 'lucide-react';
import { AbilityRadar } from './AbilityRadar';
import { ProgressTrend } from './ProgressTrend';
import { useProgressStats } from '@/hooks/useProgressStats';
import { useBadges } from '@/hooks/useBadges';
import type { View } from './routing';

interface LearningProfileProps {
  onNavigate: (view: View) => void;
  onBack: () => void;
}

export function LearningProfile({ onNavigate, onBack }: LearningProfileProps) {
  const stats = useProgressStats();
  const { badgeState, BADGE_DEFINITIONS } = useBadges();

  // Get recent badges (last 5 unlocked)
  const recentBadges = [...badgeState.unlocked]
    .sort((a, b) => b.unlockedAt - a.unlockedAt)
    .slice(0, 5)
    .map(unlocked => BADGE_DEFINITIONS.find(b => b.id === unlocked.id))
    .filter(Boolean);

  // Get unlocked count
  const totalBadges = BADGE_DEFINITIONS.length;
  const unlockedCount = badgeState.unlocked.length;

  // Calculate next level XP
  const getNextLevelXP = (currentLevel: number): number => {
    const thresholds = [0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700, 3300, 4000];
    if (currentLevel >= thresholds.length) return thresholds[thresholds.length - 1];
    return thresholds[currentLevel] - thresholds[currentLevel - 1];
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-4 md:py-8">
        {/* Header with back button */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors"
            data-testid="back-button"
          >
            <ChevronLeft size={20} />
            <span className="text-sm">返回</span>
          </button>
          <h1 className="text-xl font-bold text-slate-800">学习档案</h1>
        </div>

        {/* XP and Level Section - Hero */}
        <div className="mb-6 p-5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Star className="w-6 h-6" />
                <span className="text-2xl font-bold">等级 {stats.level}</span>
              </div>
              <p className="text-blue-100 text-sm mt-1">
                {stats.totalXP} XP 总经验值
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100">下一级还需</p>
              <p className="text-xl font-semibold">
                {stats.level >= 12 ? '已满级' : `${stats.currentXP} / ${getNextLevelXP(stats.level)} XP`}
              </p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-3 bg-blue-400 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-300"
              style={{ width: `${stats.progressToNextLevel}%` }}
            />
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {/* Learning Days */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <Calendar className="w-5 h-5 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-800">{stats.learningDays}</div>
            <div className="text-xs text-slate-500">学习天数</div>
          </div>

          {/* Accuracy */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <Target className="w-5 h-5 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-800">{stats.totalAccuracy}%</div>
            <div className="text-xs text-slate-500">正确率</div>
          </div>

          {/* Total Questions */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <TrendingUp className="w-5 h-5 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-800">{stats.totalQuestions}</div>
            <div className="text-xs text-slate-500">总题数</div>
          </div>

          {/* Badges */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <Award className="w-5 h-5 text-amber-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-slate-800">{unlockedCount}/{totalBadges}</div>
            <div className="text-xs text-slate-500">已解锁徽章</div>
          </div>
        </div>

        {/* Recent Badges */}
        {recentBadges.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">最近解锁</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {recentBadges.map((badge) => (
                badge && (
                  <div
                    key={badge.id}
                    className="flex-shrink-0 w-20 h-24 bg-amber-50 border-2 border-amber-400 rounded-xl flex flex-col items-center justify-center p-2"
                    data-testid={`badge-${badge.id}`}
                  >
                    <Trophy className="w-8 h-8 text-amber-500 mb-1" />
                    <span className="text-xs text-slate-700 text-center leading-tight">{badge.title}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Ability Radar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-medium text-slate-700">能力雷达</h2>
            </div>
            <div className="flex justify-center">
              <AbilityRadar data={stats.modeAccuracy} size={180} />
            </div>
          </div>

          {/* Progress Trend */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <h2 className="text-sm font-medium text-slate-700">学习趋势</h2>
            </div>
            <div className="flex justify-center">
              <ProgressTrend height={140} />
            </div>
          </div>
        </div>

        {/* Learning Summary */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">学习概览</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                完成词库
              </span>
              <span className="font-medium text-slate-800">{stats.completedDictionaries} 个</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 flex items-center gap-2">
                <Star className="w-4 h-4 text-blue-500" />
                总经验值
              </span>
              <span className="font-medium text-slate-800">{stats.totalXP} XP</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" />
                答对题数
              </span>
              <span className="font-medium text-slate-800">{stats.totalCorrect} 题</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={() => onNavigate('badges')}
            className="w-full py-3 px-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 font-medium hover:bg-amber-100 transition-colors"
          >
            查看全部成就徽章
          </button>
          <button
            onClick={() => onNavigate('efficiency')}
            className="w-full py-3 px-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-medium hover:bg-blue-100 transition-colors flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            查看学习效率
          </button>
          <button
            onClick={() => onNavigate('progress')}
            className="w-full py-3 px-4 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
          >
            查看学习进度详情
          </button>
        </div>
      </div>
    </div>
  );
}