import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Clock, Zap } from 'lucide-react';
import type { InterventionLevel, SnoozeConfig, Intervention } from '@/data/types';

interface InterventionPanelProps {
  /** The intervention data to display */
  intervention: Intervention;
  /** Callback when user engages (clicks CTA) */
  onEngage: () => void;
  /** Callback when user dismisses the panel */
  onDismiss: () => void;
  /** Callback when user snoozes the intervention */
  onSnooze: (_duration: number) => void;
  /** Available snooze options */
  snoozeOptions?: SnoozeConfig[];
}

/**
 * Get severity styling based on intervention level.
 */
function getSeverityStyle(level: InterventionLevel): {
  bg: string;
  border: string;
  icon: string;
  text: string;
  button: string;
  buttonHover: string;
  accent: string;
} {
  switch (level) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        text: 'text-red-800',
        button: 'bg-red-600 hover:bg-red-700',
        buttonHover: 'active:bg-red-800',
        accent: 'bg-red-100',
      };
    case 'high':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: 'text-orange-600',
        text: 'text-orange-800',
        button: 'bg-orange-600 hover:bg-orange-700',
        buttonHover: 'active:bg-orange-800',
        accent: 'bg-orange-100',
      };
    case 'medium':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: 'text-yellow-600',
        text: 'text-yellow-800',
        button: 'bg-yellow-600 hover:bg-yellow-700',
        buttonHover: 'active:bg-yellow-800',
        accent: 'bg-yellow-100',
      };
    case 'low':
    default:
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        text: 'text-blue-800',
        button: 'bg-blue-600 hover:bg-blue-700',
        buttonHover: 'active:bg-blue-800',
        accent: 'bg-blue-100',
      };
  }
}

/**
 * Get intervention level label.
 */
function getLevelLabel(level: InterventionLevel): string {
  switch (level) {
    case 'critical':
      return '流失风险：危急';
    case 'high':
      return '流失风险：较高';
    case 'medium':
      return '流失风险：中等';
    case 'low':
    default:
      return '流失风险：较低';
  }
}

export function InterventionPanel({
  intervention,
  onEngage,
  onDismiss,
  onSnooze,
  snoozeOptions = [],
}: InterventionPanelProps) {
  const style = getSeverityStyle(intervention.level);

  const handleEngage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEngage();
  }, [onEngage]);

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss();
  }, [onDismiss]);

  const handleSnooze = useCallback((e: React.MouseEvent, duration: number) => {
    e.stopPropagation();
    onSnooze(duration);
  }, [onSnooze]);

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={handleDismiss}
        data-testid="intervention-panel-backdrop"
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-50"
        data-testid="intervention-panel"
      >
        <div className={`${style.bg} ${style.border} border-2 rounded-2xl shadow-2xl overflow-hidden`}>
          {/* Header */}
          <div className={`${style.accent} px-6 py-4 flex items-start justify-between`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${style.bg}`}>
                <AlertTriangle className={`w-5 h-5 ${style.icon}`} />
              </div>
              <div>
                <h2 className={`text-lg font-semibold ${style.text}`}>
                  {getLevelLabel(intervention.level)}
                </h2>
                <p className={`text-sm ${style.text} opacity-70`}>
                  我们想帮你保持学习节奏
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${style.text} opacity-50 hover:opacity-100 transition-opacity`}
              aria-label="关闭"
              data-testid="intervention-panel-dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            <p className={`text-base ${style.text} leading-relaxed`}>
              {intervention.message}
            </p>

            {/* Motivational icon */}
            <div className="mt-4 flex justify-center">
              <div className={`w-16 h-16 rounded-full ${style.accent} flex items-center justify-center`}>
                <Zap className={`w-8 h-8 ${style.icon}`} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-white/50">
            {/* Primary CTA */}
            <button
              onClick={handleEngage}
              className={`w-full min-h-[48px] px-6 py-3 rounded-xl ${style.button} ${style.buttonHover} text-white font-semibold text-base transition-colors touch-manipulation flex items-center justify-center gap-2`}
              data-testid="intervention-panel-engage"
            >
              <Zap className="w-5 h-5" />
              {intervention.ctaText}
            </button>

            {/* Snooze options */}
            {snoozeOptions.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {snoozeOptions.map((option, index) => (
                  <button
                    key={`snooze-${index}`}
                    onClick={(e) => handleSnooze(e, option.duration)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm ${style.text} opacity-70 hover:opacity-100 hover:bg-white/50 transition-opacity`}
                    data-testid={`intervention-panel-snooze-${index}`}
                    title={option.duration ? `${option.duration / (1000 * 60 * 60)} 小时` : undefined}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default InterventionPanel;