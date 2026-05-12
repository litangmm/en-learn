import { useState, useEffect } from 'react';
import { Coffee } from 'lucide-react';

interface SessionTimerProps {
  sessionStartMs: number;
  onBreakSuggestion?: () => void;
}

const POMODORO_DURATION_MS = 25 * 60 * 1000; // 25 minutes

/**
 * SessionTimer tracks session duration and suggests breaks at 25 minutes.
 * Uses computed elapsed time from sessionStartMs for accuracy.
 * Display format: MM:SS
 */
export function SessionTimer({ sessionStartMs, onBreakSuggestion }: SessionTimerProps) {
  const [elapsedDisplay, setElapsedDisplay] = useState('00:00');
  const [breakSuggested, setBreakSuggested] = useState(false);
  const [showBreakNotification, setShowBreakNotification] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const elapsed = Date.now() - sessionStartMs;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      setElapsedDisplay(
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );

      // Check for break suggestion at 25 minutes
      if (elapsed >= POMODORO_DURATION_MS && !breakSuggested) {
        setBreakSuggested(true);
        setShowBreakNotification(true);
        onBreakSuggestion?.();
      }
    };

    // Update immediately
    updateTimer();

    // Then update every second
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [sessionStartMs, breakSuggested, onBreakSuggestion]);

  const dismissBreakNotification = () => {
    setShowBreakNotification(false);
  };

  return (
    <>
      {/* Timer display in header */}
      <span className="text-xs text-slate-400 tabular-nums" title="练习时长">
        {elapsedDisplay}
      </span>

      {/* Break suggestion notification */}
      {showBreakNotification && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 mb-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-center shadow-lg animate-in fade-in slide-in-from-top-2"
          style={{ maxWidth: '90vw' }}
        >
          <Coffee className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="text-sm text-blue-700">你已经连续练习25分钟了，休息一下吧！</span>
          <button
            onClick={dismissBreakNotification}
            className="ml-2 text-blue-400 hover:text-blue-600 transition-colors"
            aria-label="关闭"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}