import { useMemo } from 'react';
import { BookOpen, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { storage } from '@/services/storage';
import { buildPersonalWordIndex } from '@/data/personalWordIndex';
import type { Sentence } from '@/data/types';

interface PersonalPracticePanelProps {
  onStartPractice: () => void;
}

/**
 * Personal Practice Panel component.
 * Displays personal word library statistics and provides entry point
 * to start practicing personal words.
 *
 * Shown only when the user has marked words in their personal dictionary.
 */
export function PersonalPracticePanel({ onStartPractice }: PersonalPracticePanelProps) {
  const personalWords = useMemo(() => storage.getPersonalWords(), []);
  const sentences = useMemo<Sentence[]>(() => {
    if (personalWords.length === 0) return [];
    const index = buildPersonalWordIndex(personalWords);
    return index.getAllAsSentences();
  }, [personalWords]);

  const wordCount = personalWords.length;

  // Don't render if no personal words
  if (wordCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-800">我的生词库</span>
            <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
              {wordCount} 词
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            {sentences.length > 0
              ? `可练习 ${Math.min(sentences.length, 10)} 题`
              : '暂无练习数据'}
          </p>
        </div>
      </div>
      <Button
        onClick={onStartPractice}
        size="sm"
        className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
      >
        <Play className="w-3.5 h-3.5" />
        开始练习
      </Button>
    </div>
  );
}