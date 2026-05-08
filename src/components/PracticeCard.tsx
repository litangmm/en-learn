import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, CheckCircle2, XCircle, Lightbulb, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Sentence } from '@/data/types';

interface PracticeCardProps {
  sentence: Sentence;
  inputs: string[];
  showResult: boolean;
  isCorrect: boolean;
  attempts: number;
  isSpeaking: boolean;
  onInputChange: (index: number, value: string) => void;
  onCheck: () => void;
  onNext: () => void;
  onRetry: () => void;
  onSpeak: () => void;
}

export function PracticeCard({
  sentence,
  inputs,
  showResult,
  isCorrect,
  attempts,
  isSpeaking,
  onInputChange,
  onCheck,
  onNext,
  onRetry,
  onSpeak,
}: PracticeCardProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first empty input on mount
  useEffect(() => {
    const firstEmptyIndex = inputs.findIndex(i => !i);
    if (firstEmptyIndex >= 0) {
      inputRefs.current[firstEmptyIndex]?.focus();
    } else if (inputs.length > 0 && !showResult) {
      inputRefs.current[inputs.length - 1]?.focus();
    }
  }, [sentence, showResult]);

  // Handle Enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent, _index: number) => {
    if (e.key === 'Enter') {
      if (!showResult) {
        onCheck();
      } else if (isCorrect) {
        onNext();
      } else {
        onRetry();
      }
    }
  }, [showResult, isCorrect, onCheck, onNext, onRetry]);

  // Parse English sentence and replace blanks with inputs
  const renderSentenceWithBlanks = () => {
    let parts: (string | React.ReactNode)[] = [sentence.english];
    
    sentence.blanks.forEach((blank, idx) => {
      const newParts: (string | React.ReactNode)[] = [];
      const wordRegex = new RegExp(`\\b${blank.word}\\b`, 'gi');
      
      parts.forEach((part) => {
        if (typeof part !== 'string') {
          newParts.push(part);
          return;
        }
        
        const segments = part.split(wordRegex);
        if (segments.length > 1) {
          segments.forEach((segment, segIdx) => {
            newParts.push(segment);
            if (segIdx < segments.length - 1) {
              const hasError = showResult && !isCorrect && inputs[idx]?.toLowerCase().trim() !== blank.word.toLowerCase();
              const hasSuccess = showResult && inputs[idx]?.toLowerCase().trim() === blank.word.toLowerCase();
              
              newParts.push(
                <span key={`blank-${idx}-${segIdx}`} className="inline-block mx-1">
                  <Input
                    ref={el => { inputRefs.current[idx] = el; }}
                    type="text"
                    value={inputs[idx] || ''}
                    onChange={e => onInputChange(idx, e.target.value)}
                    onKeyDown={e => handleKeyDown(e, idx)}
                    disabled={showResult && isCorrect}
                    placeholder={`${idx + 1}`}
                    className={`
                      inline-block w-32 text-center font-medium
                      transition-all duration-300 border-2
                      ${hasSuccess 
                        ? 'border-green-500 bg-green-50 text-green-700' 
                        : hasError
                          ? 'border-red-400 bg-red-50 text-red-700'
                          : 'border-slate-300 focus:border-blue-500 hover:border-slate-400'
                      }
                    `}
                  />
                  {showResult && !isCorrect && (
                    <motion.span
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="block text-xs text-green-600 font-medium mt-1"
                    >
                      {blank.word}
                    </motion.span>
                  )}
                </span>
              );
            }
          });
        } else {
          newParts.push(part);
        }
      });
      
      parts = newParts;
    });
    
    return parts;
  };

  return (
    <motion.div
      key={sentence.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-3xl mx-auto"
    >
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-medium">
              第 {sentence.id} 题
            </Badge>
            {attempts > 0 && (
              <Badge variant="outline" className="text-xs">
                尝试 {attempts} 次
              </Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onSpeak}
            disabled={isSpeaking}
            className="gap-2"
          >
            <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse text-blue-500' : ''}`} />
            {isSpeaking ? '播放中...' : '播放音频'}
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Chinese Translation */}
          <div className="text-center">
            <p className="text-lg text-slate-600 font-medium leading-relaxed">
              {sentence.chinese}
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-xs text-slate-400 uppercase tracking-wider">
                英文句子
              </span>
            </div>
          </div>

          {/* English Sentence with Blanks */}
          <div className="text-center text-xl leading-loose">
            {renderSentenceWithBlanks()}
          </div>

          {/* Hints */}
          {!showResult && (
            <div className="flex flex-wrap gap-2 justify-center">
              {sentence.blanks.map((blank, idx) => (
                blank.hint && (
                  <Badge 
                    key={idx} 
                    variant="outline" 
                    className="text-xs text-slate-500 bg-slate-50"
                  >
                    <Lightbulb className="w-3 h-3 mr-1 text-amber-500" />
                    空{idx + 1}: {blank.hint}
                  </Badge>
                )
              ))}
            </div>
          )}

          {/* Result Feedback */}
          <AnimatePresence mode="wait">
            {showResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {isCorrect ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-green-800">回答正确！</p>
                      <p className="text-sm text-green-600">
                        {attempts === 1 ? '太棒了，一次就答对了！' : `尝试了 ${attempts} 次后答对了！`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-800">答案不正确</p>
                      <p className="text-sm text-red-600">
                        请检查你的拼写，或查看上方显示的正确答案。
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer / Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          {!showResult ? (
            <Button 
              onClick={onCheck}
              className="w-full gap-2"
              size="lg"
            >
              提交答案
            </Button>
          ) : isCorrect ? (
            <Button 
              onClick={onNext}
              className="w-full gap-2 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              下一题
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button 
              onClick={onRetry}
              variant="outline"
              className="w-full gap-2"
              size="lg"
            >
              <RotateCcw className="w-4 h-4" />
              重新尝试
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
