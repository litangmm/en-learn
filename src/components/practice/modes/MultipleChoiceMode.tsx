/**
 * Multiple Choice Mode Component
 *
 * Renders the multiple-choice practice mode where users select
 * the correct sentence from a list of options.
 */

import { CheckCircle2, Circle } from 'lucide-react';
import type { MultipleChoiceModeConfig } from '@/components/practice/types';

type MultipleChoiceModeProps = MultipleChoiceModeConfig;

export function MultipleChoiceMode({
  sentence,
  options,
  selectedChoiceId,
  showResult,
  isFocusMode = false,
  onSelectChoice,
}: MultipleChoiceModeProps) {
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
              onClick={() => !showResult && onSelectChoice(option.id)}
              disabled={showResult}
              className={`
                relative w-full p-4 rounded-xl border-2 text-left transition-all duration-200
                ${isCorrectOption
                  ? 'border-green-500 bg-green-50 text-green-800'
                  : isWrongSelected
                    ? 'border-red-500 bg-red-50 text-red-800'
                    : isSelected
                      ? 'border-blue-500 bg-blue-100 text-blue-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50'
                }
                ${showResult ? 'cursor-default' : 'cursor-pointer'}
              `}
            >
              {/* Selection icon in top-right corner */}
              <span className="absolute top-3 right-3">
                {isSelected ? (
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300" />
                )}
              </span>
              <p className="text-base font-medium pr-8">{option.text}</p>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Chinese Translation */}
      <div className="text-center">
        <p className={`text-slate-600 font-medium leading-relaxed ${isFocusMode ? 'text-lg md:text-xl' : 'text-base md:text-lg'}`}>
          {sentence.chinese}
        </p>
      </div>

      {/* Multiple Choice Options */}
      <div className={isFocusMode ? 'text-lg' : 'text-base'}>
        {renderChoiceOptions()}
      </div>
    </div>
  );
}
