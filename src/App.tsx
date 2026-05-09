import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Headphones, BookOpen } from 'lucide-react';
import { usePractice } from '@/hooks/usePractice';
import { useSpeech } from '@/hooks/useSpeech';
import { PracticeCard } from '@/components/PracticeCard';
import { ProgressBar } from '@/components/ProgressBar';
import { ResultModal } from '@/components/ResultModal';
import { DictionarySelector } from '@/components/DictionarySelector';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorScreen } from '@/components/ErrorScreen';
import { MistakeBook } from '@/components/MistakeBook';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getDictionaryById } from '@/data/dictionaries';
import { storage } from '@/services/storage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import './App.css';

type View = 'practice' | 'mistake-book';

function App() {
  const [dictionaryId, setDictionaryId] = useState('cet4');
  const [pendingDictionaryId, setPendingDictionaryId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [view, setView] = useState<View>('practice');
  const [practiceSentenceIds, setPracticeSentenceIds] = useState<string[] | undefined>();
  const [mistakeCount, setMistakeCount] = useState(storage.getMistakeCount());

  const {
    state,
    currentSentence,
    progress,
    totalQuestions,
    currentQuestion,
    setInput,
    checkAnswer,
    nextSentence,
    retry,
    reset,
    initializeInputs,
    isLoading,
    error,
  } = usePractice(dictionaryId, practiceSentenceIds);

  const { speak, isSpeaking } = useSpeech();

  // Initialize inputs when sentence changes
  useEffect(() => {
    if (currentSentence && !state.isComplete) {
      initializeInputs();
    }
  }, [currentSentence?.id]);

  // Auto-play audio on new sentence
  useEffect(() => {
    if (currentSentence && !state.showResult && !state.isComplete) {
      const timer = setTimeout(() => {
        speak(currentSentence.english, 0.85);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentSentence?.id]);

  const handleSpeak = () => {
    if (currentSentence) {
      speak(currentSentence.english, 0.85);
    }
  };

  const handleDictionaryChange = (newId: string) => {
    if (newId === dictionaryId) return;
    setPendingDictionaryId(newId);
    setShowConfirmDialog(true);
  };

  const confirmSwitch = () => {
    if (pendingDictionaryId) {
      storage.clearSession();
      setDictionaryId(pendingDictionaryId);
      setPendingDictionaryId(null);
      setPracticeSentenceIds(undefined);
      setView('practice');
    }
    setShowConfirmDialog(false);
  };

  const handleRestart = () => {
    reset();
    setPracticeSentenceIds(undefined);
  };

  // Check for active session on mount
  useEffect(() => {
    const hasActive = storage.hasActiveSession();
    if (hasActive) {
      const timeoutId = setTimeout(() => {
        setShowRecoveryDialog(true);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, []);

  const handleContinueSession = () => {
    const storedId = storage.getStoredDictionaryId();
    if (storedId) {
      setDictionaryId(storedId);
    }
    setShowRecoveryDialog(false);
  };

  const handleDiscardSession = () => {
    storage.clearSession();
    setShowRecoveryDialog(false);
  };

  const handleOpenMistakeBook = () => {
    setView('mistake-book');
  };

  const handleBackFromMistakeBook = () => {
    setView('practice');
    setMistakeCount(storage.getMistakeCount());
  };

  const handlePracticeMistakes = (sentenceIds: string[], dictId: string) => {
    setDictionaryId(dictId);
    setPracticeSentenceIds(sentenceIds);
    setView('practice');
    setMistakeCount(storage.getMistakeCount());
  };

  const currentDict = getDictionaryById(dictionaryId);

  // Loading state
  if (isLoading && view === 'practice') {
    return <LoadingScreen dictionaryName={currentDict?.name} />;
  }

  // Error state
  if (error && view === 'practice') {
    return (
      <ErrorScreen
        message={error}
        onRetry={() => {
          const current = dictionaryId;
          setDictionaryId('');
          setTimeout(() => setDictionaryId(current), 10);
        }}
      />
    );
  }

  // Empty data state
  if (!currentSentence && !state.isComplete && view === 'practice' && !practiceSentenceIds) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Headphones className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-pulse" />
          <p className="text-slate-500">暂无数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg leading-tight">听力词汇练习</h1>
              <p className="text-xs text-slate-500">听句子，填单词</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!state.isComplete && view === 'practice' && (
              <div className="text-right mr-2">
                <p className="text-sm font-medium text-slate-700">得分: {state.score}</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenMistakeBook}
              className="relative text-slate-500 gap-2"
            >
              <BookOpen className="w-4 h-4" />
              错题本
              {mistakeCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
                >
                  {mistakeCount}
                </Badge>
              )}
            </Button>
            {view === 'practice' && (
              <>
                <DictionarySelector
                  value={dictionaryId}
                  onChange={handleDictionaryChange}
                  disabled={state.isComplete}
                />
                <Button variant="ghost" size="sm" onClick={handleRestart} className="text-slate-500">
                  重置
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>切换词典</DialogTitle>
            <DialogDescription>
              切换词典将重新开始练习，当前的进度不会保存。确定要继续吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              取消
            </Button>
            <Button onClick={confirmSwitch}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recovery Dialog */}
      <Dialog open={showRecoveryDialog} onOpenChange={setShowRecoveryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>继续上次练习？</DialogTitle>
            <DialogDescription>
              检测到您有未完成的练习进度。是否继续上次的练习？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDiscardSession}>
              重新开始
            </Button>
            <Button onClick={handleContinueSession}>继续上次</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      {view === 'mistake-book' ? (
        <MistakeBook
          onPracticeMistakes={handlePracticeMistakes}
          onBack={handleBackFromMistakeBook}
        />
      ) : (
        <main className="max-w-4xl mx-auto px-4 py-8">
          {!state.isComplete ? (
            <>
              <ProgressBar progress={progress} current={currentQuestion} total={totalQuestions} />
              <AnimatePresence mode="wait">
                {currentSentence && (
                  <PracticeCard
                    key={currentSentence.id}
                    sentence={currentSentence}
                    inputs={state.currentInputs}
                    showResult={state.showResult}
                    isCorrect={state.isCorrect}
                    attempts={state.attempts}
                    isSpeaking={isSpeaking}
                    onInputChange={setInput}
                    onCheck={checkAnswer}
                    onNext={nextSentence}
                    onRetry={retry}
                    onSpeak={handleSpeak}
                  />
                )}
              </AnimatePresence>

              <div className="mt-8 text-center">
                <p className="text-sm text-slate-400">
                  听音频后，在输入框中填入缺失的单词，按 Enter 键快速提交
                </p>
              </div>
            </>
          ) : (
            <AnimatePresence>
              <ResultModal
                score={state.score}
                totalQuestions={totalQuestions}
                userAnswers={state.userAnswers}
                onRestart={handleRestart}
              />
            </AnimatePresence>
          )}
        </main>
      )}
    </div>
  );
}

export default App;
