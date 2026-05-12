import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FocusModeOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (stats: FocusSessionStats) => void;
  practiceComponent: React.ReactNode;
  totalQuestions: number;
  currentQuestion?: number;
}

export interface FocusSessionStats {
  duration: number; // seconds
  questionsCompleted: number;
  accuracy: number; // percentage
}

export function FocusModeOverlay({
  isOpen,
  onClose,
  onComplete,
  practiceComponent,
  totalQuestions,
  currentQuestion = 0,
}: FocusModeOverlayProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef<number>(0);
  const questionsCompletedRef = useRef<number>(0);

  // Initialize start time on mount
  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  // Timer effect
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExit = useCallback(() => {
    const stats: FocusSessionStats = {
      duration: elapsedSeconds,
      questionsCompleted: questionsCompletedRef.current,
      accuracy: 0, // Calculated via parent
    };
    onComplete(stats);
    onClose();
  }, [elapsedSeconds, onComplete, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"
      >
        {/* Frosted overlay pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtNS4xMDQgMC05LjMxMiAyLjQ2Ni0xMS44MSA2LjM1NWMtMi40NzUgMy44NDUtMi40NzUgOS40MTMgMCAxMy4yNTlhOC44NjIgOC44NjIgMCAwMS0xMS44MS02LjM1NUMyMC40MSA1LjQ3NyAyNS40NTggMCAzNiAwYy0xMC41NDMgMC0xOS4wODQgOC41MzctMTkuMDg0IDE5LjA4NHMyMjguNTM3IDE5LjA4NCAxOS4wODRjNS4xMDQgMCA5LjMxMi0yLjQ2NiAxMS44MS02LjM1NWMxLjQ0OS0yLjMyMSAxLjQ0OS01LjM4NSAwLTcuNzA2QTUuNTMgNS41MyAwIDAxIDM2IDE4eiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjAyIi8+PC9nPjwvc3ZnPg==')] opacity-40 pointer-events-none" />

        {/* Top bar with stats */}
        <div className="absolute top-0 left-0 right-0 px-4 py-3 flex items-center justify-between z-10">
          {/* Timer */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full">
            <Clock className="w-4 h-4 text-indigo-300" />
            <span className="text-white font-mono text-lg">{formatTime(elapsedSeconds)}</span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full">
              <Target className="w-4 h-4 text-amber-400" />
              <span className="text-white/80 text-sm">{currentQuestion}/{totalQuestions} 题</span>
            </div>
          </div>

          {/* Exit button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExit}
            aria-label="退出专注模式"
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Main content area */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="w-full max-w-2xl">
            {practiceComponent}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
