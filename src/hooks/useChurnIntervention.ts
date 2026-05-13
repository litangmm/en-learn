import { useMemo, useCallback } from 'react';
import type {
  ChurnRiskLevel,
  ChurnSignal,
  InterventionLevel,
  InterventionAction,
  Intervention,
  SnoozeConfig,
} from '@/data/types';
import { DEFAULT_SNOOZE_OPTIONS } from '@/data/types';

// ============================================================================
// Threshold Constants
// ============================================================================

/** Mapping from churn risk level to intervention level */
const RISK_TO_INTERVENTION_LEVEL: Record<ChurnRiskLevel, InterventionLevel> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
  critical: 'critical',
};

/** Mapping from intervention level to action type */
const LEVEL_TO_ACTION: Record<InterventionLevel, InterventionAction> = {
  low: 'none',
  medium: 'toast',
  high: 'banner',
  critical: 'modal',
};

// ============================================================================
// Message Generation Functions
// ============================================================================

/**
 * Generate personalized message based on intervention level and signals.
 */
function generateMessage(level: InterventionLevel, signals: ChurnSignal[]): string {
  if (signals.length === 0) {
    return '开始练习保持学习节奏';
  }

  const topSignal = signals[0];

  switch (level) {
    case 'critical':
      return `流失风险危急！${topSignal.description}。请立即行动恢复学习！`;
    case 'high':
      return `流失风险较高。${topSignal.description}。今天开始练习，避免学习中断。`;
    case 'medium':
      return `保持学习节奏。${topSignal.description}。建议今天完成一次练习。`;
    case 'low':
    default:
      return '继续加油！保持每日学习习惯。';
  }
}

/**
 * Generate CTA button text based on intervention level.
 */
function generateCtaText(level: InterventionLevel): string {
  switch (level) {
    case 'critical':
      return '立即开始';
    case 'high':
      return '开始练习';
    case 'medium':
      return '去练习';
    case 'low':
    default:
      return '继续学习';
  }
}

// ============================================================================
// Pure Calculation Functions
// ============================================================================

/**
 * Convert churn risk level to intervention level.
 */
export function getInterventionLevel(riskLevel: ChurnRiskLevel): InterventionLevel {
  return RISK_TO_INTERVENTION_LEVEL[riskLevel];
}

/**
 * Get the intervention action based on intervention level.
 */
export function getInterventionAction(level: InterventionLevel): InterventionAction {
  return LEVEL_TO_ACTION[level];
}

/**
 * Generate intervention based on risk level and signals.
 * Pure function with no side effects.
 */
export function generateIntervention(
  riskLevel: ChurnRiskLevel,
  signals: ChurnSignal[],
  snoozeOptions: SnoozeConfig[] = DEFAULT_SNOOZE_OPTIONS
): Intervention | null {
  const level = getInterventionLevel(riskLevel);
  const action = getInterventionAction(level);

  // No intervention for low risk
  if (action === 'none') {
    return null;
  }

  const message = generateMessage(level, signals);
  const ctaText = generateCtaText(level);

  return {
    id: `intervention_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    level,
    action,
    message,
    ctaText,
    snoozeOptions,
    createdAt: Date.now(),
  };
}

/**
 * Get recommended action based on intervention level and signals.
 */
export function getRecommendedAction(
  level: InterventionLevel,
  signals: ChurnSignal[]
): string {
  if (signals.length === 0) {
    return '开始练习保持学习节奏';
  }

  const topType = signals[0].type;

  switch (topType) {
    case 'session_gap':
      return level === 'critical' ? '今天开始练习恢复节奏' : '尽快开始练习';
    case 'review_backlog':
      return level === 'critical' ? '完成复习队列中的题目' : '开始复习之旅';
    case 'accuracy_drop':
      return level === 'critical' ? '通过练习巩固知识点' : '多练习提升正确率';
    case 'goal_slack':
      return level === 'critical' ? '完成今日学习目标' : '开始今日练习';
    case 'streak_broken':
      return level === 'critical' ? '开始今日练习延续 streak' : '重新开始 streak';
    default:
      return '开始练习保持学习节奏';
  }
}

// ============================================================================
// Hook Implementation
// ============================================================================

export interface UseChurnInterventionOptions {
  /** Current churn risk level */
  riskLevel: ChurnRiskLevel;
  /** All detected churn signals */
  signals: ChurnSignal[];
  /** Top risk factors for display */
  topRiskFactors: ChurnSignal[];
}

export interface UseChurnInterventionReturn {
  /** Current intervention (null if no intervention needed) */
  intervention: Intervention | null;
  /** Whether intervention panel should be shown (action === 'modal') */
  shouldShowPanel: boolean;
  /** Whether to show banner (action === 'banner') */
  shouldShowBanner: boolean;
  /** Snooze the intervention for the specified duration */
  snooze: (_duration: number) => void;
  /** Whether intervention is currently snoozed */
  isSnoozed: boolean;
  /** Clear snooze state and show intervention again */
  clearSnooze: () => void;
}

const SNOOZE_STORAGE_KEY = 'en-learn-churn-intervention-snoozed';

interface SnoozeState {
  snoozedAt: number;
  expiresAt: number;
}

/**
 * Get snooze state from localStorage.
 */
function getSnoozeState(): SnoozeState | null {
  try {
    const stored = localStorage.getItem(SNOOZE_STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as SnoozeState;
  } catch {
    return null;
  }
}

/**
 * Check if currently snoozed.
 */
function checkIsSnoozed(): boolean {
  const state = getSnoozeState();
  if (!state) return false;
  return Date.now() < state.expiresAt;
}

/**
 * Save snooze state to localStorage.
 */
function saveSnoozeState(snoozedAt: number, expiresAt: number): void {
  try {
    localStorage.setItem(SNOOZE_STORAGE_KEY, JSON.stringify({ snoozedAt, expiresAt }));
  } catch (error) {
    console.warn('[useChurnIntervention] Failed to save snooze state:', error);
  }
}

/**
 * Clear snooze state from localStorage.
 */
function clearSnoozeState(): void {
  try {
    localStorage.removeItem(SNOOZE_STORAGE_KEY);
  } catch (error) {
    console.warn('[useChurnIntervention] Failed to clear snooze state:', error);
  }
}

/**
 * Hook for managing churn intervention UI.
 * Provides intervention based on risk level and handles snooze behavior.
 */
export function useChurnIntervention({
  riskLevel,
  signals,
  topRiskFactors: _topRiskFactors,
}: UseChurnInterventionOptions): UseChurnInterventionReturn {
  // Calculate intervention
  const intervention = useMemo(() => {
    // Don't generate intervention if snoozed
    if (checkIsSnoozed()) {
      return null;
    }
    return generateIntervention(riskLevel, signals);
  }, [riskLevel, signals]);

  // Check if intervention is snoozed
  const isSnoozed = useMemo(() => checkIsSnoozed(), []);

  // Should show panel for modal action
  const shouldShowPanel = intervention?.action === 'modal';

  // Should show banner for banner action (but we already have ChurnAlertBanner for this)
  const shouldShowBanner = intervention?.action === 'banner';

  // Snooze handler
  const snooze = useCallback((duration: number) => {
    const snoozedAt = Date.now();
    const expiresAt = snoozedAt + duration;
    saveSnoozeState(snoozedAt, expiresAt);
  }, []);

  // Clear snooze handler
  const clearSnooze = useCallback(() => {
    clearSnoozeState();
  }, []);

  return {
    intervention,
    shouldShowPanel,
    shouldShowBanner,
    isSnoozed,
    snooze,
    clearSnooze,
  };
}

export default useChurnIntervention;