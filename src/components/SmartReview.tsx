import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  ArrowLeft,
  BookOpen,
  CalendarClock,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Mistake } from '@/data/types';
import type { Sentence } from '@/data/types';
import { loadDictionary } from '@/data/loader';
import { getDictionaryById } from '@/data/dictionaries';
import { storage } from '@/services/storage';

interface SmartReviewProps {
  onPracticeReview: (sentenceIds: string[], dictionaryId: string) => void;
  onBack: () => void;
}

function formatNextReview(nextReviewAt: number | undefined): string {
  if (nextReviewAt === undefined) {
    return '从未复习';
  }
  const diff = nextReviewAt - Date.now();
  if (diff <= 0) {
    return '已到期';
  }
  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours < 24) {
    return `${hours}小时后`;
  }
  const days = Math.floor(hours / 24);
  return `${days}天后`;
}

export function SmartReview({ onPracticeReview, onBack }: SmartReviewProps) {
  const reviewQueue = useMemo(() => storage.getReviewQueue(), []);
  const [sentenceMap, setSentenceMap] = useState<Map<string, Sentence>>(new Map());
  const [isLoading, setIsLoading] = useState(reviewQueue.length > 0);

  const groupedMistakes = useMemo(() => {
    const groups = new Map<string, Mistake[]>();
    reviewQueue.forEach((m) => {
      const list = groups.get(m.dictionaryId) || [];
      list.push(m);
      groups.set(m.dictionaryId, list);
    });
    return groups;
  }, [reviewQueue]);

  useEffect(() => {
    const dictIds = [...new Set(reviewQueue.map((m) => m.dictionaryId))];
    if (dictIds.length === 0) return;

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
  }, [reviewQueue]);

  const handlePracticeGroup = (dictId: string) => {
    const groupMistakes = groupedMistakes.get(dictId) || [];
    const sentenceIds = groupMistakes.map((m) => m.sentenceId);
    onPracticeReview(sentenceIds, dictId);
  };

  const handlePracticeAll = () => {
    const allDictIds = [...groupedMistakes.keys()];
    if (allDictIds.length === 1) {
      handlePracticeGroup(allDictIds[0]);
    }
  };

  const totalDue = reviewQueue.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold text-slate-800">智能复习</h1>
          </div>
          <Badge variant="secondary" className="text-xs">
            {totalDue} 题到期
          </Badge>
        </div>
        {groupedMistakes.size === 1 && totalDue > 0 && (
          <Button onClick={handlePracticeAll} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            全部复习
          </Button>
        )}
      </div>

      {/* Empty State */}
      {totalDue === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h2 className="text-lg font-medium text-slate-600 mb-2">今日无到期复习题目</h2>
          <p className="text-sm text-slate-400">继续保持，到期题目会自动出现在这里</p>
        </motion.div>
      )}

      {/* Review Groups */}
      <div className="space-y-8">
        {isLoading && totalDue > 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-slate-400">加载中...</p>
          </div>
        )}

        <AnimatePresence>
          {[...groupedMistakes.entries()].map(([dictId, dictMistakes]) => {
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
                    <span className="text-sm text-slate-500">{dictMistakes.length} 题</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePracticeGroup(dictId)}
                    className="gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    开始复习
                  </Button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
                  {dictMistakes.map((mistake) => {
                    const sentence = sentenceMap.get(`${dictId}-${mistake.sentenceId}`);
                    return (
                      <div key={mistake.sentenceId} className="p-4 flex items-center justify-between">
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
                            <p className="text-sm text-slate-400">题目 #{mistake.sentenceId}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 ml-4 shrink-0">
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <CalendarClock className="w-3 h-3" />
                            <span>{formatNextReview(mistake.nextReviewAt)}</span>
                          </div>
                          {mistake.reviewedCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              已复习 {mistake.reviewedCount} 次
                            </Badge>
                          )}
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
