import { Trophy, Target, Calendar, TrendingUp, Star, Radar, LineChart, Target as GoalIcon, Award } from 'lucide-react';
import { MilestoneCard } from './MilestoneCard';
import { AbilityRadar } from './AbilityRadar';
import { ProgressTrend } from './ProgressTrend';
import { WeeklyReportCard } from './WeeklyReportCard';
import { DictionaryProgressOverview } from './DictionaryProgressOverview';
import { ReviewStreakCalendar } from './ReviewStreakCalendar';
import { LearningTimeInsights } from './LearningTimeInsights';
import { GoalProgressCard } from './GoalProgressCard';
import { LongTermMilestoneCard } from './LongTermMilestoneCard';
import { MilestonePath } from './MilestonePath';
import { useProgressStats, getThisWeekReport, getDictionaryProgress, getReviewStreak } from '@/hooks/useProgressStats';
import { useMilestones } from '@/hooks/useMilestones';
import { getNextLevelXP } from '@/lib/utils';
import type { View } from './routing';
import type { Goal } from '@/data/types';

export interface ProgressHubProps {
  onNavigate: (_view: View) => void;
  /** Goals for progress display (optional, for integration) */
  goals?: Goal[];
}

export function ProgressHub({ onNavigate, goals }: ProgressHubProps) {
  const stats = useProgressStats();
  const {
    unlockedMilestones,
    totalLearningDays,
    nextMilestone,
    milestoneProgress,
    milestoneDefinitions,
  } = useMilestones();

  // Get data for new visualization cards
  const weeklyReport = getThisWeekReport();
  const dictionaryProgress = getDictionaryProgress();
  const reviewStreak = getReviewStreak(12);

  return (
    <div className="max-w-2xl mx-auto p-4 pb-20 md:pb-4" data-testid="progress-hub">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">学习进度</h1>
        <p className="text-sm text-slate-500 mt-1">查看你的学习轨迹</p>
      </div>

      {/* XP and Level Section */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5" />
              <span className="text-lg font-bold">等级 {stats.level}</span>
            </div>
            <p className="text-blue-100 text-sm mt-1">
              {stats.totalXP} XP 总经验值
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-blue-100">下一级还需</p>
            <p className="text-lg font-semibold">
              {stats.level >= 12 ? '已满级' : `${stats.currentXP} / ${getNextLevelXP(stats.level)} XP`}
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-2 bg-blue-400 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-300"
            style={{ width: `${stats.progressToNextLevel}%` }}
          />
        </div>
      </div>

      {/* Goals Progress Section (epic-037 iter-002) */}
      {goals && goals.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <GoalIcon className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-medium text-slate-700">学习目标</h2>
            <span className="text-xs text-slate-400 ml-auto">
              {goals.filter(g => g.completed).length}/{goals.length} 已完成
            </span>
          </div>

          {/* Daily Goals */}
          {goals.filter(g => g.period === 'daily').length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-slate-400 mb-2">今日目标</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {goals.filter(g => g.period === 'daily').map(goal => (
                  <GoalProgressCard
                    key={goal.id}
                    goal={goal}
                    mode="full"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Weekly Goals */}
          {goals.filter(g => g.period === 'weekly').length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-2">本周目标</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {goals.filter(g => g.period === 'weekly').map(goal => (
                  <GoalProgressCard
                    key={goal.id}
                    goal={goal}
                    mode="full"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Milestone Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Learning Days */}
        <MilestoneCard
          icon={<Calendar className="w-5 h-5" />}
          title="学习天数"
          value={stats.learningDays}
          subtitle="天"
          onClick={() => onNavigate('history')}
        />

        {/* Total Accuracy */}
        <MilestoneCard
          icon={<Target className="w-5 h-5" />}
          title="正确率"
          value={`${stats.totalAccuracy}%`}
          subtitle={`${stats.totalCorrect}/${stats.totalQuestions} 题`}
        />

        {/* Completed Dictionaries */}
        <MilestoneCard
          icon={<Trophy className="w-5 h-5" />}
          title="已完成词库"
          value={stats.completedDictionaries}
          subtitle="个"
          onClick={() => onNavigate('dictionary-browser')}
        />

        {/* Total XP */}
        <MilestoneCard
          icon={<TrendingUp className="w-5 h-5" />}
          title="累计 XP"
          value={stats.totalXP}
          subtitle="经验值"
        />
      </div>

      {/* Long Term Milestone Card (epic-037 iter-003) */}
      <div className="mb-4">
        <LongTermMilestoneCard
          totalLearningDays={totalLearningDays}
          unlockedMilestones={unlockedMilestones}
          nextMilestone={nextMilestone}
          milestoneProgress={milestoneProgress}
        />
      </div>

      {/* Milestone Path Section (epic-037 iter-003) */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-medium text-slate-700">成就之路</h2>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <MilestonePath
            milestoneDefinitions={milestoneDefinitions}
            unlockedMilestones={unlockedMilestones}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Ability Radar */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Radar className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-medium text-slate-700">能力雷达</h2>
          </div>
          <div className="flex justify-center">
            <AbilityRadar data={stats.modeAccuracy} size={200} />
          </div>
        </div>

        {/* Progress Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <LineChart className="w-4 h-4 text-green-500" />
            <h2 className="text-sm font-medium text-slate-700">学习趋势</h2>
          </div>
          <div className="flex justify-center">
            <ProgressTrend height={160} />
          </div>
        </div>
      </div>

      {/* New Visualization Cards */}
      <div className="space-y-4 mb-4">
        {/* Weekly Report Card */}
        <WeeklyReportCard report={weeklyReport} />

        {/* Learning Time Insights */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <LearningTimeInsights />
        </div>

        {/* Two-column layout for Dictionary Progress and Review Streak */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dictionary Progress Overview */}
          <DictionaryProgressOverview
            progress={dictionaryProgress}
            onDictionaryClick={() => onNavigate('dictionary-browser')}
          />

          {/* Review Streak Calendar */}
          <ReviewStreakCalendar calendar={reviewStreak} weeks={8} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <button
          onClick={() => onNavigate('history')}
          className="w-full py-3 px-4 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
        >
          查看学习历史
        </button>
        <button
          onClick={() => onNavigate('badges')}
          className="w-full py-3 px-4 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
        >
          查看成就徽章
        </button>
        <button
          onClick={() => onNavigate('profile')}
          className="w-full py-3 px-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-medium hover:bg-blue-100 transition-colors"
          data-testid="profile-button"
        >
          学习档案
        </button>
      </div>
    </div>
  );
}