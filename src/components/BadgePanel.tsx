import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  ChevronLeft,
  Footprints,
  CheckCircle2,
  Flame,
  Trophy,
  BookOpen,
  Star,
  RefreshCw,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { BADGE_DEFINITIONS } from '@/services/storage';
import { AchievementPanel } from './AchievementPanel';
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

interface BadgePanelProps {
  unlockedIds: Set<string>;
  unlockedAtMap?: Map<string, number>; // badge id -> unlocked timestamp
  getProgress: (id: string) => number;
  onBack: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  answer: '答题成就',
  streak: '连击成就',
  level: '等级成就',
  session: '练习成就',
  review: '复习成就',
  challenge: '挑战成就',
  special: '特殊成就',
};

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day} 解锁`;
}

function BadgeIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] || Star;
  return <Icon className={className} size={48} />;
}

export function BadgePanel({ unlockedIds, unlockedAtMap = new Map(), getProgress, onBack }: BadgePanelProps) {
  const [selectedBadge, setSelectedBadge] = useState<BadgeDefinition | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, BadgeDefinition[]>();
    for (const badge of BADGE_DEFINITIONS) {
      const list = map.get(badge.category) || [];
      list.push(badge);
      map.set(badge.category, list);
    }
    return map;
  }, []);

  const categories = Array.from(grouped.keys());
  const total = BADGE_DEFINITIONS.length;
  const unlocked = unlockedIds.size;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-800 mb-4 transition-colors"
          data-testid="back-button"
        >
          <ChevronLeft size={20} />
          <span className="text-sm">返回</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Award className="text-amber-500" size={28} />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">成就徽章</h1>
          <span className="ml-auto inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
            {unlocked}/{total}
          </span>
        </div>

        {/* Categories */}
        <div className="space-y-8">
          {categories.map((category) => {
            const badges = grouped.get(category) || [];
            return (
              <section key={category} data-testid={`category-${category}`}>
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  {CATEGORY_LABELS[category] || category}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {badges.map((badge) => {
                    const isUnlocked = unlockedIds.has(badge.id);
                    const progress = getProgress(badge.id);

                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`relative rounded-xl border-2 p-4 flex flex-col items-center text-center transition-colors cursor-pointer ${
                          isUnlocked
                            ? 'border-amber-400 bg-amber-50/50 hover:bg-amber-100'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                        data-testid={`badge-card-${badge.id}`}
                        onClick={() => setSelectedBadge(badge)}
                      >
                        <div className="mb-2">
                          <BadgeIcon
                            name={badge.icon}
                            className={isUnlocked ? 'text-amber-500' : 'text-slate-300'}
                          />
                        </div>
                        <h3
                          className={`font-semibold text-sm mb-1 ${
                            isUnlocked ? 'text-slate-800' : 'text-slate-400'
                          }`}
                        >
                          {badge.title}
                        </h3>
                        <p
                          className={`text-xs mb-2 ${
                            isUnlocked ? 'text-slate-600' : 'text-slate-400'
                          }`}
                        >
                          {badge.description}
                        </p>

                        {isUnlocked ? (
                          <span className="text-xs text-amber-600 font-medium mt-auto">
                            {formatDate(Date.now())}
                          </span>
                        ) : (
                          <div className="w-full mt-auto">
                            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-slate-300 rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                                data-testid={`progress-bar-${badge.id}`}
                              />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        {/* Achievement Detail Panel */}
        {selectedBadge && (
          <AchievementPanel
            badge={selectedBadge}
            isUnlocked={unlockedIds.has(selectedBadge.id)}
            progress={getProgress(selectedBadge.id)}
            unlockedAt={unlockedAtMap.get(selectedBadge.id)}
            onClose={() => setSelectedBadge(null)}
          />
        )}
      </div>
    </div>
  );
}
