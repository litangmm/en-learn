import { AlertCircle, Sparkles } from 'lucide-react';
import type { FlowState, FatigueSignal } from '@/hooks/useFlowState';

interface FlowStateBannerProps {
  flowState: FlowState;
  fatigueSignals: FatigueSignal[];
}

/**
 * FlowStateBanner displays a subtle indicator when user is in focused or fatigued state.
 * - Shows warning for fatigued state with fatigue signal description
 * - Shows positive indicator for focused state
 * - Hidden for normal state
 */
export function FlowStateBanner({ flowState, fatigueSignals }: FlowStateBannerProps) {
  if (flowState === 'normal') {
    return null;
  }

  if (flowState === 'fatigued') {
    const primarySignal = fatigueSignals[0];
    return (
      <div className="mb-3 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 transition-opacity duration-300">
        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <span className="text-sm text-amber-700">{primarySignal?.description || '注意调整节奏'}</span>
      </div>
    );
  }

  if (flowState === 'focused') {
    return (
      <div className="mb-3 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 transition-opacity duration-300">
        <Sparkles className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        <span className="text-sm text-emerald-700">专注状态，继续保持</span>
      </div>
    );
  }

  return null;
}