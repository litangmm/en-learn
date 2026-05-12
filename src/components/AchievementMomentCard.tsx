import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Trophy,
  Flame,
  Target,
  Star,
  Share2,
} from 'lucide-react';
import { ShareDialog } from './ShareDialog';
import type { AchievementMoment } from '@/data/types';

// Icon map moved outside component to avoid recreation on every render
const ICON_MAP = {
  Sparkles,
  Trophy,
  Flame,
  Target,
  Star,
} as const;

// Template configurations for each achievement moment type
const TEMPLATE_CONFIG = {
  'badge-unlock': {
    gradient: 'from-purple-500 to-pink-500',
    icon: Sparkles,
    emoji: '🎖️',
  },
  'level-up': {
    gradient: 'from-amber-400 to-orange-500',
    icon: Trophy,
    emoji: '🏆',
  },
  'streak-milestone': {
    gradient: 'from-orange-400 to-amber-500',
    icon: Flame,
    emoji: '🔥',
  },
  'xp-milestone': {
    gradient: 'from-blue-400 to-teal-500',
    icon: Target,
    emoji: '🎯',
  },
  'perfect-session': {
    gradient: 'from-emerald-400 to-green-500',
    icon: Star,
    emoji: '⭐',
  },
} as const;

interface TemplateIconProps {
  name: string;
  className?: string;
  size?: number;
}

function TemplateIcon({ name, className, size = 24 }: TemplateIconProps) {
  const Icon = ICON_MAP[name as keyof typeof ICON_MAP] || Star;
  return <Icon className={className} size={size} />;
}

interface AchievementMomentCardProps {
  /** The achievement moment to display */
  moment: AchievementMoment;
  /** Optional trigger key to force re-mount for animation replay */
  triggerKey?: string;
}

/**
 * Achievement Moment Card component.
 * Renders one of 5 template types based on the moment type.
 * Each template has a unique gradient theme, icon, headline, and data display.
 */
export function AchievementMomentCard({
  moment,
  triggerKey,
}: AchievementMomentCardProps) {
  const [showDialog, setShowDialog] = useState(false);

  const template = TEMPLATE_CONFIG[moment.type] || TEMPLATE_CONFIG['badge-unlock'];
  const IconComponent = template.icon;

  return (
    <>
      <AnimatePresence>
        <motion.div
          key={triggerKey ?? moment.id}
          initial={{ y: 50, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 30, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="w-full max-w-sm mx-auto"
          data-testid="achievement-moment-card"
        >
          <div
            className={`relative bg-gradient-to-br ${template.gradient} rounded-2xl shadow-xl overflow-hidden`}
          >
            {/* Header with gradient background */}
            <div className="px-5 py-6 text-white">
              <div className="flex items-center justify-between mb-4">
                {/* Icon */}
                <div className="flex items-center justify-center w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl">
                  <IconComponent size={32} className="text-white" />
                </div>
                {/* Emoji badge */}
                <div className="text-3xl">{template.emoji}</div>
              </div>

              {/* Headline */}
              <h2 className="text-xl font-bold mb-2 drop-shadow-sm">
                {moment.title}
              </h2>

              {/* Subtitle */}
              {moment.subtitle && (
                <p className="text-white/90 text-sm leading-relaxed">
                  {moment.subtitle}
                </p>
              )}
            </div>

            {/* Content area with stats */}
            <div className="bg-white px-5 py-5 space-y-3">
              {/* Badge info (for badge-unlock type) */}
              {moment.type === 'badge-unlock' && moment.badgeTitle && (
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                  <TemplateIcon
                    name={moment.badgeIcon ?? 'Sparkles'}
                    className="text-purple-500"
                    size={28}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {moment.badgeTitle}
                    </p>
                    <p className="text-xs text-slate-500">
                      成就已解锁
                    </p>
                  </div>
                </div>
              )}

              {/* Level info (for level-up type) */}
              {moment.type === 'level-up' && moment.level && (
                <div className="flex items-center justify-center gap-3 p-3 bg-amber-50 rounded-xl">
                  <Trophy className="text-amber-500" size={28} />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-600">
                      Lv.{moment.level}
                    </p>
                    <p className="text-xs text-amber-600/70">
                      等级提升
                    </p>
                  </div>
                </div>
              )}

              {/* Streak info (for streak-milestone type) */}
              {moment.type === 'streak-milestone' && moment.streak && (
                <div className="flex items-center justify-center gap-3 p-3 bg-orange-50 rounded-xl">
                  <Flame className="text-orange-500" size={28} />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {moment.streak} 天
                    </p>
                    <p className="text-xs text-orange-600/70">
                      连续学习
                    </p>
                  </div>
                </div>
              )}

              {/* XP milestone info */}
              {moment.type === 'xp-milestone' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl">
                    <Target className="text-blue-500" size={20} />
                    <div>
                      <p className="text-lg font-bold text-blue-600">
                        {moment.xp?.toLocaleString()}
                      </p>
                      <p className="text-xs text-blue-600/70">XP</p>
                    </div>
                  </div>
                  {moment.totalCorrect !== undefined && (
                    <div className="flex items-center gap-2 p-3 bg-teal-50 rounded-xl">
                      <Star className="text-teal-500" size={20} />
                      <div>
                        <p className="text-lg font-bold text-teal-600">
                          {moment.totalCorrect}
                        </p>
                        <p className="text-xs text-teal-600/70">答对</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Perfect session info */}
              {moment.type === 'perfect-session' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl">
                    <Star className="text-emerald-500" size={20} />
                    <div>
                      <p className="text-lg font-bold text-emerald-600">
                        100%
                      </p>
                      <p className="text-xs text-emerald-600/70">正确率</p>
                    </div>
                  </div>
                  {moment.streak !== undefined && moment.streak > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl">
                      <Flame className="text-emerald-500" size={20} />
                      <div>
                        <p className="text-lg font-bold text-emerald-600">
                          {moment.streak}
                        </p>
                        <p className="text-xs text-emerald-600/70">连击</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Share button */}
              <button
                type="button"
                onClick={() => setShowDialog(true)}
                className="w-full flex items-center justify-center gap-2 mt-4 p-3 min-h-[48px] bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 active:from-slate-900 active:to-slate-950 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg active:shadow-md touch-manipulation"
                aria-label="分享成就"
                data-testid="achievement-share-button"
              >
                <Share2 size={20} />
                <span>分享成就</span>
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Share dialog */}
      <ShareDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        sessionResult={undefined}
        triggerType={`achievement-${moment.type}`}
      />
    </>
  );
}

export default AchievementMomentCard;