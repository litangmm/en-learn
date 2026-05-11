import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, CheckCircle2, Flame, Trophy, BookOpen, Star, RefreshCw, Target, Footprints } from 'lucide-react';
import type { BadgeDefinition } from '@/data/types';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  Footprints,
  CheckCircle2,
  Flame,
  Trophy,
  BookOpen,
  Star,
  RefreshCw,
  Target,
};

interface AchievementPanelProps {
  badge: BadgeDefinition | null;
  isUnlocked: boolean;
  progress: number; // 0-100
  unlockedAt?: number; // timestamp if unlocked
  onClose: () => void;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
}

function getConditionLabel(conditionType: string, conditionValue: number): string {
  switch (conditionType) {
    case 'total_answered':
      return `累计答题 ${conditionValue} 题`;
    case 'total_correct':
      return `答对 ${conditionValue} 题`;
    case 'max_streak':
      return `连击 ${conditionValue} 题`;
    case 'level':
      return `达到 ${conditionValue} 级`;
    case 'total_sessions':
      return `完成 ${conditionValue} 次练习`;
    case 'perfect_sessions':
      return `满分完成 ${conditionValue} 次`;
    case 'total_reviews':
      return `复习 ${conditionValue} 次`;
    case 'total_challenges':
      return `完成 ${conditionValue} 个挑战`;
    default:
      return `达成 ${conditionValue} 目标`;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getConditionTips(conditionType: string, _conditionValue: number): string[] {
  switch (conditionType) {
    case 'total_answered':
      return ['坚持每日练习，累积答题数量', '选择不同词库进行多样化学习'];
    case 'total_correct':
      return ['保证答题正确率，每题都要认真思考', '复习错题，减少重复错误'];
    case 'max_streak':
      return ['保持专注，一口气完成更多题目', '连击越高奖励越多'];
    case 'level':
      return ['通过学习和练习积累经验值', '每答对一题都能获得 XP'];
    case 'total_sessions':
      return ['每天完成一次完整的练习', '每次完整练习都能获得奖励'];
    case 'perfect_sessions':
      return ['答题时仔细检查，确保全对', '减少尝试次数，追求一击即中'];
    case 'total_reviews':
      return ['定期复习，错题要及时回顾', '使用智能复习功能不错过任何薄弱点'];
    case 'total_challenges':
      return ['每日挑战是获取额外 XP 的好机会', '完成每日挑战任务'];
    default:
      return ['坚持学习，离目标越来越近'];
  }
}

export function AchievementPanel({ badge, isUnlocked, progress, unlockedAt, onClose }: AchievementPanelProps) {
  const Icon = badge ? (ICON_MAP[badge.icon] || Star) : Star;

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={onClose}
          data-testid="achievement-panel-overlay"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            data-testid="achievement-panel-content"
          >
            {/* Header with gradient */}
            <div className={`relative px-6 pt-8 pb-6 ${isUnlocked ? 'bg-gradient-to-br from-amber-400 to-amber-500' : 'bg-gradient-to-br from-slate-300 to-slate-400'}`}>
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                data-testid="close-button"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              {/* Badge Icon */}
              <div className="flex justify-center mb-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isUnlocked ? 'bg-white/20' : 'bg-slate-200/50'}`}>
                  <Icon className={`w-10 h-10 ${isUnlocked ? 'text-white' : 'text-slate-400'}`} />
                </div>
              </div>

              {/* Title */}
              <h2 className={`text-xl font-bold text-center ${isUnlocked ? 'text-white' : 'text-slate-600'}`}>
                {badge.title}
              </h2>

              {/* Unlocked badge */}
              {isUnlocked && (
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Award className="w-4 h-4 text-amber-100" />
                  <span className="text-sm text-amber-100">已解锁</span>
                </div>
              )}
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              {/* Description */}
              <p className="text-sm text-slate-600 mb-4 text-center">
                {badge.description}
              </p>

              {/* Condition */}
              <div className="bg-slate-50 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-500">获取条件</span>
                </div>
                <p className="text-sm font-medium text-slate-700">
                  {getConditionLabel(badge.conditionType, badge.conditionValue)}
                </p>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-500">当前进度</span>
                  <span className="text-xs font-medium text-slate-700">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isUnlocked ? 'bg-amber-400' : 'bg-blue-400'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                    data-testid="progress-bar"
                  />
                </div>
              </div>

              {/* Unlocked date */}
              {isUnlocked && unlockedAt && (
                <div className="text-center mb-4">
                  <span className="text-xs text-amber-600">
                    {formatDate(unlockedAt)} 解锁
                  </span>
                </div>
              )}

              {/* Tips */}
              {!isUnlocked && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium text-blue-700">达成建议</span>
                  </div>
                  <ul className="space-y-1">
                    {getConditionTips(badge.conditionType, 0).map((tip, index) => (
                      <li key={index} className="text-xs text-blue-600 flex items-start gap-1">
                        <span className="text-blue-400">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}