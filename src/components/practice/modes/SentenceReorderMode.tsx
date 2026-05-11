/**
 * Sentence Reorder Mode Component
 *
 * Renders the sentence-reorder practice mode where users arrange
 * scrambled tokens into the correct sentence order.
 */

import { motion } from 'framer-motion';
import { useCallback, useEffect } from 'react';
import type { SentenceReorderModeConfig } from '@/components/practice/types';
import { isDefinitionSentence } from '@/data/types';
import type { SentenceToken } from '@/data/types';

type SentenceReorderModeProps = SentenceReorderModeConfig;

export function SentenceReorderMode({
  sentence,
  sentenceTokens,
  orderedTokenIds,
  showResult,
  isCorrect,
  isFocusMode = false,
  onSelectToken,
  onDeselectToken,
  onSkip,
}: SentenceReorderModeProps) {
  // Check if this is a definition sentence - if so, show warning
  const isDefinition = isDefinitionSentence(sentence);

  const selectedTokens = orderedTokenIds
    .map((id) => sentenceTokens.find((t) => t.id === id))
    .filter(Boolean) as SentenceToken[];

  const remainingTokens = sentenceTokens.filter(
    (t) => !orderedTokenIds.includes(t.id)
  );

  // Handle keyboard support for skip
  const handleSkip = useCallback(() => {
    if (onSkip) {
      onSkip();
    }
  }, [onSkip]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isDefinition && onSkip) {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDefinition, onSkip, handleSkip]);

  // Render sentence reorder mode
  const renderSentenceReorder = () => {
    if (isDefinition) {
      return (
        <div className="space-y-4 p-6 bg-amber-50 rounded-xl border border-amber-200 text-center">
          <p className="text-amber-700 font-medium text-base">
            此题目为释义型句子，不适合连词成句练习
          </p>
          {onSkip && (
            <button
              onClick={onSkip}
              className="w-full px-6 py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-lg text-base font-semibold transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
              autoFocus
            >
              跳过此题，换下一题 →
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Answer zone */}
        <div className="min-h-[60px] p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
          <p className="text-xs text-slate-400 mb-2">按正确顺序排列句子：</p>
          <div className="flex flex-wrap gap-2">
            {selectedTokens.length === 0 ? (
              <span className="text-sm text-slate-400">点击下方单词排列句子</span>
            ) : (
              selectedTokens.map((token, idx) => (
                <button
                  key={token.id}
                  onClick={() => onDeselectToken(idx)}
                  disabled={showResult}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${showResult
                      ? 'bg-slate-100 text-slate-600 cursor-default'
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer'
                    }
                  `}
                >
                  {token.text}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Progress text */}
        {!showResult && sentenceTokens.length > 0 && (
          <p className="text-sm text-slate-500 text-center">
            已选 {orderedTokenIds.length}/{sentenceTokens.length} 个单词
          </p>
        )}

        {/* Word pool */}
        {!showResult && remainingTokens.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {remainingTokens.map((token) => (
              <button
                key={token.id}
                onClick={() => onSelectToken(token.id)}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 cursor-pointer"
              >
                {token.text}
              </button>
            ))}
          </div>
        )}

        {/* Correct sentence reveal on wrong answer */}
        {showResult && !isCorrect && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-green-50 rounded-xl border border-green-200"
          >
            <p className="text-sm text-green-700 font-medium mb-1">正确答案：</p>
            <p className="text-base text-green-800">{sentence.english}</p>
          </motion.div>
        )}
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

      {/* Sentence Reorder Content */}
      <div className={isFocusMode ? 'text-lg' : 'text-base'}>
        {renderSentenceReorder()}
      </div>
    </div>
  );
}
