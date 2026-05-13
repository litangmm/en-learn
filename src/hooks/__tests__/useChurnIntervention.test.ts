import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChurnIntervention } from '../useChurnIntervention';
import type { ChurnSignal } from '@/data/types';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a mock churn signal.
 */
function createSignal(
  type: ChurnSignal['type'],
  severity: ChurnSignal['severity'],
  description = 'Test signal'
): ChurnSignal {
  return {
    id: `signal_${type}_${severity}`,
    type,
    severity,
    description,
    value: 1,
    threshold: 1,
    detectedAt: Date.now(),
  };
}

// ============================================================================
// getInterventionLevel Tests
// ============================================================================

import { getInterventionLevel, getInterventionAction, generateIntervention } from '../useChurnIntervention';

describe('getInterventionLevel', () => {
  it('returns low for low churn risk', () => {
    expect(getInterventionLevel('low')).toBe('low');
  });

  it('returns medium for medium churn risk', () => {
    expect(getInterventionLevel('medium')).toBe('medium');
  });

  it('returns high for high churn risk', () => {
    expect(getInterventionLevel('high')).toBe('high');
  });

  it('returns critical for critical churn risk', () => {
    expect(getInterventionLevel('critical')).toBe('critical');
  });
});

// ============================================================================
// getInterventionAction Tests
// ============================================================================

describe('getInterventionAction', () => {
  it('returns none for low intervention level', () => {
    expect(getInterventionAction('low')).toBe('none');
  });

  it('returns toast for medium intervention level', () => {
    expect(getInterventionAction('medium')).toBe('toast');
  });

  it('returns banner for high intervention level', () => {
    expect(getInterventionAction('high')).toBe('banner');
  });

  it('returns modal for critical intervention level', () => {
    expect(getInterventionAction('critical')).toBe('modal');
  });
});

// ============================================================================
// generateIntervention Tests
// ============================================================================

describe('generateIntervention', () => {
  describe('No intervention for low risk', () => {
    it('returns null when risk level is low', () => {
      const result = generateIntervention('low', []);
      expect(result).toBeNull();
    });

    it('returns null when risk level is low even with signals', () => {
      const signals = [createSignal('session_gap', 'medium')];
      const result = generateIntervention('low', signals);
      expect(result).toBeNull();
    });
  });

  describe('Intervention for medium risk', () => {
    it('returns intervention with toast action for medium risk', () => {
      const signals = [createSignal('session_gap', 'medium')];
      const result = generateIntervention('medium', signals);
      expect(result).not.toBeNull();
      expect(result!.action).toBe('toast');
      expect(result!.level).toBe('medium');
    });

    it('includes personalized message', () => {
      const signals = [createSignal('session_gap', 'medium', '已 3 天没有练习了')];
      const result = generateIntervention('medium', signals);
      expect(result!.message).toContain('保持学习节奏');
    });

    it('includes CTA text', () => {
      const result = generateIntervention('medium', []);
      expect(result!.ctaText).toBe('去练习');
    });

    it('includes snooze options', () => {
      const result = generateIntervention('medium', []);
      expect(result!.snoozeOptions).toHaveLength(3);
      expect(result!.snoozeOptions[0].duration).toBe(24 * 60 * 60 * 1000); // 24h
    });
  });

  describe('Intervention for high risk', () => {
    it('returns intervention with banner action for high risk', () => {
      const signals = [createSignal('session_gap', 'high')];
      const result = generateIntervention('high', signals);
      expect(result).not.toBeNull();
      expect(result!.action).toBe('banner');
      expect(result!.level).toBe('high');
    });

    it('has correct CTA for high risk', () => {
      const result = generateIntervention('high', []);
      expect(result!.ctaText).toBe('开始练习');
    });
  });

  describe('Intervention for critical risk', () => {
    it('returns intervention with modal action for critical risk', () => {
      const signals = [createSignal('session_gap', 'critical')];
      const result = generateIntervention('critical', signals);
      expect(result).not.toBeNull();
      expect(result!.action).toBe('modal');
      expect(result!.level).toBe('critical');
    });

    it('has urgent CTA for critical risk', () => {
      const result = generateIntervention('critical', []);
      expect(result!.ctaText).toBe('立即开始');
    });

    it('has urgent message for critical risk', () => {
      const signals = [createSignal('session_gap', 'critical', '已 7 天没有练习了')];
      const result = generateIntervention('critical', signals);
      expect(result!.message).toContain('危急');
    });
  });

  describe('Custom snooze options', () => {
    it('accepts custom snooze options', () => {
      const customOptions = [
        { duration: 1000, label: '1 second' },
        { duration: 2000, label: '2 seconds' },
      ];
      const result = generateIntervention('high', [], customOptions);
      expect(result!.snoozeOptions).toHaveLength(2);
      expect(result!.snoozeOptions[0].label).toBe('1 second');
    });
  });
});

// ============================================================================
// useChurnIntervention Hook Tests
// ============================================================================

describe('useChurnIntervention', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Clear localStorage mock
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  describe('Intervention generation', () => {
    it('returns null intervention for low risk', () => {
      const { result } = renderHook(() =>
        useChurnIntervention({
          riskLevel: 'low',
          signals: [],
          topRiskFactors: [],
        })
      );

      expect(result.current.intervention).toBeNull();
      expect(result.current.shouldShowPanel).toBe(false);
      expect(result.current.shouldShowBanner).toBe(false);
    });

    it('returns intervention with toast for medium risk', () => {
      const signals = [createSignal('session_gap', 'medium')];
      const { result } = renderHook(() =>
        useChurnIntervention({
          riskLevel: 'medium',
          signals,
          topRiskFactors: signals,
        })
      );

      expect(result.current.intervention).not.toBeNull();
      expect(result.current.intervention!.action).toBe('toast');
    });

    it('returns intervention with banner for high risk', () => {
      const signals = [createSignal('session_gap', 'high')];
      const { result } = renderHook(() =>
        useChurnIntervention({
          riskLevel: 'high',
          signals,
          topRiskFactors: signals,
        })
      );

      expect(result.current.intervention).not.toBeNull();
      expect(result.current.shouldShowBanner).toBe(true);
    });

    it('returns intervention with modal for critical risk', () => {
      const signals = [createSignal('session_gap', 'critical')];
      const { result } = renderHook(() =>
        useChurnIntervention({
          riskLevel: 'critical',
          signals,
          topRiskFactors: signals,
        })
      );

      expect(result.current.intervention).not.toBeNull();
      expect(result.current.shouldShowPanel).toBe(true);
    });
  });

  describe('Snooze behavior', () => {
    it('snooze function is callable', () => {
      const { result } = renderHook(() =>
        useChurnIntervention({
          riskLevel: 'high',
          signals: [createSignal('session_gap', 'high')],
          topRiskFactors: [],
        })
      );

      expect(typeof result.current.snooze).toBe('function');
      act(() => {
        result.current.snooze(24 * 60 * 60 * 1000); // 24 hours
      });
      // Snooze state is saved to localStorage
    });

    it('clearSnooze function is callable', () => {
      const { result } = renderHook(() =>
        useChurnIntervention({
          riskLevel: 'high',
          signals: [createSignal('session_gap', 'high')],
          topRiskFactors: [],
        })
      );

      expect(typeof result.current.clearSnooze).toBe('function');
      act(() => {
        result.current.clearSnooze();
      });
    });

    it('isSnoozed returns boolean', () => {
      const { result } = renderHook(() =>
        useChurnIntervention({
          riskLevel: 'high',
          signals: [createSignal('session_gap', 'high')],
          topRiskFactors: [],
        })
      );

      expect(typeof result.current.isSnoozed).toBe('boolean');
    });
  });
});