import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Award,
  Loader2,
  Sparkles,
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

interface BadgeExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  badges: BadgeDefinition[];
  unlockedIds: Set<string>;
  onExport: (ref: HTMLElement | null) => void;
  isExporting: boolean;
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

function BadgeIconComponent({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] || Star;
  return <Icon className={className} size={32} />;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function BadgeExportPanel({
  isOpen,
  onClose,
  badges,
  unlockedIds,
  onExport,
  isExporting,
}: BadgeExportPanelProps) {
  const wallRef = useRef<HTMLDivElement>(null);
  const total = badges.length;
  const unlocked = unlockedIds.size;

  const handleExport = () => {
    onExport(wallRef.current);
  };

  // Group badges by category
  const grouped = new Map<string, BadgeDefinition[]>();
  for (const badge of badges) {
    const list = grouped.get(badge.category) || [];
    list.push(badge);
    grouped.set(badge.category, list);
  }
  const categories = Array.from(grouped.keys());

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          data-testid="badge-export-panel-overlay"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            data-testid="badge-export-panel-content"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Award className="text-amber-500" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">导出成就徽章</h2>
                  <p className="text-xs text-slate-500">保存为图片分享给朋友</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                data-testid="export-close-button"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Preview area with scroll */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Badge Wall Preview */}
              <div
                ref={wallRef}
                className="bg-white rounded-xl border border-slate-200 p-6"
                data-testid="badge-wall-preview"
              >
                {/* Brand Header */}
                <div className="flex items-center justify-center gap-2 mb-6 pb-4 border-b border-slate-100">
                  <Sparkles className="text-blue-500" size={20} />
                  <span className="text-lg font-semibold text-slate-800">en-learn 成就墙</span>
                  <div className="ml-auto px-2 py-1 bg-amber-100 rounded-full">
                    <span className="text-xs font-medium text-amber-700">
                      {unlocked}/{total}
                    </span>
                  </div>
                </div>

                {/* Badge Grid by Category */}
                <div className="space-y-6">
                  {categories.map((category) => {
                    const categoryBadges = grouped.get(category) || [];
                    return (
                      <div key={category}>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                          {CATEGORY_LABELS[category] || category}
                        </h3>
                        <div className="grid grid-cols-4 gap-3">
                          {categoryBadges.map((badge) => {
                            const isUnlocked = unlockedIds.has(badge.id);
                            return (
                              <div
                                key={badge.id}
                                className={`flex flex-col items-center text-center p-3 rounded-xl border-2 ${
                                  isUnlocked
                                    ? 'border-amber-300 bg-amber-50/50'
                                    : 'border-slate-200 bg-slate-50'
                                }`}
                                data-testid={`preview-badge-${badge.id}`}
                              >
                                <div className={`mb-2 ${isUnlocked ? 'text-amber-500' : 'text-slate-300'}`}>
                                  <BadgeIconComponent name={badge.icon} />
                                </div>
                                <h4
                                  className={`text-xs font-medium mb-1 ${
                                    isUnlocked ? 'text-slate-800' : 'text-slate-400'
                                  }`}
                                >
                                  {badge.title}
                                </h4>
                                {isUnlocked ? (
                                  <span className="text-xs text-amber-600">
                                    {formatDate(Date.now())}
                                  </span>
                                ) : (
                                  <div className="w-full h-1 bg-slate-200 rounded-full mt-1">
                                    <div className="h-full bg-slate-300 rounded-full" style={{ width: '30%' }} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-400">持续学习，解锁更多成就</p>
                </div>
              </div>
            </div>

            {/* Footer with Export Button */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                data-testid="export-cancel-button"
              >
                取消
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg font-medium text-sm transition-colors"
                data-testid="export-download-button"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>导出中...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>下载图片</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}