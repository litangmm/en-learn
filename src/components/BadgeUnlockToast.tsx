import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Footprints,
  CheckCircle2,
  Flame,
  Trophy,
  BookOpen,
  Star,
  RefreshCw,
  Target,
  Share2,
  type LucideIcon,
} from 'lucide-react';
import type { BadgeDefinition } from '@/data/types';

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

interface BadgeUnlockToastProps {
  badge: BadgeDefinition | null;
  onDismiss: () => void;
  onShare?: () => void; // Optional share callback
}

function BadgeIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] || Star;
  return <Icon className={className} size={32} />;
}

export function BadgeUnlockToast({ badge, onDismiss, onShare }: BadgeUnlockToastProps) {
  useEffect(() => {
    if (!badge) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, 1500);

    return () => clearTimeout(timer);
  }, [badge, onDismiss]);

  if (!badge) return null;

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.();
    onDismiss();
  };

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          key={badge.id}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
          onClick={onDismiss}
          data-testid="badge-unlock-toast"
        >
          <div className="relative bg-white rounded-xl shadow-lg p-4 cursor-pointer">
            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 p-[2px]">
              <div className="w-full h-full bg-white rounded-[10px]" />
            </div>

            <div className="relative flex items-center gap-3">
              <div className="flex-shrink-0">
                <Sparkles className="text-amber-500" size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-amber-700 mb-1">解锁新成就！</p>
                <div className="flex items-center gap-2">
                  <BadgeIcon name={badge.icon} className="text-amber-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {badge.title}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {badge.description}
                    </p>
                  </div>
                </div>
              </div>
              {onShare && (
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex-shrink-0 p-2 min-h-11 min-w-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors active:bg-amber-100 touch-manipulation"
                  aria-label="分享成就"
                  data-testid="badge-share-button"
                >
                  <Share2 size={20} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
