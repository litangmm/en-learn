import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Trash2,
  CheckCircle,
  RotateCcw,
  BookX,
  Lightbulb,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Mistake } from '@/data/types';
import type { Sentence } from '@/data/types';
import { loadDictionary } from '@/data/loader';
import { getDictionaryById } from '@/data/dictionaries';
import { storage } from '@/services/storage';

interface MistakeBookProps {
  onPracticeMistakes: (sentenceIds: string[], dictionaryId: string) => void;
  onBack: () => void;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return '刚刚';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  const months = Math.floor(days / 30);
  return `${months}个月前`;
}

export function MistakeBook({ onPracticeMistakes, onBack }: MistakeBookProps) {
  const [mistakes, setMistakes] = useState<Mistake[]>(storage.getMistakes());
  const [sentenceMap, setSentenceMap] = useState<Map<string, Sentence>>(new Map());
  const [isLoading, setIsLoading] = useState(mistakes.length > 0);

  const groupedMistakes = useMemo(() => {
    const groups = new Map<string, Mistake[]>();
    mistakes.forEach((m) => {
      const list = groups.get(m.dictionaryId) || [];
      list.push(m);
      groups.set(m.dictionaryId, list);
    });
    return groups;
  }, [mistakes]);

  useEffect(() => {
    const dictIds = [...new Set(mistakes.map((m) => m.dictionaryId))];
    if (dictIds.length === 0) {
      return;
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
  }, [mistakes]);

  const handleDelete = (sentenceId: string) => {
    storage.removeMistake(sentenceId);
    setMistakes(storage.getMistakes());
  };

  const handleMarkReviewed = (sentenceId: string) => {
    storage.incrementReviewedCount(sentenceId);
    setMistakes(storage.getMistakes());
  };

  const handlePracticeGroup = (dictId: string) => {
    const groupMistakes = groupedMistakes.get(dictId) || [];
    const sentenceIds = groupMistakes.map((m) => m.sentenceId);
    onPracticeMistakes(sentenceIds, dictId);
  };

  const handlePracticeAll = () => {
    const allDictIds = [...groupedMistakes.keys()];
    if (allDictIds.length === 1) {
      handlePracticeGroup(allDictIds[0]);
    } else {
      // For multiple dictionaries, practice the first group
      // (MVP limitation: one dictionary at a time)
      handlePracticeGroup(allDictIds[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold text-slate-800">错题本</h1>
          </div>
          <Badge variant="secondary" className="text-xs">
            {mistakes.length} 题
          </Badge>
        </div>
        {mistakes.length > 0 && (
          <Button onClick={handlePracticeAll} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            练习错题
          </Button>
        )}
      </div>

      {/* Empty State */}
      {mistakes.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <BookX className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h2 className="text-lg font-medium text-slate-600 mb-2">暂无错题</h2>
          <p className="text-sm text-slate-400">完成练习后，答错的题目会出现在这里</p>
        </motion.div>
      )}

      {/* Mistake Groups */}
      <div className="space-y-8">
        {isLoading && mistakes.length > 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-slate-400">加载中...</p>
          </div>
        )}

        {[...groupedMistakes.entries()].map(([dictId, dictMistakes]) => {
          const dict = getDictionaryById(dictId);
          return (
            <div key={dictId}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
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
                  练习此组
                </Button>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {dictMistakes.map((mistake, idx) => {
                    const sentence = sentenceMap.get(`${dictId}-${mistake.sentenceId}`);
                    return (
                      <motion.div
                        key={mistake.sentenceId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
                      >
                        <div className="p-4">
                          {/* Sentence */}
                          {sentence && (
                            <div className="mb-3">
                              <p className="text-sm font-medium text-slate-700 mb-1">
                                {sentence.english}
                              </p>
                              <p className="text-xs text-slate-500">{sentence.chinese}</p>
                            </div>
                          )}

                          {/* Answers */}
                          <div className="flex flex-wrap gap-4 mb-3">
                            <div>
                              <p className="text-xs text-slate-400 mb-1">你的答案</p>
                              <div className="flex gap-1">
                                {mistake.wrongAnswers.map((ans, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="text-xs text-red-600 bg-red-50 border-red-200"
                                  >
                                    {ans || '(空)'}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 mb-1">正确答案</p>
                              <div className="flex gap-1">
                                {mistake.correctAnswers.map((ans, i) => (
                                  <Badge
                                    key={i}
                                    variant="outline"
                                    className="text-xs text-green-600 bg-green-50 border-green-200"
                                  >
                                    {ans}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Meta */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Lightbulb className="w-3 h-3" />
                                尝试 {mistake.attempts} 次
                              </span>
                              <span>{formatTimeAgo(mistake.timestamp)}</span>
                              {mistake.reviewedCount > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  已复习 {mistake.reviewedCount} 次
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleMarkReviewed(mistake.sentenceId)}
                                className="text-slate-400 hover:text-green-600"
                                title="标记为已复习"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDelete(mistake.sentenceId)}
                                className="text-slate-400 hover:text-red-600"
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
