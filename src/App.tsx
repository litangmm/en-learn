import { useEffect, useState, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Headphones, Eye, X, Trophy, Award, TrendingUp, Sparkles, Zap, Users } from 'lucide-react';
import { usePractice } from '@/hooks/usePractice';
import { useSpeech } from '@/hooks/useSpeech';
import { useXP } from '@/hooks/useXP';
import { useFlowState } from '@/hooks/useFlowState';
import { PracticeCard } from '@/components/PracticeCard';
import { ProgressBar } from '@/components/ProgressBar';
import { ResultModal } from '@/components/ResultModal';
import { DictionarySelector } from '@/components/DictionarySelector';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ErrorScreen } from '@/components/ErrorScreen';
import { MobileNav } from '@/components/MobileNav';
import { MoreMenu } from '@/components/MoreMenu';
import { XPBar } from '@/components/XPBar';
import { StreakFeedback } from '@/components/StreakFeedback';
import { XPGainPopup } from '@/components/XPGainPopup';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDailyChallenges } from '@/hooks/useDailyChallenges';
import { useBadges } from '@/hooks/useBadges';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useWeaknessStats } from '@/hooks/useWeaknessStats';
import { useSpacedRepetition } from '@/hooks/useSpacedRepetition';
import { useReviewStreak } from '@/hooks/useReviewStreak';
import { useRecallReminder } from '@/hooks/useRecallReminder';
import { useHintLevel } from '@/hooks/useHintLevel';
import { usePersonalWords } from '@/hooks/usePersonalWords';
import { BadgeUnlockToast } from '@/components/BadgeUnlockToast';
import { FlowStateBanner } from '@/components/FlowStateBanner';
import { SessionTimer } from '@/components/SessionTimer';
import { FocusModeOverlay, type FocusSessionStats } from '@/components/FocusModeOverlay';
import { FocusSessionSummary } from '@/components/FocusSessionSummary';
import { SharePromptToast } from '@/components/SharePromptToast';
import { AchievementToast } from '@/components/AchievementToast';
import { RecallReminderToast } from '@/components/RecallReminderToast';
import { WeeklyReportCard } from '@/components/WeeklyReportCard';
import { useAchievementMoment } from '@/hooks/useAchievementMoment';
import { useWeeklyReport } from '@/hooks/useWeeklyReport';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { PracticeMode, BadgeDefinition, LeaderboardCategory, LeaderboardTimeFilter, AchievementMoment } from '@/data/types';
import { ViewRouter, NavigationProvider, type View } from '@/components/routing';
import { isRecentShareTrigger, type ShareTrigger } from '@/lib/shareTriggers';
import { getModeHint, formatElapsedTime, APP_BRAND, ONBOARDING_DICTIONARIES } from '@/utils/appHelpers';
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

// Share prompt type for level-up and badge celebrations
export type SharePromptType = 'levelup' | 'badge';
export interface SharePrompt {
  type: SharePromptType;
  level?: number;
  badge?: BadgeDefinition;
}

function App() {
  const isMobile = useIsMobile();
  const [dictionaryId, setDictionaryId] = useState('cet4');
  const [pendingDictionaryId, setPendingDictionaryId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [showOnboardingDialog, setShowOnboardingDialog] = useState(false);
  const [view, setView] = useState<View>('practice');
  const [practiceSentenceIds, setPracticeSentenceIds] = useState<string[] | undefined>();
  const [mistakeCount, setMistakeCount] = useState(storage.getMistakeCount());
  const [historyCount, setHistoryCount] = useState(storage.getHistoryCount());
  const [reviewDueCount, setReviewDueCount] = useState(storage.getReviewQueueCount());
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('fill-in-blanks');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isFocusSession, setIsFocusSession] = useState(false);
  const [focusSessionStats, setFocusSessionStats] = useState<FocusSessionStats | null>(null);
  const [showFocusSummary, setShowFocusSummary] = useState(false);
  const [xpGainTrigger, setXpGainTrigger] = useState<{ amount: number; multiplier: number; key: number } | null>(null);
  const [badgeUnlockTrigger, setBadgeUnlockTrigger] = useState<{ badge: BadgeDefinition; key: number } | null>(null);
  const [leaderboardCategory, setLeaderboardCategory] = useState<LeaderboardCategory>('score');
  const [leaderboardTimeFilter, setLeaderboardTimeFilter] = useState<LeaderboardTimeFilter>('today');
  const [selectedOnboardingDictionary, setSelectedOnboardingDictionary] = useState('cet4');
  const [sharePrompt, setSharePrompt] = useState<SharePrompt | null>(null); // State for share prompt trigger - setSharePrompt called in useEffect, value consumed in Task 4
  const [achievementMomentTrigger, setAchievementMomentTrigger] = useState<{ moment: AchievementMoment | null; key: number } | null>(null);
  const [weeklyReportTrigger, setWeeklyReportTrigger] = useState<{ key: number } | null>(null);

  // Initialize weekly report hook
  const { report: weeklyReport, shouldShow: showWeeklyReport, dismiss: dismissWeeklyReport, markShown: markWeeklyReportShown } = useWeeklyReport();

  // Initialize achievement moment hook
  const {
    acknowledgeMoment,
    checkLevelUp,
    checkBadgeUnlock,
    checkStreakMilestone,
    checkXPMilestone,
    checkPerfectSession,
  } = useAchievementMoment();

  const toggleFocusMode = () => setIsFocusMode(prev => !prev);

  const startFocusSession = useCallback(() => {
    setIsFocusSession(true);
  }, []);

  const endFocusSession = useCallback((stats: { duration: number; questionsCompleted: number; accuracy?: number }) => {
    setFocusSessionStats({ ...stats, accuracy: stats.accuracy ?? 0 });
    setShowFocusSummary(true);
    setIsFocusSession(false);
  }, []);

  const handleCloseFocusSummary = useCallback(() => {
    setShowFocusSummary(false);
    setFocusSessionStats(null);
  }, []);

  const { isMarked, markFromPractice } = usePersonalWords();

  const handleMarkWord = (word: string, translation: string, english: string, chinese: string, sentenceId: string) => {
    markFromPractice(word, translation, english, chinese, sentenceId);
  };

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
    options,
    selectChoice,
    sentenceTokens,
    selectToken,
    deselectToken,
    resetTokens,
  } = usePractice(dictionaryId, practiceSentenceIds, practiceMode);

  const { speak, isSpeaking, playbackRate, setPlaybackRate } = useSpeech();
  const { profile, addXP, streak, recordCorrectAnswer, recordWrongAnswer, resetStreak } = useXP();
  const { state: challengeState, unclaimedCount, trackActivity, claimReward } = useDailyChallenges();
  const { unlockedIds, unlockedCount, trackProgress, checkBadges, getBadgeProgressPercent } = useBadges();
  const { getLeaderboardEntries } = useLeaderboard();
  const { stats: weaknessStats } = useWeaknessStats();
  const { dueCount } = useSpacedRepetition();
  const { data: streakData } = useReviewStreak();
  const currentStreak = streakData.currentStreak;
  const { status: recallStatus, dueCount: recallDueCount, dismiss: dismissRecall } = useRecallReminder();
  const { hintLevel, shouldShowHint } = useHintLevel();

  // Track previous level for detecting level-ups (initialized after profile is available)
  const previousLevelRef = useRef(profile.currentLevel);
  // Track total correct answers for XP milestone detection
  const totalCorrectRef = useRef(0);
  // Track session start time for flow state and Pomodoro timer
  const sessionStartTimeRef = useRef<number>(Date.now());

  // Flow state tracking
  const { flowState, fatigueSignals, recordCorrect, recordWrong, reset: resetFlowState } = useFlowState();
  const flowStateRef = useRef(flowState);
  useEffect(() => { flowStateRef.current = flowState; }, [flowState]);

  // Initialize inputs when sentence changes (guard: skip if showResult=true to prevent state race)
  useEffect(() => {
    if (currentSentence && !state.isComplete && !state.showResult) {
      initializeInputs();
    }
  }, [currentSentence?.id, currentSentence, state.isComplete, state.showResult, initializeInputs]);

  // Auto-play audio on new sentence (adaptive delay based on flow state)
  useEffect(() => {
    if (currentSentence && !state.showResult && !state.isComplete) {
      let baseDelay = practiceMode === 'dictation' ? 300 : practiceMode === 'multiple-choice' ? 500 : practiceMode === 'sentence-reorder' ? 500 : 800;
      // Adaptive delay based on flow state
      if (flowStateRef.current === 'fatigued') {
        baseDelay += 400; // More time to see the sentence when fatigued
      } else if (flowStateRef.current === 'focused') {
        baseDelay = Math.max(200, baseDelay - 100); // Faster pace when focused
      }
      const timer = setTimeout(() => {
        speak(currentSentence.english);
      }, baseDelay);
      return () => clearTimeout(timer);
    }
  }, [currentSentence?.id, currentSentence, state.showResult, state.isComplete, practiceMode, speak]);

  // Global keyboard shortcuts
  const stateRef = useRef(state);
  const viewRef = useRef(view);
  const dialogRef = useRef({ showConfirmDialog, showRecoveryDialog });
  const nextSentenceRef = useRef(nextSentence);
  const isFocusModeRef = useRef(isFocusMode);
  const badgesRef = useRef({ trackProgress, checkBadges });

  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { isFocusModeRef.current = isFocusMode; }, [isFocusMode]);
  useEffect(() => { viewRef.current = view; }, [view]);
  useEffect(() => { badgesRef.current = { trackProgress, checkBadges }; }, [trackProgress, checkBadges]);
  useEffect(() => { dialogRef.current = { showConfirmDialog, showRecoveryDialog }; }, [showConfirmDialog, showRecoveryDialog]);
  useEffect(() => { nextSentenceRef.current = nextSentence; }, [nextSentence]);

  // Detect first-time users and show onboarding dialog
  useEffect(() => {
    if (!storage.hasOnboardingComplete()) {
      setTimeout(() => setShowOnboardingDialog(true), 0);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC to exit focus mode
      if (e.key === 'Escape' && isFocusModeRef.current) {
        setIsFocusMode(false);
        return;
      }

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

  // Track recent share triggers for frequency control (5-min deduplication)
  const recentShareTriggersRef = useRef<ShareTrigger[]>([]);

  // Check for weekly report on visibility change (user returns to app)
  const weeklyReportTriggeredRef = useRef(false);
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !weeklyReportTriggeredRef.current) {
        // Check if should show weekly report after achievement moment is done
        if (!achievementMomentTrigger && showWeeklyReport && weeklyReport) {
          weeklyReportTriggeredRef.current = true;
          // Use requestAnimationFrame to defer the state update
          const frameId = requestAnimationFrame(() => {
            setWeeklyReportTrigger({ key: Date.now() });
          });
          return () => cancelAnimationFrame(frameId);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [achievementMomentTrigger, showWeeklyReport, weeklyReport]);

  // Check if share trigger should be blocked (5-min deduplication)
  const checkRecentShare = (type: string, id: string): boolean => {
    return isRecentShareTrigger(recentShareTriggersRef.current, type, id);
  };

  // Award XP on correct answer (deduplicated per question)
  const awardedXPRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (state.showResult && state.isCorrect && currentSentence) {
      const sentenceId = currentSentence.id;
      if (!awardedXPRef.current.has(sentenceId)) {
        awardedXPRef.current.add(sentenceId);
        recordCorrectAnswer();
        // Record for flow state tracking
        const answerTimeMs = Date.now() - sessionStartTimeRef.current;
        recordCorrect(answerTimeMs);
        const baseXP = practiceMode === 'multiple-choice' ? 8 : practiceMode === 'sentence-reorder' ? 12 : 10;
        const firstTry = state.attempts === 1;
        const { finalXP, multiplier, leveledUp, newLevel } = addXP(baseXP, firstTry);
        requestAnimationFrame(() => {
          setXpGainTrigger({ amount: finalXP, multiplier, key: Date.now() });
        });
        if (leveledUp && !checkRecentShare('levelup', String(newLevel))) {
          recentShareTriggersRef.current.push({ type: 'levelup', id: String(newLevel), timestamp: Date.now() });
          requestAnimationFrame(() => {
            setSharePrompt({ type: 'levelup', level: newLevel });
          });
        }
        // Achievement moment: Level-up
        const oldLevel = previousLevelRef.current;
        const levelUpMoment = checkLevelUp(oldLevel, newLevel);
        if (levelUpMoment) {
          requestAnimationFrame(() => {
            setAchievementMomentTrigger({ moment: levelUpMoment, key: Date.now() });
          });
        }
        if (leveledUp) {
          previousLevelRef.current = newLevel;
        }
        // Increment total correct counter
        totalCorrectRef.current += 1;
        const accuracy = state.attempts === 1 ? 100 : 50; // Estimate accuracy based on attempts
        // Achievement moment: Streak milestone
        const streakMoment = checkStreakMilestone(streak + 1);
        if (streakMoment) {
          requestAnimationFrame(() => {
            setAchievementMomentTrigger({ moment: streakMoment, key: Date.now() });
          });
        }
        // Achievement moment: XP milestone
        const xpMoment = checkXPMilestone(profile.totalXP, totalCorrectRef.current, accuracy);
        if (xpMoment) {
          requestAnimationFrame(() => {
            setAchievementMomentTrigger({ moment: xpMoment, key: Date.now() });
          });
        }
        trackActivity('answer');
        trackActivity('correct');
        trackActivity('streak', streak + 1);
        badgesRef.current.trackProgress('correct');
        badgesRef.current.trackProgress('streak', streak + 1);
        const newBadges = badgesRef.current.checkBadges(profile.currentLevel);
        if (newBadges.length > 0) {
          requestAnimationFrame(() => {
            setBadgeUnlockTrigger({ badge: newBadges[0], key: Date.now() });
          });
          // Achievement moment: Badge unlock
          const badgeMoment = checkBadgeUnlock(newBadges[0]);
          if (badgeMoment) {
            requestAnimationFrame(() => {
              setAchievementMomentTrigger({ moment: badgeMoment, key: Date.now() });
            });
          }
        }
      }
    }
  }, [state.showResult, state.isCorrect, currentSentence, state.attempts, practiceMode, addXP, recordCorrectAnswer, trackActivity, streak, profile.currentLevel, profile.totalXP, checkLevelUp, checkStreakMilestone, checkXPMilestone, checkBadgeUnlock]);

  // Reset streak on wrong answer
  useEffect(() => {
    if (state.showResult && !state.isCorrect) {
      recordWrongAnswer();
      // Record for flow state tracking
      recordWrong();
      trackActivity('answer');
      trackActivity('streak', 0);
      badgesRef.current.trackProgress('wrong');
      badgesRef.current.trackProgress('streak', 0);
      badgesRef.current.checkBadges(profile.currentLevel);
    }
  }, [state.showResult, state.isCorrect, recordWrongAnswer, trackActivity, profile.currentLevel]);
  // Session completion badge tracking
  useEffect(() => {
    if (state.isComplete) {
      badgesRef.current.trackProgress('session_complete');
      const accuracy = totalQuestions > 0 ? (state.score / (totalQuestions * 10)) * 100 : 0;
      if (accuracy === 100) {
        badgesRef.current.trackProgress('perfect_session');
        // Achievement moment: Perfect session
        const perfectMoment = checkPerfectSession(state.score, totalQuestions, streak);
        if (perfectMoment) {
          requestAnimationFrame(() => {
            setAchievementMomentTrigger({ moment: perfectMoment, key: Date.now() });
          });
        }
      }
      badgesRef.current.checkBadges(profile.currentLevel);
    }
  }, [state.isComplete, totalQuestions, state.score, profile.currentLevel, checkPerfectSession, streak]);

  // Auto-clear share prompt after 2 seconds
  useEffect(() => {
    if (sharePrompt) {
      const timer = setTimeout(() => {
        setSharePrompt(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [sharePrompt]);

  // Achievement moment dismissal is now handled by AchievementToast component (auto-dismiss after 3s)

  // Trigger weekly report after achievement moment (if should show)
  useEffect(() => {
    // Only trigger if achievement moment is done and weekly report should show
    if (!achievementMomentTrigger && showWeeklyReport && !weeklyReportTrigger) {
      // Use requestAnimationFrame to defer the state update
      const frameId = requestAnimationFrame(() => {
        setWeeklyReportTrigger({ key: Date.now() });
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [achievementMomentTrigger, showWeeklyReport, weeklyReportTrigger]);

  // Auto-dismiss weekly report after 5 seconds
  useEffect(() => {
    if (weeklyReportTrigger) {
      const timer = setTimeout(() => {
        setWeeklyReportTrigger(null);
        markWeeklyReportShown();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [weeklyReportTrigger, markWeeklyReportShown]);

  const handleDismissWeeklyReport = useCallback(() => {
    dismissWeeklyReport();
    setWeeklyReportTrigger(null);
  }, [dismissWeeklyReport]);

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
        badgesRef.current.trackProgress('review');
        badgesRef.current.checkBadges(profile.currentLevel);
      }
    }
  }, [isReviewMode, state.showResult, currentSentence, state.isCorrect, profile.currentLevel]);

  const handleSpeak = () => {
    if (currentSentence) {
      speak(currentSentence.english);
    }
  };

  const handleModeChange = (mode: PracticeMode) => {
    if (mode === practiceMode) return;
    setPracticeMode(mode);
    // initializeInputs() already clears showResult/isCorrect/attempts, preventing stale result UI
    initializeInputs();
    if (mode === 'sentence-reorder') {
      resetTokens();
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
      setIsReviewMode(false);
      setView('practice');
    }
    setShowConfirmDialog(false);
  };

  const handleRestart = () => {
    reset();
    setPracticeSentenceIds(undefined);
    setIsReviewMode(false);
    awardedXPRef.current.clear();
    resetStreak();
    resetFlowState();
    sessionStartTimeRef.current = Date.now();
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

  const handleOpenProgress = () => {
    setView('progress');
  };

  const handleBackFromProfile = () => {
    setView('practice');
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

  const handleOpenChallenges = () => {
    // Trigger weekly report check when trophy entrance is clicked
    if (showWeeklyReport && !weeklyReportTrigger) {
      requestAnimationFrame(() => {
        setWeeklyReportTrigger({ key: Date.now() });
      });
    }
    setView('challenges');
  };

  const handleBackFromChallenges = () => {
    setView('practice');
  };

  const handleOpenBadges = () => {
    setView('badges');
  };

  const handleBackFromBadges = () => {
    setView('practice');
  };

  const handleOpenLeaderboard = () => {
    setView('leaderboard');
  };

  const handleBackFromLeaderboard = () => {
    setView('practice');
  };

  const handleOpenInvite = () => {
    setView('invite');
  };

  const handleBackFromInvite = () => {
    setView('practice');
  };

  const handlePracticeReview = (sentenceIds: string[], dictId: string) => {
    setDictionaryId(dictId);
    setPracticeSentenceIds(sentenceIds);
    setIsReviewMode(true);
    setView('practice');
    setReviewDueCount(storage.getReviewQueueCount());
  };

  const handleOpenWeakness = () => {
    setView('weakness');
  };

  const handleBackFromWeakness = () => {
    setView('practice');
  };

  const handlePracticeWeaknesses = (sentenceIds: string[], dictId: string) => {
    setDictionaryId(dictId);
    setPracticeSentenceIds(sentenceIds);
    setView('practice');
  };

  const handleNavigate = (newView: View) => {
    switch (newView) {
      case 'practice':
        setView('practice');
        break;
      case 'progress':
        setView('progress');
        break;
      case 'profile':
        setView('profile');
        break;
      case 'mistake-book':
        setMistakeCount(storage.getMistakeCount());
        setView('mistake-book');
        break;
      case 'history':
        setHistoryCount(storage.getHistoryCount());
        setView('history');
        break;
      case 'data':
        setView('data');
        break;
      case 'review':
        setReviewDueCount(storage.getReviewQueueCount());
        setIsReviewMode(false);
        setView('review');
        break;
      case 'weakness':
        setView('weakness');
        break;
      case 'challenges':
        setView('challenges');
        break;
      case 'badges':
        setView('badges');
        break;
      case 'leaderboard':
        setView('leaderboard');
        break;
      case 'invite':
        setView('invite');
        break;
      case 'dictionary-browser':
        setView('dictionary-browser');
        break;
    }
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
      {/* Header - hidden in focus mode */}
      {!(isFocusMode && view === 'practice' && !state.isComplete) && (
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Brand area - prevent compression with min-w-0 and flex-shrink-0 */}
          <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
            <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
              <Headphones className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-slate-800 text-base md:text-lg leading-tight truncate">{APP_BRAND.name}</h1>
              <p className="text-xs text-slate-500 hidden sm:block">{APP_BRAND.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Practice controls - visible on desktop in practice view */}
            {!state.isComplete && view === 'practice' && (
              <div className="flex items-center gap-3 flex-shrink-0">
                <XPBar level={profile.currentLevel} progress={profile.levelProgress} compact onClick={handleOpenProgress} />
                <StreakFeedback streak={streak} />
                <SessionTimer sessionStartMs={sessionStartTimeRef.current} />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenChallenges}
                  className="relative text-slate-500 gap-1 p-1"
                  data-testid="challenge-trophy-header"
                >
                  <Trophy className="w-4 h-4" />
                  {unclaimedCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
                    >
                      {unclaimedCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenBadges}
                  className="relative text-slate-500 gap-1 p-1"
                  data-testid="badge-award-header"
                >
                  <Award className="w-4 h-4" />
                  {unlockedCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
                    >
                      {unlockedCount}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenLeaderboard}
                  className="relative text-slate-500 gap-1 p-1"
                  data-testid="leaderboard-header-button"
                >
                  <TrendingUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenInvite}
                  className="relative text-slate-500 gap-1 p-1"
                  data-testid="invite-header-button"
                >
                  <Users className="w-4 h-4" />
                </Button>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-700">得分: {state.score}</p>
                </div>
              </div>
            )}

            {/* Desktop nav section - hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 flex-shrink-0 overflow-x-auto no-scrollbar">
              {view === 'practice' && (
                <>
                  <DictionarySelector
                    value={dictionaryId}
                    onChange={handleDictionaryChange}
                    disabled={state.isComplete}
                  />
                  <Button variant="ghost" size="sm" onClick={handleRestart} className="text-slate-500 shrink-0">
                    重置
                  </Button>
                </>
              )}
              <MoreMenu
                mistakeCount={mistakeCount}
                historyCount={historyCount}
                reviewDueCount={reviewDueCount}
                unclaimedCount={unclaimedCount}
                unlockedCount={unlockedCount}
                weaknessCount={weaknessStats.totalWeakCount}
                isReviewMode={isReviewMode}
                onOpenMistakeBook={handleOpenMistakeBook}
                onOpenHistory={handleOpenHistory}
                onOpenDataManager={handleOpenDataManager}
                onOpenSmartReview={handleOpenSmartReview}
                onOpenChallenges={handleOpenChallenges}
                onOpenBadges={handleOpenBadges}
                onOpenLeaderboard={handleOpenLeaderboard}
                onOpenWeakness={handleOpenWeakness}
                onOpenInvite={handleOpenInvite}
              />
              {/* Review streak indicator - desktop only */}
              <div className="hidden md:flex items-center gap-2 text-sm">
                {dueCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleOpenSmartReview}
                    className="relative text-blue-600 gap-1 p-1"
                    data-testid="review-indicator"
                  >
                    <Zap className="w-4 h-4" />
                    <span>{dueCount} 待复习</span>
                    {currentStreak > 0 && (
                      <Badge variant="outline" className="ml-1 h-5 text-xs border-orange-200 text-orange-600">
                        {currentStreak}天
                      </Badge>
                    )}
                  </Button>
                )}
                {dueCount === 0 && currentStreak > 0 && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-orange-500" />
                    连续 {currentStreak} 天
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      )}

      {/* Focus Mode Floating Bar */}
      {isFocusMode && view === 'practice' && !state.isComplete && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-700">
                第 {currentQuestion}/{totalQuestions} 题
              </span>
              <XPBar level={profile.currentLevel} progress={profile.levelProgress} compact />
              <StreakFeedback streak={streak} />
              <span className="text-sm text-slate-500">
                得分: {state.score}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFocusMode(false)}
              className="text-slate-500 gap-1"
            >
              <X className="w-4 h-4" />
              退出专注
            </Button>
          </div>
        </div>
      )}

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
              检测到您有未完成的练习进度。
            </DialogDescription>
          </DialogHeader>
          {(() => {
            const session = storage.loadSession();
            if (!session) return null;
            const dict = getDictionaryById(session.dictionaryId);
            const dictName = dict?.name || '未知词典';
            const elapsed = formatElapsedTime(session.timestamp);
            const answered = session.session.userAnswers.length;
            const currentIndex = session.session.currentIndex;
            return (
              <div className="py-4 space-y-2">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">{dictName}</span>
                  <span className="mx-2">·</span>
                  <span>{elapsed}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  已答 {answered}/{currentIndex} 题
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={handleDiscardSession}>
              放弃进度，重新开始
            </Button>
            <Button onClick={handleContinueSession}>继续练习</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Onboarding Dialog */}
      <Dialog open={showOnboardingDialog} onOpenChange={setShowOnboardingDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">欢迎使用 en-learn</DialogTitle>
            <DialogDescription>
              让我们一起开始学习英语吧！
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Feature Introduction */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">功能介绍</h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <span className="text-lg">📖</span>
                  <div>
                    <span className="font-medium">词典练习</span>
                    <p className="text-sm text-muted-foreground">选择不同词库进行针对性学习</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-lg">🎯</span>
                  <div>
                    <span className="font-medium">多种模式</span>
                    <p className="text-sm text-muted-foreground">填空、听写、选择、连词成句</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-lg">⭐</span>
                  <div>
                    <span className="font-medium">XP 等级</span>
                    <p className="text-sm text-muted-foreground">答题获取经验值，解锁成就徽章</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-lg">🏆</span>
                  <div>
                    <span className="font-medium">每日挑战</span>
                    <p className="text-sm text-muted-foreground">完成任务获得额外奖励</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-lg">🧠</span>
                  <div>
                    <span className="font-medium">智能复习</span>
                    <p className="text-sm text-muted-foreground">基于遗忘曲线自动安排复习</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Dictionary Quick Select */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">选择要学习的词典</h3>
              <div className="grid grid-cols-2 gap-2">
                {ONBOARDING_DICTIONARIES.map((dict) => (
                  <button
                    key={dict.id}
                    onClick={() => setSelectedOnboardingDictionary(dict.id)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      selectedOnboardingDictionary === dict.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                    }`}
                  >
                    <div className="font-medium">{dict.name}</div>
                    <div className="text-xs text-muted-foreground">{dict.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setDictionaryId(selectedOnboardingDictionary);
                storage.setOnboardingComplete();
                setShowOnboardingDialog(false);
              }}
              className="w-full"
              size="lg"
            >
              开始学习
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <NavigationProvider view={view} onNavigate={handleNavigate}>
        <ViewRouter
          view={view}
          onNavigate={handleNavigate}
          onBackFromProfile={handleBackFromProfile}
          onPracticeMistakes={handlePracticeMistakes}
          onBackFromMistakeBook={handleBackFromMistakeBook}
          onBackFromHistory={handleBackFromHistory}
          onBackFromDataManager={handleBackFromDataManager}
          onNavigateDataManager={handleNavigate}
          onPracticeReview={handlePracticeReview}
          onBackFromSmartReview={handleBackFromSmartReview}
          onPracticeWeaknesses={handlePracticeWeaknesses}
          onBackFromWeakness={handleBackFromWeakness}
          onBackFromEfficiency={() => handleNavigate('profile')}
          challenges={challengeState.challenges}
          onClaimReward={claimReward}
          onBackFromChallenges={handleBackFromChallenges}
          unlockedBadgeIds={unlockedIds}
          getBadgeProgress={getBadgeProgressPercent}
          onBackFromBadges={handleBackFromBadges}
          leaderboardEntries={getLeaderboardEntries(leaderboardCategory, leaderboardTimeFilter)}
          leaderboardCategory={leaderboardCategory}
          leaderboardTimeFilter={leaderboardTimeFilter}
          onLeaderboardCategoryChange={setLeaderboardCategory}
          onLeaderboardTimeFilterChange={setLeaderboardTimeFilter}
          onBackFromLeaderboard={handleBackFromLeaderboard}
          onBackFromInvite={handleBackFromInvite}
        />
        <main className={`relative max-w-4xl mx-auto px-4 pb-20 md:pb-0 ${isFocusMode ? 'py-8 md:py-16' : 'py-4 md:py-8'}`}>
          {view === 'practice' && !state.isComplete && (
            <>
              {isMobile && (
                <div className="flex items-center justify-center gap-3 mb-4">
                  <DictionarySelector
                    value={dictionaryId}
                    onChange={handleDictionaryChange}
                    disabled={state.isComplete}
                  />
                  <Button variant="ghost" size="sm" onClick={handleRestart} className="text-slate-500">
                    重置
                  </Button>
                </div>
              )}
              {!isFocusMode && (
                <div className="flex flex-col md:flex-row justify-center items-center gap-3 mb-6">
                  <div className="w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                    <ToggleGroup
                      type="single"
                      value={practiceMode}
                      onValueChange={(value) => {
                        if (value) handleModeChange(value as PracticeMode);
                      }}
                      variant="outline"
                      spacing={0}
                      className="w-max md:w-auto"
                    >
                      <ToggleGroupItem value="fill-in-blanks" aria-label="填空模式">
                        填空模式
                      </ToggleGroupItem>
                      <ToggleGroupItem value="dictation" aria-label="听写模式">
                        听写模式
                      </ToggleGroupItem>
                      <ToggleGroupItem value="multiple-choice" aria-label="选择题模式">
                        选择题模式
                      </ToggleGroupItem>
                      <ToggleGroupItem value="sentence-reorder" aria-label="连词成句">
                        连词成句
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFocusMode}
                    className="gap-2 text-slate-600"
                  >
                    <Eye className="w-4 h-4" />
                    专注模式
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={startFocusSession}
                    className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    <Sparkles className="w-4 h-4" />
                    沉浸专注
                  </Button>
                </div>
              )}
              <FlowStateBanner flowState={flowState} fatigueSignals={fatigueSignals} />
              <ProgressBar progress={progress} current={currentQuestion} total={totalQuestions} />
              <AnimatePresence mode="sync">
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
                    isFocusMode={isFocusMode}
                    playbackRate={playbackRate}
                    onSpeedChange={setPlaybackRate}
                    options={options}
                    selectedChoiceId={state.selectedChoiceId}
                    onSelectChoice={selectChoice}
                    sentenceTokens={sentenceTokens}
                    orderedTokenIds={state.orderedTokenIds}
                    onSelectToken={selectToken}
                    onDeselectToken={deselectToken}
                    onSkip={nextSentence}
                    onInputChange={setInput}
                    onCheck={checkAnswer}
                    onNext={nextSentence}
                    onRetry={retry}
                    onSpeak={handleSpeak}
                    hintLevel={hintLevel}
                    shouldShowHint={shouldShowHint}
                    isMarked={isMarked(currentSentence.blanks[0]?.word ?? '')}
                    onMark={(word, translation, english, chinese, sentenceId) => handleMarkWord(word, translation, english, chinese, sentenceId ?? currentSentence.id)}
                  />
                )}
              </AnimatePresence>

              {!isFocusMode && (
                <div className="mt-8 text-center">
                  <p className="text-sm text-slate-400">
                    {getModeHint(practiceMode)}
                  </p>
                </div>
              )}
              {xpGainTrigger && (
                <XPGainPopup
                  amount={xpGainTrigger.amount}
                  multiplier={xpGainTrigger.multiplier}
                  visible={true}
                  triggerKey={xpGainTrigger.key}
                />
              )}
            </>
          )}
          {view === 'practice' && state.isComplete && (
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
      </NavigationProvider>

      {isMobile && !isFocusMode && (
        <MobileNav
          currentView={view}
          onNavigate={handleNavigate}
          mistakeCount={mistakeCount}
          historyCount={historyCount}
          reviewDueCount={reviewDueCount}
          weaknessCount={weaknessStats.totalWeakCount}
        />
      )}

      <BadgeUnlockToast
        badge={badgeUnlockTrigger?.badge ?? null}
        onDismiss={() => setBadgeUnlockTrigger(null)}
        onShare={() => {
          if (badgeUnlockTrigger?.badge) {
            setSharePrompt({ type: 'badge', badge: badgeUnlockTrigger.badge });
          }
        }}
      />
      <SharePromptToast prompt={sharePrompt} onDismiss={() => setSharePrompt(null)} />
      <Toaster richColors position="top-center" />

      <RecallReminderToast
        status={recallStatus}
        dueCount={recallDueCount}
        onStartReview={() => handleNavigate('review')}
        onDismiss={dismissRecall}
      />

      {achievementMomentTrigger && achievementMomentTrigger.moment && (
        <AchievementToast
          moment={achievementMomentTrigger.moment}
          triggerKey={achievementMomentTrigger.key}
          onDismiss={() => {
            setAchievementMomentTrigger(null);
            acknowledgeMoment();
          }}
        />
      )}

      {weeklyReportTrigger && weeklyReport && (
        <WeeklyReportCard
          report={weeklyReport}
          triggerKey={String(weeklyReportTrigger.key)}
          onDismiss={handleDismissWeeklyReport}
          compact={false}
        />
      )}

      <FocusModeOverlay
        isOpen={isFocusSession}
        onClose={() => setIsFocusSession(false)}
        onComplete={endFocusSession}
        practiceComponent={
          view === 'practice' && !state.isComplete ? (
            <PracticeCard
              sentence={currentSentence!}
              inputs={state.currentInputs}
              showResult={state.showResult}
              isCorrect={state.isCorrect}
              attempts={state.attempts}
              isSpeaking={isSpeaking}
              currentQuestion={currentQuestion}
              totalQuestions={totalQuestions}
              mode={practiceMode}
              isFocusMode={true}
              playbackRate={playbackRate}
              onSpeedChange={setPlaybackRate}
              options={options}
              selectedChoiceId={state.selectedChoiceId}
              onSelectChoice={selectChoice}
              sentenceTokens={sentenceTokens}
              orderedTokenIds={state.orderedTokenIds}
              onSelectToken={selectToken}
              onDeselectToken={deselectToken}
              onSkip={nextSentence}
              onInputChange={setInput}
              onCheck={checkAnswer}
              onNext={nextSentence}
              onRetry={retry}
              onSpeak={handleSpeak}
              hintLevel={hintLevel}
              shouldShowHint={shouldShowHint}
              isMarked={isMarked(currentSentence!.blanks[0]?.word ?? '')}
              onMark={(word, translation, english, chinese, sentenceId) => handleMarkWord(word, translation, english, chinese, sentenceId ?? currentSentence!.id)}
            />
          ) : null
        }
        totalQuestions={totalQuestions}
        currentQuestion={currentQuestion}
      />

      {showFocusSummary && focusSessionStats && (
        <FocusSessionSummary
          stats={focusSessionStats}
          onClose={handleCloseFocusSummary}
        />
      )}
    </div>
  );
}

export default App;
