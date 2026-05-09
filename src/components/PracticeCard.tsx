import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, CheckCircle2, XCircle, Lightbulb, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Sentence, PracticeMode } from '@/data/types';

const SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5] as const;

interface PracticeCardProps {
  sentence: Sentence;
  inputs: string[];
  showResult: boolean;
  isCorrect: boolean;
  attempts: number;
  isSpeaking: boolean;
  currentQuestion?: number;
  totalQuestions?: number;
  mode?: PracticeMode;
  playbackRate?: number;
  onSpeedChange?: (rate: number) => void;
  options?: Sentence[];
  selectedChoiceId?: string | null;
  onSelectChoice?: (choiceId: string) => void;
  onInputChange: (index: number, value: string) => void;
  onCheck: (selectedOptionId?: string) => void;
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
  currentQuestion,
  totalQuestions,
  mode = 'fill-in-blanks',
  playbackRate = 1.0,
  onSpeedChange,
  options = [],
  selectedChoiceId,
  onSelectChoice,
  onInputChange,
  onCheck,
  onNext,
  onRetry,
  onSpeak,
}: PracticeCardProps) {
  const isDictation = mode === 'dictation';
  const isMultipleChoice = mode === 'multiple-choice';
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
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!showResult) {
        if (isMultipleChoice && selectedChoiceId) {
          onCheck(selectedChoiceId);
        } else if (!isMultipleChoice) {
          onCheck();
        }
      } else if (isCorrect) {
        onNext();
      } else if (!isMultipleChoice) {
        onRetry();
      }
    }
  }, [showResult, isCorrect, isMultipleChoice, selectedChoiceId, onCheck, onNext, onRetry]);

  // Render multiple-choice options
  const renderChoiceOptions = () => {
    return (
      <div className="grid grid-cols-1 gap-3">
        {options.map((option) => {
          const isSelected = selectedChoiceId === option.id;
          const isCorrectOption = showResult && option.id === sentence.id;
          const isWrongSelected = showResult && isSelected && option.id !== sentence.id;

          return (
            <button
              key={option.id}
              onClick={() => !showResult && onSelectChoice?.(option.id)}
              disabled={showResult}
              className={`
                w-full p-4 rounded-xl border-2 text-left transition-all duration-200
                ${isCorrectOption
                  ? 'border-green-500 bg-green-50 text-green-800'
                  : isWrongSelected
                    ? 'border-red-500 bg-red-50 text-red-800'
                    : isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50'
                }
                ${showResult ? 'cursor-default' : 'cursor-pointer'}
              `}
            >
              <p className="text-base font-medium">{option.english}</p>
            </button>
          );
        })}
      </div>
    );
  };

  // Render standalone inputs for dictation mode
  const renderDictationInputs = () => {
    return sentence.blanks.map((blank, idx) => {
      const hasError = showResult && !isCorrect && inputs[idx]?.toLowerCase().trim() !== blank.word.toLowerCase();
      const hasSuccess = showResult && inputs[idx]?.toLowerCase().trim() === blank.word.toLowerCase();

      return (
        <span key={`dictation-${idx}`} className="inline-block mx-1">
          <Input
            ref={el => { inputRefs.current[idx] = el; }}
            type="text"
            value={inputs[idx] || ''}
            onChange={e => onInputChange(idx, e.target.value)}
            onKeyDown={e => handleKeyDown(e)}
            disabled={showResult && isCorrect}
            placeholder={`${idx + 1}`}
            className={`
              inline-block w-28 md:w-32 text-center font-medium
              h-11 md:h-10
              transition-all duration-300 border-2
              ${hasSuccess
                ? 'border-green-500 bg-green-50 text-green-700'
                : hasError
                  ? 'border-red-400 bg-red-50 text-red-700'
                  : 'border-slate-300 focus:border-blue-500 hover:border-slate-400'
              }
            `}
          />
          {!showResult && (
            <span className="block text-xs text-slate-400 font-medium mt-1">
              {blank.word.charAt(0)}...
            </span>
          )}
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
    });
  };

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
                    onKeyDown={e => handleKeyDown(e)}
                    disabled={showResult && isCorrect}
                    placeholder={`${idx + 1}`}
                    className={`
                      inline-block w-28 md:w-32 text-center font-medium
                      h-11 md:h-10
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
        <div className="bg-slate-50 px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-medium">
              {currentQuestion !== undefined && totalQuestions !== undefined
                ? `第 ${currentQuestion}/${totalQuestions} 题`
                : `第 ${sentence.id} 题`}
            </Badge>
            {attempts > 0 && (
              <Badge variant="outline" className="text-xs">
                尝试 {attempts} 次
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onSpeedChange && (
              <ToggleGroup
                type="single"
                value={String(playbackRate)}
                onValueChange={(value) => {
                  if (value) onSpeedChange(Number(value));
                }}
                variant="outline"
                spacing={0}
                className="h-9 md:h-8"
              >
                {SPEEDS.map((speed) => (
                  <ToggleGroupItem
                    key={speed}
                    value={String(speed)}
                    aria-label={`${speed}x`}
                    className="text-xs px-2 h-8 md:h-7"
                  >
                    {speed}x
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}
            <Button
              variant={isDictation && !showResult ? 'default' : 'outline'}
              size={isDictation && !showResult ? 'default' : 'sm'}
              onClick={onSpeak}
              disabled={isSpeaking}
              className={`gap-2 ${isDictation && !showResult ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' : ''}`}
            >
              <Volume2 className={`${isDictation && !showResult ? 'w-5 h-5' : 'w-4 h-4'} ${isSpeaking ? 'animate-pulse text-blue-500' : ''}`} />
              {isSpeaking ? '播放中...' : '播放音频'}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-6">
          {/* Chinese Translation */}
          <div className="text-center">
            <p className="text-base md:text-lg text-slate-600 font-medium leading-relaxed">
              {sentence.chinese}
            </p>
          </div>

          {/* Divider */}
          {(!isDictation || showResult) && !isMultipleChoice && (
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
          )}

          {/* Dictation mode label */}
          {isDictation && !showResult && !isMultipleChoice && (
            <div className="text-center">
              <p className="text-sm text-slate-400">
                请听音频，根据中文提示和首字母提示填写单词
              </p>
            </div>
          )}

          {/* English Sentence with Blanks / Dictation Inputs / Multiple Choice Options */}
          <div className={`${isMultipleChoice ? '' : `text-center text-lg md:text-xl leading-relaxed md:leading-loose ${isDictation && !showResult ? 'flex flex-wrap justify-center gap-3' : ''}`}`}>
            {isMultipleChoice
              ? renderChoiceOptions()
              : isDictation && !showResult
                ? renderDictationInputs()
                : renderSentenceWithBlanks()}
          </div>

          {/* Hints */}
          {!showResult && !isDictation && !isMultipleChoice && (
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
        <div className="px-4 py-3 md:px-6 md:py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          {!showResult ? (
            <Button
              onClick={() => isMultipleChoice ? onCheck(selectedChoiceId || undefined) : onCheck()}
              disabled={isMultipleChoice && !selectedChoiceId}
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
          ) : isMultipleChoice ? (
            <Button
              onClick={onNext}
              variant="outline"
              className="w-full gap-2"
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
