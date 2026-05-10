/**
 * Fill-in-Blanks Mode Component
 *
 * Renders the fill-in-blanks practice mode where words in the sentence
 * are replaced with input fields for the user to fill in.
 */

import { useEffect, useRef, useCallback } from 'react';
import { Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { FillInBlanksModeConfig } from '@/components/practice/types';
import { isDefinitionSentence } from '@/data/types';

type FillInBlanksModeProps = FillInBlanksModeConfig;

export function FillInBlanksMode({
  sentence,
  inputs,
  showResult,
  isCorrect,
  isFocusMode = false,
  onInputChange,
  onCheck,
}: FillInBlanksModeProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if current sentence is a definition sentence
  const isDefinition = isDefinitionSentence(sentence);

  // Determine display text for the sentence
  const displayText = isDefinition ? sentence.chinese : sentence.english;

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

  // Parse English sentence and replace blanks with inputs
  const renderSentenceWithBlanks = () => {
    // For definition sentences, show Chinese translation as primary display
    if (isDefinition) {
      return (
        <p className={`text-slate-700 font-medium leading-relaxed ${isFocusMode ? 'text-lg md:text-xl' : 'text-base md:text-lg'}`}>
          {displayText}
        </p>
      );
    }

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
    <div className="space-y-6">
      {/* Chinese Translation */}
      <div className="text-center">
        <p className={`text-slate-600 font-medium leading-relaxed ${isFocusMode ? 'text-lg md:text-xl' : 'text-base md:text-lg'}`}>
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
            {isDefinition ? '中文释义' : '英文句子'}
          </span>
        </div>
      </div>

      {/* English Sentence with Blanks */}
      <div className={`text-center leading-relaxed md:leading-loose ${isFocusMode ? 'text-xl md:text-2xl' : 'text-lg md:text-xl'} overflow-x-auto`}>
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
    </div>
  );
}
