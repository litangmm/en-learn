import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Target,
  Zap,
  Clock,
  RotateCcw,
  CheckCircle2,
  Brain,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Sentence } from '@/data/types';
import type { Weakness } from '@/data/types';
import { loadDictionary } from '@/data/loader';
import { getDictionaryById } from '@/data/dictionaries';
import { useWeaknessStats } from '@/hooks/useWeaknessStats';
import { WeaknessTag } from './WeaknessTag';

interface WeaknessPanelProps {
  onPracticeWeaknesses: (_sentenceIds: string[], _dictionaryId: string) => void;
  onBack: () => void;
  /** If provided, only show weaknesses for this dictionary */
  dictionaryId?: string;
}

function formatAccuracy(accuracy: number): string {
  return `${Math.round(accuracy * 100)}%`;
}

function formatDays(days: number | null): string {
  if (days === null) return '从未复习';
  if (days === 0) return '今天';
  return `${days}天前`;
}

function getWeaknessIcon(weakType: string) {
  switch (weakType) {
    case 'high-error':
      return <Zap className="w-4 h-4 text-red-500" />;
    case 'low-accuracy':
      return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    case 'review-neglected':
      return <Clock className="w-4 h-4 text-slate-400" />;
    default:
      return <Target className="w-4 h-4 text-slate-400" />;
  }
}

export function WeaknessPanel({ onPracticeWeaknesses, onBack, dictionaryId }: WeaknessPanelProps) {
  const { stats, getAllWeaknesses, getByDictionary } = useWeaknessStats();
  const allWeaknesses = dictionaryId ? getByDictionary(dictionaryId) : getAllWeaknesses();

  const [sentenceMap, setSentenceMap] = useState<Map<string, Sentence>>(new Map());
  const [isLoading, setIsLoading] = useState(allWeaknesses.length > 0);

  const groupedWeaknesses = useMemo(() => {
    const groups = new Map<string, Weakness[]>();
    allWeaknesses.forEach((w) => {
      const list = groups.get(w.dictionaryId) || [];
      list.push(w);
      groups.set(w.dictionaryId, list);
    });
    return groups;
  }, [allWeaknesses]);

  useEffect(() => {
    const dictIds = [...new Set(allWeaknesses.map((w) => w.dictionaryId))];
    if (dictIds.length === 0) {
      // Defer setState to avoid synchronous call in effect
      const timer = setTimeout(() => setIsLoading(false), 0);
      return () => clearTimeout(timer);
    }

    let cancelled = false;

    Promise.all(dictIds.map((id) => loadDictionary(id)))
      .then((results) => {
        if (cancelled) return;
        const map = new Map<string, Sentence>();
        results.forEach((sentences, idx) => {
          const dictId = dictIds[idx];
          sentences.forEach((s) => {
            map.set(`${dictId}-${s.id}`, s);
          });
        });
        setSentenceMap(map);
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [allWeaknesses]);

  const handlePracticeGroup = (dictId: string) => {
    const groupWeaknesses = groupedWeaknesses.get(dictId) || [];
    const sentenceIds = groupWeaknesses.map((w) => w.sentenceId);
    onPracticeWeaknesses(sentenceIds, dictId);
  };

  const handlePracticeAll = () => {
    const allDictIds = [...groupedWeaknesses.keys()];
    if (allDictIds.length === 1) {
      handlePracticeGroup(allDictIds[0]);
    }
  };

  const totalWeak = allWeaknesses.length;
  const { byType, overallStrength } = stats;

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-500" data-testid="back-button">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-red-500" />
            <h1 className="text-xl font-bold text-slate-800">薄弱点训练</h1>
          </div>
          <Badge variant="destructive" className="text-xs">
            {totalWeak} 个薄弱点
          </Badge>
        </div>
        {groupedWeaknesses.size === 1 && totalWeak > 0 && (
          <Button onClick={handlePracticeAll} className="gap-2" size="sm">
            <RotateCcw className="w-4 h-4" />
            强化训练
          </Button>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-lg border border-slate-200 p-3 text-center">
          <p className="text-2xl font-bold text-slate-800">{totalWeak}</p>
          <p className="text-xs text-slate-500">薄弱点总数</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-3 text-center">
          <p className="text-2xl font-bold text-red-500">{byType['high-error'] ?? 0}</p>
          <p className="text-xs text-slate-500">高频错误</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-3 text-center">
          <p className="text-2xl font-bold text-orange-500">{byType['low-accuracy'] ?? 0}</p>
          <p className="text-xs text-slate-500">低正确率</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-3 text-center">
          <p className="text-2xl font-bold text-slate-500">{overallStrength}</p>
          <p className="text-xs text-slate-500">综合实力</p>
        </div>
      </div>

      {/* Empty State */}
      {totalWeak === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-400" />
          <h2 className="text-lg font-medium text-slate-600 mb-2">暂无薄弱点</h2>
          <p className="text-sm text-slate-400">继续保持，薄弱点会自动在这里标记</p>
        </motion.div>
      )}

      {/* Weakness Groups */}
      <div className="space-y-8">
        {isLoading && totalWeak > 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-slate-400">加载中...</p>
          </div>
        )}

        <AnimatePresence>
          {[...groupedWeaknesses.entries()].map(([dictId, dictWeaknesses]) => {
            const dict = getDictionaryById(dictId);
            return (
              <motion.div
                key={dictId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <Badge variant="outline" className="text-xs">
                      {dict?.name || dictId}
                    </Badge>
                    <span className="text-sm text-slate-500">{dictWeaknesses.length} 个薄弱点</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePracticeGroup(dictId)}
                    className="gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    强化训练
                  </Button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
                  {dictWeaknesses.map((weakness) => {
                    const sentence = sentenceMap.get(`${dictId}-${weakness.sentenceId}`);
                    return (
                      <div
                        key={weakness.sentenceId}
                        className="p-4 flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          {sentence && (
                            <div className="mb-1">
                              <p className="text-sm font-medium text-slate-700 truncate">
                                {sentence.english}
                              </p>
                              <p className="text-xs text-slate-500 truncate">{sentence.chinese}</p>
                            </div>
                          )}
                          {!sentence && (
                            <p className="text-sm text-slate-400">题目 #{weakness.sentenceId}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          <WeaknessTag weakType={weakness.weakType} />
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            {getWeaknessIcon(weakness.weakType)}
                          </div>
                          <span className="text-xs text-slate-500">
                            {formatAccuracy(weakness.accuracy)}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDays(weakness.daysSinceLastReview)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
