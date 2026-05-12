import { motion } from 'framer-motion';
import { ChevronLeft, TrendingUp, Medal } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  LeaderboardCategory,
  LeaderboardTimeFilter,
  LeaderboardEntry,
} from '@/data/types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  category?: LeaderboardCategory;
  timeFilter?: LeaderboardTimeFilter;
  loading?: boolean;
  onCategoryChange: (_category: LeaderboardCategory) => void;
  onTimeFilterChange: (_filter: LeaderboardTimeFilter) => void;
  onBack: () => void;
}

const CATEGORY_CONFIG: Record<
  LeaderboardCategory,
  { label: string; unit: string; valueKey: keyof LeaderboardEntry }
> = {
  score: { label: '总分榜', unit: '分', valueKey: 'score' },
  accuracy: { label: '准确率榜', unit: '%', valueKey: 'accuracy' },
  speed: { label: '速通榜', unit: '词/分', valueKey: 'speed' },
};

const TIME_FILTER_CONFIG: Record<LeaderboardTimeFilter, string> = {
  today: '今日',
  week: '本周',
  all: '全部',
};

function getRankStyle(rank: number) {
  if (rank === 1) {
    return {
      cardBg: 'bg-amber-50',
      cardBorder: 'border-amber-200',
      circleBg: 'bg-amber-100',
      circleText: 'text-amber-600',
      medal: true,
    };
  }
  if (rank === 2) {
    return {
      cardBg: 'bg-slate-50',
      cardBorder: 'border-slate-200',
      circleBg: 'bg-slate-100',
      circleText: 'text-slate-600',
      medal: true,
    };
  }
  if (rank === 3) {
    return {
      cardBg: 'bg-orange-50',
      cardBorder: 'border-orange-200',
      circleBg: 'bg-orange-100',
      circleText: 'text-orange-600',
      medal: true,
    };
  }
  return {
    cardBg: 'bg-white',
    cardBorder: 'border-slate-200',
    circleBg: 'bg-slate-100',
    circleText: 'text-slate-500',
    medal: false,
  };
}

function formatValue(entry: LeaderboardEntry, category: LeaderboardCategory): string {
  const config = CATEGORY_CONFIG[category];
  const value = entry[config.valueKey];
  if (category === 'accuracy') {
    return `${value}%`;
  }
  if (category === 'speed') {
    return `${value} 词/分`;
  }
  return `${value}分`;
}

export function Leaderboard({
  entries,
  category,
  timeFilter,
  loading = false,
  onCategoryChange,
  onTimeFilterChange,
  onBack,
}: LeaderboardProps) {
  // Skeleton rows matching the card styling
  const skeletonRows = [1, 2, 3, 4, 5];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-800 transition-colors"
            data-testid="back-button"
          >
            <ChevronLeft size={20} />
            <span className="text-sm">返回</span>
          </button>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">
              学习排行榜
            </h1>
          </div>
        </div>

        {/* Data Scope Indicator */}
        <div className="mb-4 ml-8">
          <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
            <span className="font-medium text-slate-500">数据范围：</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${timeFilter === 'today' ? 'bg-blue-100 text-blue-700 font-semibold' : 'bg-slate-100 text-slate-500'}`}>
              今日
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${timeFilter === 'week' ? 'bg-blue-100 text-blue-700 font-semibold' : 'bg-slate-100 text-slate-500'}`}>
              本周
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${timeFilter === 'all' ? 'bg-blue-100 text-blue-700 font-semibold' : 'bg-slate-100 text-slate-500'}`}>
              全部
            </span>
            <span className="text-slate-300">|</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
              本地数据
            </span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-slate-200 mb-4">
          {(Object.keys(CATEGORY_CONFIG) as LeaderboardCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`relative px-4 py-2 text-sm font-medium transition-colors ${
                category === cat
                  ? 'text-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              data-testid={`category-tab-${cat}`}
            >
              {CATEGORY_CONFIG[cat].label}
              {category === cat && (
                <motion.div
                  layoutId="category-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                />
              )}
            </button>
          ))}
        </div>

        {/* Time Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(Object.keys(TIME_FILTER_CONFIG) as LeaderboardTimeFilter[]).map(
            (filter) => (
              <button
                key={filter}
                onClick={() => onTimeFilterChange(filter)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                  timeFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-500 border border-slate-200 hover:text-slate-700'
                }`}
                data-testid={`time-tab-${filter}`}
              >
                {TIME_FILTER_CONFIG[filter]}
              </button>
            ),
          )}
        </div>

        {/* Loading Skeleton */}
        {loading && (
          <div className="space-y-3">
            {skeletonRows.map((idx) => (
              <motion.div
                key={`skeleton-${idx}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4"
                data-testid={`leaderboard-skeleton-${idx}`}
              >
                {/* Rank Circle Skeleton */}
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />

                {/* Dictionary Name Skeleton */}
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>

                {/* Score Value Skeleton */}
                <Skeleton className="h-6 w-20 shrink-0" />
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && entries.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
            data-testid="leaderboard-empty"
          >
            <TrendingUp className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h2 className="text-lg font-medium text-slate-600 mb-2">暂无记录</h2>
            <p className="text-sm text-slate-400">
              完成练习后将在这里显示排行榜数据
            </p>
          </motion.div>
        )}

        {/* Ranked List */}
        {!loading && (
          <div className="space-y-3">
          {entries.map((entry, idx) => {
            const style = getRankStyle(entry.rank);
            const valueLabel = category ? CATEGORY_CONFIG[category].label.replace('榜', '') : '';

            return (
              <motion.div
                key={entry.sessionId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`${style.cardBg} rounded-xl border ${style.cardBorder} p-4 flex items-center gap-4`}
                data-testid={`leaderboard-entry-${entry.rank}`}
              >
                {style.medal && (
                  <div data-testid={`medal-rank-${entry.rank}`} className="contents" />
                )}
                {/* Rank Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${style.circleBg} ${style.circleText}`}
                >
                  {entry.rank <= 3 ? (
                    <Medal className="w-5 h-5" />
                  ) : (
                    entry.rank
                  )}
                </div>

                {/* Dictionary Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {entry.dictionaryName}
                  </p>
                  <p className="text-xs text-slate-400">{valueLabel}</p>
                </div>

                {/* Score Value */}
                <div className="text-right shrink-0">
                  <p className="text-base font-bold text-slate-800">
                    {category && formatValue(entry, category)}
                  </p>
                </div>
              </motion.div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
}
