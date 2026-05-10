/**
 * Dictation Mode Component
 *
 * Renders the dictation practice mode where users listen to audio
 * and type the words they hear in input fields with hint support.
 */

import { useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import type { DictationModeConfig } from '@/components/practice/types';
import { isDefinitionSentence } from '@/data/types';

type DictationModeProps = DictationModeConfig;

export function DictationMode({
  sentence,
  inputs,
  showResult,
  isCorrect,
  isFocusMode = false,
  showHints = true,
  onInputChange,
  onCheck,
}: DictationModeProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if current sentence is a definition sentence
  const isDefinition = isDefinitionSentence(sentence);

  // Auto-focus first empty input on mount
  useEffect(() => {
    const firstEmptyIndex = inputs.findIndex(i => !i);
    if (firstEmptyIndex >= 0) {
      inputRefs.current[firstEmptyIndex]?.focus();
    } else if (inputs.length > 0 && !showResult) {
      inputRefs.current[inputs.length - 1]?.focus();
    }
  }, [sentence, showResult, inputs]);

  // Handle Enter key
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!showResult) {
        onCheck();
      }
    }
  }, [showResult, onCheck]);

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
              inline-block min-w-[60px] max-w-[120px] md:w-32 text-center font-medium
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
          {showHints && !showResult && (
            <span className="block text-xs text-slate-400 font-medium mt-1">
              {blank.word.charAt(0)}...
            </span>
          )}
        </span>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Chinese Translation */}
      <div className="text-center">
        <p className={`text-slate-600 font-medium leading-relaxed ${isFocusMode ? 'text-lg md:text-xl' : 'text-base md:text-lg'}`}>
          {sentence.chinese}
        </p>
      </div>

      {/* Dictation mode label */}
      {!showResult && (
        <div className="text-center">
          <p className="text-sm text-slate-400">
            请听音频，根据中文提示和首字母提示填写单词
          </p>
        </div>
      )}

      {/* Dictation Inputs */}
      <div className={`flex flex-wrap justify-center gap-3 ${isFocusMode ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'}`}>
        {renderDictationInputs()}
      </div>

      {/* Correct answer reveal on result */}
      {showResult && (
        <>
          {/* English Sentence Reveal */}
          {!isDefinition && (
            <div className="text-center">
              <p className={`text-slate-700 font-medium ${isFocusMode ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'}`}>
                {sentence.english}
              </p>
            </div>
          )}
          <div className="text-center">
            <p className="text-sm text-slate-500">
              正确答案：{sentence.blanks.map((b) => b.word).join(' / ')}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
