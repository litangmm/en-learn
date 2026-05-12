import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import type { ChurnRiskLevel, ChurnSignal } from '@/data/types';

const DISMISS_STORAGE_KEY = 'en-learn-churn-banner-dismissed';
const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000; // Dismiss for 24 hours (until next day)

interface ChurnAlertBannerProps {
  /** The current churn risk level */
  riskLevel: ChurnRiskLevel;
  /** Top risk factors to display in the banner */
  topRiskFactors: ChurnSignal[];
  /** Callback when user dismisses the banner */
  onDismiss: () => void;
  /** Callback when user clicks the CTA button */
  onEngage: () => void;
}

/**
 * Get severity styling based on risk level.
 */
function getSeverityStyle(riskLevel: ChurnRiskLevel): {
  bg: string;
  border: string;
  icon: string;
  text: string;
  button: string;
  buttonHover: string;
} {
  switch (riskLevel) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        text: 'text-red-800',
        button: 'bg-red-600 hover:bg-red-700',
        buttonHover: 'active:bg-red-800',
      };
    case 'high':
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: 'text-orange-600',
        text: 'text-orange-800',
        button: 'bg-orange-600 hover:bg-orange-700',
        buttonHover: 'active:bg-orange-800',
      };
    case 'medium':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: 'text-yellow-600',
        text: 'text-yellow-800',
        button: 'bg-yellow-600 hover:bg-yellow-700',
        buttonHover: 'active:bg-yellow-800',
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
      };
  }
}

/**
 * Get risk level label text.
 */
function getRiskLabel(riskLevel: ChurnRiskLevel): string {
  switch (riskLevel) {
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

/**
 * Get risk description based on top factors.
 */
function getRiskDescription(topFactors: ChurnSignal[]): string {
  if (topFactors.length === 0) {
    return '开始练习保持学习节奏';
  }

  // Use top factor description
  const primaryFactor = topFactors[0];
  return primaryFactor.description;
}

/**
 * Check if banner should be shown based on localStorage dismissal.
 * Returns false if dismissed within the dismiss duration.
 */
function isDismissed(): boolean {
  try {
    const stored = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!stored) return false;

    const { dismissedAt } = JSON.parse(stored);
    const now = Date.now();

    // Check if we're past the dismiss duration
    if (now - dismissedAt < DISMISS_DURATION_MS) {
      return true;
    }

    // Dismissal expired, clear it
    localStorage.removeItem(DISMISS_STORAGE_KEY);
    return false;
  } catch {
    return false;
  }
}

/**
 * Save dismissal to localStorage.
 */
function saveDismissal(): void {
  try {
    localStorage.setItem(DISMISS_STORAGE_KEY, JSON.stringify({ dismissedAt: Date.now() }));
  } catch (error) {
    console.warn('[ChurnAlertBanner] Failed to save dismissal:', error);
  }
}

/**
 * ChurnAlertBanner component.
 * Shows a dismissible banner when user has high or critical churn risk.
 * Persists dismissal until next day.
 */
export function ChurnAlertBanner({
  riskLevel,
  topRiskFactors,
  onDismiss,
  onEngage,
}: ChurnAlertBannerProps) {
  // Compute visibility: show if high/critical risk AND not dismissed
  const isHighOrCritical = riskLevel === 'high' || riskLevel === 'critical';
  const shouldShow = isHighOrCritical && !isDismissed();

  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    saveDismissal();
    onDismiss();
  }, [onDismiss]);

  const handleEngage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEngage();
  }, [onEngage]);

  const style = getSeverityStyle(riskLevel);

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
          data-testid="churn-alert-banner"
        >
          <div
            className={`${style.bg} border-b ${style.border} py-2 px-4`}
            role="alert"
            aria-live="polite"
          >
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
              {/* Left: Icon and content */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${style.icon}`} />
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${style.text}`}>
                    {getRiskLabel(riskLevel)}
                  </p>
                  <p className={`text-xs ${style.text} opacity-80 truncate`}>
                    {getRiskDescription(topRiskFactors)}
                  </p>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={handleEngage}
                  className={`flex items-center justify-center min-w-[80px] min-h-[32px] px-3 py-1.5 rounded-lg ${style.button} ${style.buttonHover} text-white text-sm font-medium transition-colors touch-manipulation`}
                  aria-label="开始练习"
                >
                  开始练习
                </button>
                <button
                  onClick={handleDismiss}
                  className={`flex items-center justify-center w-8 h-8 rounded-full ${style.text} opacity-60 hover:opacity-100 transition-opacity`}
                  aria-label="关闭"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ChurnAlertBanner;