import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Trophy,
  Flame,
  Target,
  Star,
  type LucideIcon,
} from 'lucide-react';
import type { AchievementMoment } from '@/data/types';

// Icon map for achievement moments
const MOMENT_ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Trophy,
  Flame,
  Target,
  Star,
} as const;

// Gradient themes for each achievement moment type
const MOMENT_THEMES: Record<string, { bg: string; text: string; accent: string }> = {
  'badge-unlock': { bg: 'bg-gradient-to-r from-purple-500 to-pink-500', text: 'text-white', accent: 'text-purple-200' },
  'level-up': { bg: 'bg-gradient-to-r from-amber-400 to-orange-500', text: 'text-white', accent: 'text-amber-200' },
  'streak-milestone': { bg: 'bg-gradient-to-r from-orange-400 to-amber-500', text: 'text-white', accent: 'text-orange-200' },
  'xp-milestone': { bg: 'bg-gradient-to-r from-blue-400 to-teal-500', text: 'text-white', accent: 'text-blue-200' },
  'perfect-session': { bg: 'bg-gradient-to-r from-emerald-400 to-green-500', text: 'text-white', accent: 'text-emerald-200' },
};

interface AchievementToastProps {
  moment: AchievementMoment | null;
  triggerKey?: string | number;
  onDismiss: () => void;
}

/**
 * Achievement Toast component.
 * Shows a brief, non-blocking toast notification for achievement moments.
 * Auto-dismisses after 3 seconds. Does NOT block the practice interface.
 */
export function AchievementToast({ moment, triggerKey, onDismiss }: AchievementToastProps) {
  useEffect(() => {
    if (!moment) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 3000);
    return () => clearTimeout(timer);
  }, [moment, onDismiss]);

  if (!moment) return null;

  const theme = MOMENT_THEMES[moment.type] || MOMENT_THEMES['badge-unlock'];
  const Icon = MOMENT_ICON_MAP[moment.badgeIcon || 'Sparkles'] || Sparkles;

  return (
    <AnimatePresence>
      <motion.div
        key={triggerKey ?? moment.id}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
        data-testid="achievement-toast"
      >
        <div className={`${theme.bg} rounded-xl shadow-lg px-4 py-3 flex items-center gap-3`}>
          <div className="flex-shrink-0">
            <Icon className={theme.accent} size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${theme.text} truncate`}>
              {moment.title}
            </p>
            {moment.subtitle && (
              <p className={`text-xs ${theme.accent} truncate`}>
                {moment.subtitle}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
