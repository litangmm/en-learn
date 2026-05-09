import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Trash2,
  ArrowLeft,
  Clock,
  Target,
  Trophy,
  CalendarX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { storage } from '@/services/storage';
import type { SessionHistory } from '@/data/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface HistoryViewProps {
  onBack: () => void;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getDateGroupLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, now)) return '今天';
  if (isSameDay(date, yesterday)) return '昨天';
  return '更早';
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}分${remainingSeconds}秒` : `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function HistoryView({ onBack }: HistoryViewProps) {
  const [history, setHistory] = useState<SessionHistory[]>(storage.getHistory());
  const [showClearDialog, setShowClearDialog] = useState(false);

  const groupedHistory = useMemo(() => {
    const groups = new Map<string, SessionHistory[]>();
    history.forEach((entry) => {
      const label = getDateGroupLabel(entry.timestamp);
      const list = groups.get(label) || [];
      list.push(entry);
      groups.set(label, list);
    });
    // Preserve order: 今天, 昨天, 更早
    const ordered = new Map<string, SessionHistory[]>();
    ['今天', '昨天', '更早'].forEach((label) => {
      const list = groups.get(label);
      if (list && list.length > 0) {
        ordered.set(label, list);
      }
    });
    return ordered;
  }, [history]);

  const handleClear = () => {
    storage.clearHistory();
    setHistory([]);
    setShowClearDialog(false);
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
            <History className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold text-slate-800">学习记录</h1>
          </div>
          <Badge variant="secondary" className="text-xs">
            {history.length} 次
          </Badge>
        </div>
        {history.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowClearDialog(true)}
            className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            清空记录
          </Button>
        )}
      </div>

      {/* Empty State */}
      {history.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <CalendarX className="w-16 h-16 mx-auto mb-4 text-slate-300" />
          <h2 className="text-lg font-medium text-slate-600 mb-2">暂无学习记录</h2>
          <p className="text-sm text-slate-400">完成练习后，学习记录会出现在这里</p>
        </motion.div>
      )}

      {/* History Groups */}
      <div className="space-y-8">
        {[...groupedHistory.entries()].map(([label, entries]) => (
          <div key={label}>
            <h2 className="text-sm font-medium text-slate-500 mb-3 sticky top-16 bg-slate-50 py-2 z-10">
              {label}
            </h2>
            <div className="space-y-3">
              <AnimatePresence>
                {entries.map((entry, idx) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: idx * 0.03 }}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          {entry.dictionaryName}
                        </Badge>
                        <span className="text-xs text-slate-400">{formatDate(entry.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-600">
                        <Trophy className="w-4 h-4" />
                        <span className="text-sm font-medium">{entry.score} 分</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-6 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Target className="w-3.5 h-3.5 text-slate-400" />
                        正确率 {entry.accuracy}%
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatDuration(entry.duration)}
                      </span>
                      <span>
                        {entry.correctCount}/{entry.totalQuestions} 题
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {/* Clear Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>清空学习记录</DialogTitle>
            <DialogDescription>
              确定要清空所有学习记录吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleClear}>
              清空
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
