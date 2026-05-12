import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, CheckCircle2, ArrowRight, RotateCcw, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { toast } from 'sonner';
import type { Sentence, PracticeMode, SentenceToken, ChoiceOption, HintLevel } from '@/data/types';
import { isDefinitionSentence } from '@/data/types';
import { FillInBlanksMode } from '@/components/practice/modes/FillInBlanksMode';
import { DictationMode } from '@/components/practice/modes/DictationMode';
import { MultipleChoiceMode } from '@/components/practice/modes/MultipleChoiceMode';
import { SentenceReorderMode } from '@/components/practice/modes/SentenceReorderMode';

/**
 * Generates an explanation for why the correct answer is correct.
 * Focuses on explaining the "why" rather than just repeating the translation.
 */
function getExplanation(sentence: Sentence, isMultipleChoiceMode: boolean, isSentenceReorderMode: boolean): string {
  const targetWord = sentence.blanks[0]?.word ?? '';
  const chinese = sentence.chinese;
  const english = sentence.english;
  const isDefinition = isDefinitionSentence(sentence);

  // For multiple-choice: show why this specific sentence is the right answer
  if (isMultipleChoiceMode) {
    if (isDefinition) {
      // Definition sentence: explain why this word is the correct vocabulary choice
      return `正确答案是 "${targetWord}"。在 "${english}" 中，这个词表达了"${chinese}"的含义。选这个词是因为它准确对应了要掌握的核心词汇，其他选项虽然可能意思相近但语义上有差异。`;
    }

    // Normal sentence: explain why this sentence is the unique correct choice
    // Analyze what makes this sentence different from other options
    const keyWord = extractKeyWord(sentence);
    return `正确答案是含"${keyWord}"的句子。"${english.substring(0, 50)}${english.length > 50 ? '...' : ''}" 这句话表达了"${chinese}"的意思。其他选项的句子结构或用词与原句不同，是干扰项。`;
  }

  // For sentence-reorder: explain the sentence meaning and structure
  if (isSentenceReorderMode) {
    if (isDefinition) {
      return `正确答案是 "${targetWord}"，表示"${chinese}"。这是一个释义型句子，需要理解单词含义才能正确排列。`;
    }

    // Explain the sentence structure and meaning
    const wordCount = sentence.english.split(/\s+/).length;
    return `这道题需要将 ${wordCount} 个单词按正确顺序排列。完整句子的意思是"${chinese}"。注意英语句子的语序：主语在前，谓语在后，修饰成分要放在合适的位置。`;
  }

  // Default: explain the blank word in context
  if (isDefinition) {
    return `这里应该填 "${targetWord}"。"${english}" 整体表达"${chinese}"，这个词是题目要求掌握的核心词汇。`;
  }
  // For fill-in-blanks/dictation: explain why this specific word fits the context
  return `这里应该填 "${targetWord}"。从句子 "${english.substring(0, 40)}${english.length > 40 ? '...' : ''}" 的语境来看，空格处需要表达"${chinese}"的意思，"${targetWord}"是最准确的选择。`;
}

/**
 * Extract the main content word from a sentence for display.
 */
function extractKeyWord(sentence: Sentence): string {
  const words = sentence.english.split(/\s+/);
  if (words.length === 0) return '该';
  // Return first 2-3 words as identifier
  const preview = words.slice(0, 2).join(' ');
  return preview.length > 30 ? preview.substring(0, 30) + '...' : preview;
}

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
  isFocusMode?: boolean;
  playbackRate?: number;
  onSpeedChange?: (rate: number) => void;
  options?: ChoiceOption[];
  selectedChoiceId?: string | null;
  onSelectChoice?: (choiceId: string) => void;
  sentenceTokens?: SentenceToken[];
  orderedTokenIds?: string[];
  onSelectToken?: (tokenId: string) => void;
  onDeselectToken?: (index: number) => void;
  /** Callback when user skips definition sentence in sentence-reorder */
  onSkip?: () => void;
  onInputChange: (index: number, value: string) => void;
  onCheck: (param?: string | string[]) => void;
  onNext: () => void;
  onRetry: () => void;
  onSpeak: () => void;
  hintLevel?: HintLevel;
  shouldShowHint?: () => boolean;
  /** Whether this word is already marked as a personal word */
  isMarked?: boolean;
  /** Callback when user marks/unmarks this word as a personal word */
  onMark?: (word: string, translation: string, english: string, chinese: string, sentenceId: string) => void;
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
  isFocusMode = false,
  playbackRate = 1.0,
  onSpeedChange,
  options = [],
  selectedChoiceId,
  onSelectChoice,
  sentenceTokens = [],
  orderedTokenIds = [],
  onSelectToken,
  onDeselectToken,
  onSkip,
  onInputChange,
  onCheck,
  onNext,
  onRetry,
  onSpeak,
  hintLevel,
  shouldShowHint,
  isMarked = false,
  onMark,
}: PracticeCardProps) {
  const isDictation = mode === 'dictation';
  const isMultipleChoice = mode === 'multiple-choice';
  const isSentenceReorder = mode === 'sentence-reorder';

  // Render wrong answer feedback (3-section card)
  const renderWrongAnswerFeedback = () => {
    // Determine user's answer based on mode
    let userAnswerText = '';
    if (isMultipleChoice) {
      const selectedOption = options.find((o) => o.id === selectedChoiceId);
      userAnswerText = selectedOption?.text ?? '(未选择)';
    } else if (isSentenceReorder) {
      const selectedTokens = orderedTokenIds
        .map((id) => sentenceTokens.find((t) => t.id === id))
        .filter(Boolean) as SentenceToken[];
      userAnswerText = selectedTokens.map((t) => t.text).join(' ') || '(未排列)';
    } else {
      // fill-in-blanks or dictation
      userAnswerText = inputs.filter(Boolean).join(' / ') || '(未填写)';
    }

    // Determine correct answer text
    const correctAnswerText = isMultipleChoice || isSentenceReorder
      ? sentence.english
      : sentence.blanks.map((b) => b.word).join(' / ');

    return (
      <div className="space-y-3">
        {/* User's answer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="p-4 bg-red-50 rounded-xl border border-red-200"
        >
          <p className="text-sm text-red-700 font-medium mb-1">你的答案</p>
          <p className="text-base text-red-800">{userAnswerText}</p>
        </motion.div>

        {/* Correct answer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-green-50 rounded-xl border border-green-200"
        >
          <p className="text-sm text-green-700 font-medium mb-1">正确答案</p>
          <p className="text-base text-green-800">{correctAnswerText}</p>
        </motion.div>

        {/* Explanation - Why this answer is correct */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 bg-blue-50 rounded-xl border border-blue-200"
        >
          <p className="text-sm text-blue-700 font-medium mb-1">解析</p>
          <p className="text-base text-blue-800">{getExplanation(sentence, isMultipleChoice, isSentenceReorder)}</p>
        </motion.div>
      </div>
    );
  };

  // Render mode-specific content using strategy components
  const renderModeContent = () => {
    // Common props shared across all strategy components
    const commonProps = {
      sentence,
      inputs,
      showResult,
      isCorrect,
      attempts,
      isSpeaking,
      isFocusMode,
      onInputChange,
      onCheck,
      onNext,
      onRetry,
      onSpeak,
      hintLevel,
      shouldShowHint,
    };

    switch (mode) {
      case 'multiple-choice':
        return (
          <MultipleChoiceMode
            {...commonProps}
            options={options}
            selectedChoiceId={selectedChoiceId ?? null}
            onSelectChoice={onSelectChoice ?? (() => {})}
          />
        );

      case 'sentence-reorder':
        return (
          <SentenceReorderMode
            {...commonProps}
            sentenceTokens={sentenceTokens}
            orderedTokenIds={orderedTokenIds}
            onSelectToken={onSelectToken ?? (() => {})}
            onDeselectToken={onDeselectToken ?? (() => {})}
            onSkip={onSkip}
          />
        );

      case 'dictation':
        return (
          <DictationMode
            {...commonProps}
            showHints={true}
          />
        );

      case 'fill-in-blanks':
      default:
        return (
          <FillInBlanksMode
            {...commonProps}
          />
        );
    }
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
      <div className={`bg-white rounded-2xl overflow-hidden ${isFocusMode ? 'shadow-xl border border-slate-100' : 'shadow-lg border border-slate-200'}`}>
        {/* Header */}
        <div className={`${isFocusMode ? '' : 'bg-slate-50'} px-4 py-3 md:px-6 md:py-4 border-b border-slate-100 flex items-center ${isFocusMode ? 'justify-end' : 'justify-between'}`}>
          {!isFocusMode && (
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
          )}
          <div className="flex items-center gap-2">
            {onMark && (
              <Button
                variant={isMarked ? 'default' : 'ghost'}
                size="icon"
                onClick={() => {
                  const word = sentence.blanks[0]?.word ?? '';
                  const translation = sentence.chinese;
                  const english = sentence.english;
                  const chinese = sentence.chinese;
                  const sentenceId = sentence.id;
                  onMark(word, translation, english, chinese, sentenceId);
                  if (!isMarked) {
                    toast.success('已添加到生词本', { duration: 1500 });
                  }
                }}
                className={`h-8 w-8 ${isMarked ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700' : 'text-muted-foreground hover:text-yellow-600 hover:bg-yellow-50'}`}
                title={isMarked ? '已加入生词本' : '加入生词本'}
              >
                <Star className={`w-4 h-4 ${isMarked ? 'fill-current' : ''}`} />
              </Button>
            )}
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
              size="sm"
              onClick={onSpeak}
              disabled={isSpeaking}
              className={`gap-2 h-8 md:h-10 ${isDictation && !showResult ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md' : ''}`}
            >
              <Volume2 className={`w-4 h-4 ${isDictation && !showResult ? 'md:w-5 md:h-5' : ''} ${isSpeaking ? 'animate-pulse text-blue-500' : ''}`} />
              {isSpeaking ? '播放中...' : '播放音频'}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className={`${isFocusMode ? 'p-6 md:p-10 space-y-8' : 'p-4 md:p-6 space-y-6'}`}>
          {/* Mode-specific content rendered by strategy components */}
          {renderModeContent()}

          {/* Result Feedback */}
          <AnimatePresence mode="sync">
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
                  renderWrongAnswerFeedback()
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer / Actions */}
        <div className="px-4 py-3 md:px-6 md:py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          {!showResult ? (
            <div className="w-full space-y-2">
              {isSentenceReorder && orderedTokenIds.length !== sentenceTokens.length && (
                <p className="text-xs text-slate-400 text-center">
                  请先点击下方单词组成完整句子
                </p>
              )}
              <Button
                onClick={() => {
                  if (isMultipleChoice) {
                    onCheck(selectedChoiceId || undefined);
                  } else if (isSentenceReorder) {
                    onCheck(orderedTokenIds);
                  } else {
                    onCheck();
                  }
                }}
                disabled={
                  (isMultipleChoice && !selectedChoiceId) ||
                  (isSentenceReorder && orderedTokenIds.length !== sentenceTokens.length)
                }
                className="w-full gap-2"
                size="lg"
              >
                提交答案
              </Button>
            </div>
          ) : isCorrect ? (
            <Button
              onClick={onNext}
              className="w-full gap-2 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              下一题
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : isMultipleChoice || isSentenceReorder ? (
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
