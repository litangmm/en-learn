import { useEffect, useState, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Headphones, BookOpen, History, Database, Brain, RefreshCw } from 'lucide-react';
import { usePractice } from '@/hooks/usePractice';
import { useSpeech } from '@/hooks/useSpeech';
import { PracticeCard } from '@/components/PracticeCard';
import { ProgressBar } from '@/components/ProgressBar';
import { ResultModal } from '@/components/ResultModal';
import { DictionarySelector } from '@/components/DictionarySelector';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorScreen } from '@/components/ErrorScreen';
import { MistakeBook } from '@/components/MistakeBook';
import { HistoryView } from '@/components/HistoryView';
import { DataManager } from '@/components/DataManager';
import { SmartReview } from '@/components/SmartReview';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { PracticeMode } from '@/data/types';
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

type View = 'practice' | 'mistake-book' | 'history' | 'data' | 'review';

function App() {
  const [dictionaryId, setDictionaryId] = useState('cet4');
  const [pendingDictionaryId, setPendingDictionaryId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [view, setView] = useState<View>('practice');
  const [practiceSentenceIds, setPracticeSentenceIds] = useState<string[] | undefined>();
  const [mistakeCount, setMistakeCount] = useState(storage.getMistakeCount());
  const [historyCount, setHistoryCount] = useState(storage.getHistoryCount());
  const [reviewDueCount, setReviewDueCount] = useState(storage.getReviewQueueCount());
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('fill-in-blanks');

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
      const delay = practiceMode === 'dictation' ? 300 : 800;
      const timer = setTimeout(() => {
        speak(currentSentence.english, 0.85);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [currentSentence?.id, practiceMode]);

  // Global keyboard shortcuts
  const stateRef = useRef(state);
  const viewRef = useRef(view);
  const dialogRef = useRef({ showConfirmDialog, showRecoveryDialog });
  const nextSentenceRef = useRef(nextSentence);

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { viewRef.current = view; }, [view]);
  useEffect(() => { dialogRef.current = { showConfirmDialog, showRecoveryDialog }; }, [showConfirmDialog, showRecoveryDialog]);
  useEffect(() => { nextSentenceRef.current = nextSentence; }, [nextSentence]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Space') return;

      // Don't handle when typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (viewRef.current !== 'practice') return;
      if (dialogRef.current.showConfirmDialog || dialogRef.current.showRecoveryDialog) return;

      const { showResult, isCorrect, isComplete } = stateRef.current;
      if (showResult && isCorrect && !isComplete) {
        e.preventDefault();
        nextSentenceRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-schedule next review in review mode
  const processedReviewRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!isReviewMode) {
      processedReviewRef.current.clear();
      return;
    }
    if (state.showResult && currentSentence) {
      const sentenceId = currentSentence.id;
      if (!processedReviewRef.current.has(sentenceId)) {
        processedReviewRef.current.add(sentenceId);
        storage.scheduleNextReview(sentenceId, state.isCorrect);
      }
    }
  }, [isReviewMode, state.showResult, currentSentence, state.isCorrect]);

  const handleSpeak = () => {
    if (currentSentence) {
      speak(currentSentence.english, 0.85);
    }
  };

  const handleModeChange = (mode: PracticeMode) => {
    if (mode === practiceMode) return;
    setPracticeMode(mode);
    initializeInputs();
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
      setIsReviewMode(false);
      setView('practice');
    }
    setShowConfirmDialog(false);
  };

  const handleRestart = () => {
    reset();
    setPracticeSentenceIds(undefined);
    setIsReviewMode(false);
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

  const handleOpenHistory = () => {
    setView('history');
    setHistoryCount(storage.getHistoryCount());
  };

  const handleBackFromHistory = () => {
    setView('practice');
    setHistoryCount(storage.getHistoryCount());
  };

  const handleOpenDataManager = () => {
    setView('data');
  };

  const handleBackFromDataManager = () => {
    setView('practice');
    setHistoryCount(storage.getHistoryCount());
    setMistakeCount(storage.getMistakeCount());
  };

  const handleOpenSmartReview = () => {
    setReviewDueCount(storage.getReviewQueueCount());
    setView('review');
  };

  const handleBackFromSmartReview = () => {
    setView('practice');
    setReviewDueCount(storage.getReviewQueueCount());
    setIsReviewMode(false);
  };

  const handlePracticeReview = (sentenceIds: string[], dictId: string) => {
    setDictionaryId(dictId);
    setPracticeSentenceIds(sentenceIds);
    setIsReviewMode(true);
    setView('practice');
    setReviewDueCount(storage.getReviewQueueCount());
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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenHistory}
              className="relative text-slate-500 gap-2"
            >
              <History className="w-4 h-4" />
              学习记录
              {historyCount > 0 && (
                <Badge
                  variant="secondary"
                  className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
                >
                  {historyCount}
                </Badge>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenDataManager}
              className="text-slate-500 gap-2"
            >
              <Database className="w-4 h-4" />
              数据管理
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenSmartReview}
              className="relative text-slate-500 gap-2"
            >
              {isReviewMode ? (
                <RefreshCw className="w-4 h-4" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
              智能复习
              {reviewDueCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
                >
                  {reviewDueCount}
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
      ) : view === 'history' ? (
        <HistoryView onBack={handleBackFromHistory} />
      ) : view === 'data' ? (
        <DataManager onBack={handleBackFromDataManager} />
      ) : view === 'review' ? (
        <SmartReview
          onPracticeReview={handlePracticeReview}
          onBack={handleBackFromSmartReview}
        />
      ) : (
        <main className="max-w-4xl mx-auto px-4 py-8">
          {!state.isComplete ? (
            <>
              <div className="flex justify-center mb-6">
                <ToggleGroup
                  type="single"
                  value={practiceMode}
                  onValueChange={(value) => {
                    if (value) handleModeChange(value as PracticeMode);
                  }}
                  variant="outline"
                  spacing={0}
                >
                  <ToggleGroupItem value="fill-in-blanks" aria-label="填空模式">
                    填空模式
                  </ToggleGroupItem>
                  <ToggleGroupItem value="dictation" aria-label="听写模式">
                    听写模式
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
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
                    currentQuestion={currentQuestion}
                    totalQuestions={totalQuestions}
                    mode={practiceMode}
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
