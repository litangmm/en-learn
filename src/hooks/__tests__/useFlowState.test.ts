import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFlowState } from '../useFlowState';

describe('useFlowState', () => {
  describe('initialization', () => {
    it('should start in normal state with no answers', () => {
      const { result } = renderHook(() => useFlowState());
      expect(result.current.flowState).toBe('normal');
      expect(result.current.fatigueSignals).toHaveLength(3); // accuracy, errors, speed
      expect(result.current.consecutiveErrors).toBe(0);
      expect(result.current.recentAccuracy).toBe(0);
    });

    it('should have no severe fatigue signals at start', () => {
      const { result } = renderHook(() => useFlowState());
      const severeSignals = result.current.fatigueSignals.filter(s => s.severity > 0.5);
      expect(severeSignals).toHaveLength(0);
    });
  });

  describe('recordCorrect', () => {
    it('should stay in normal state after a few mixed answers', () => {
      const { result } = renderHook(() => useFlowState());
      act(() => { result.current.recordCorrect(); });
      expect(result.current.flowState).toBe('normal');
      expect(result.current.consecutiveErrors).toBe(0);
    });

    it('should transition to focused state after 4+ consecutive correct answers', () => {
      const { result } = renderHook(() => useFlowState());
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.recordCorrect();
        }
      });
      expect(result.current.flowState).toBe('focused');
    });

    it('should reset consecutive errors on correct answer', () => {
      const { result } = renderHook(() => useFlowState());
      act(() => { result.current.recordWrong(); });
      expect(result.current.consecutiveErrors).toBe(1);
      act(() => { result.current.recordCorrect(); });
      expect(result.current.consecutiveErrors).toBe(0);
    });

    it('should update accuracy to 100% after all correct answers', () => {
      const { result } = renderHook(() => useFlowState());
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.recordCorrect();
        }
      });
      expect(result.current.recentAccuracy).toBe(1);
    });

    it('should track accuracy with answer time', () => {
      const { result } = renderHook(() => useFlowState());
      act(() => { result.current.recordCorrect(5000); });
      act(() => { result.current.recordCorrect(4000); });
      expect(result.current.recentAccuracy).toBe(1);
    });

    it('should produce improving accuracy signal after consecutive correct', () => {
      const { result } = renderHook(() => useFlowState());
      act(() => { result.current.recordCorrect(); });
      act(() => { result.current.recordCorrect(); });
      const accuracySignal = result.current.fatigueSignals.find(s => s.type === 'accuracy');
      expect(accuracySignal?.trend).toBe('stable');
    });
  });

  describe('recordWrong', () => {
    it('should stay in normal state after 1-2 wrong answers', () => {
      const { result } = renderHook(() => useFlowState());
      act(() => { result.current.recordWrong(); });
      act(() => { result.current.recordWrong(); });
      expect(result.current.flowState).toBe('normal');
      expect(result.current.consecutiveErrors).toBe(2);
    });

    it('should transition to fatigued state after 3 consecutive wrong answers', () => {
      const { result } = renderHook(() => useFlowState());
      act(() => {
        result.current.recordWrong();
        result.current.recordWrong();
        result.current.recordWrong();
      });
      expect(result.current.flowState).toBe('fatigued');
      expect(result.current.consecutiveErrors).toBe(3);
    });

    it('should update accuracy after wrong answers', () => {
      const { result } = renderHook(() => useFlowState());
      act(() => { result.current.recordCorrect(); });
      act(() => { result.current.recordWrong(); });
      act(() => { result.current.recordWrong(); });
      // 1 correct out of 3 = 33%
      expect(result.current.recentAccuracy).toBeCloseTo(0.333, 2);
    });

    it('should produce declining accuracy signal after wrong answers', () => {
      const { result } = renderHook(() => useFlowState());
      act(() => { result.current.recordCorrect(); });
      act(() => { result.current.recordCorrect(); });
      act(() => { result.current.recordWrong(); });
      act(() => { result.current.recordWrong(); });
      const accuracySignal = result.current.fatigueSignals.find(s => s.type === 'accuracy');
      expect(accuracySignal?.trend).toBe('declining');
    });

    it('should track consecutive error severity correctly', () => {
      const { result } = renderHook(() => useFlowState());
      act(() => { result.current.recordWrong(); });
      const errorSignal1 = result.current.fatigueSignals.find(s => s.type === 'consecutive_errors');
      expect(errorSignal1?.severity).toBeCloseTo(0.333, 2);

      act(() => { result.current.recordWrong(); });
      const errorSignal2 = result.current.fatigueSignals.find(s => s.type === 'consecutive_errors');
      expect(errorSignal2?.severity).toBeCloseTo(0.667, 2);

      act(() => { result.current.recordWrong(); });
      const errorSignal3 = result.current.fatigueSignals.find(s => s.type === 'consecutive_errors');
      expect(errorSignal3?.severity).toBe(1);
    });

    it('should describe consecutive errors correctly', () => {
      const { result } = renderHook(() => useFlowState());
      act(() => { result.current.recordWrong(); });
      act(() => { result.current.recordWrong(); });
      const errorSignal = result.current.fatigueSignals.find(s => s.type === 'consecutive_errors');
      expect(errorSignal?.description).toContain('2');
    });

    it('should track answer time for speed trend', () => {
      const { result } = renderHook(() => useFlowState());
      act(() => { result.current.recordCorrect(3000); });
      act(() => { result.current.recordCorrect(2000); });
      act(() => { result.current.recordCorrect(1000); });
      act(() => { result.current.recordCorrect(5000); });
      act(() => { result.current.recordCorrect(6000); });
      // Most recent answers are slower (5000, 6000) vs earlier (3000, 2000, 1000) → declining
      const speedSignal = result.current.fatigueSignals.find(s => s.type === 'speed');
      expect(speedSignal?.trend).toBe('declining');
    });
  });

  describe('reset', () => {
    it('should reset flow state to normal', () => {
      const { result } = renderHook(() => useFlowState());
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.recordCorrect();
        }
      });
      expect(result.current.flowState).toBe('focused');
      act(() => { result.current.reset(); });
      expect(result.current.flowState).toBe('normal');
    });

    it('should reset consecutive errors to 0', () => {
      const { result } = renderHook(() => useFlowState());
      act(() => { result.current.recordWrong(); });
      act(() => { result.current.recordWrong(); });
      expect(result.current.consecutiveErrors).toBe(2);
      act(() => { result.current.reset(); });
      expect(result.current.consecutiveErrors).toBe(0);
    });

    it('should reset accuracy to 0', () => {
      const { result } = renderHook(() => useFlowState());
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.recordCorrect();
        }
      });
      expect(result.current.recentAccuracy).toBe(1);
      act(() => { result.current.reset(); });
      expect(result.current.recentAccuracy).toBe(0);
    });

    it('should clear fatigue signals after reset', () => {
      const { result } = renderHook(() => useFlowState());
      act(() => {
        for (let i = 0; i < 3; i++) {
          result.current.recordWrong();
        }
      });
      expect(result.current.flowState).toBe('fatigued');
      act(() => { result.current.reset(); });
      expect(result.current.flowState).toBe('normal');
      const severeSignals = result.current.fatigueSignals.filter(s => s.severity > 0.5);
      expect(severeSignals).toHaveLength(0);
    });
  });

  describe('flow state transitions', () => {
    it('should go: normal → focused → normal (after wrong)', () => {
      const { result } = renderHook(() => useFlowState());
      // Build up to focused
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.recordCorrect();
        }
      });
      expect(result.current.flowState).toBe('focused');

      // One wrong breaks focus
      act(() => { result.current.recordWrong(); });
      expect(result.current.flowState).toBe('normal');
    });

    it('should go: normal → fatigued after low accuracy window', () => {
      const { result } = renderHook(() => useFlowState());
      // 2 correct, 3 wrong in the last 5 → 40% accuracy → near fatigue threshold
      act(() => { result.current.recordCorrect(); });
      act(() => { result.current.recordCorrect(); });
      act(() => { result.current.recordWrong(); });
      act(() => { result.current.recordWrong(); });
      act(() => { result.current.recordWrong(); });
      expect(result.current.flowState).toBe('fatigued');
    });

    it('should recover from fatigued after correct answers', () => {
      const { result } = renderHook(() => useFlowState());
      // Get fatigued
      act(() => {
        for (let i = 0; i < 3; i++) {
          result.current.recordWrong();
        }
      });
      expect(result.current.flowState).toBe('fatigued');
      // Recover with correct answers
      act(() => { result.current.recordCorrect(); });
      act(() => { result.current.recordCorrect(); });
      act(() => { result.current.recordCorrect(); });
      act(() => { result.current.recordCorrect(); });
      act(() => { result.current.recordCorrect(); });
      expect(result.current.flowState).toBe('focused');
    });

    it('should be stable for new users (no data)', () => {
      const { result } = renderHook(() => useFlowState());
      // 1-2 answers shouldn't cause strong transitions
      act(() => { result.current.recordCorrect(); });
      expect(result.current.flowState).toBe('normal');
      act(() => { result.current.recordCorrect(); });
      expect(result.current.flowState).toBe('normal');
    });
  });

  describe('fatigue signal descriptions', () => {
    it('should include accuracy signal description', () => {
      const { result } = renderHook(() => useFlowState());
      act(() => { result.current.recordCorrect(); });
      const accuracySignal = result.current.fatigueSignals.find(s => s.type === 'accuracy');
      expect(accuracySignal?.description).toBeTruthy();
      expect(typeof accuracySignal?.description).toBe('string');
    });

    it('should include consecutive errors signal description', () => {
      const { result } = renderHook(() => useFlowState());
      const errorSignal = result.current.fatigueSignals.find(s => s.type === 'consecutive_errors');
      expect(errorSignal?.description).toBeTruthy();
      expect(errorSignal?.description).toContain('无连续错误');
    });

    it('should include speed signal description', () => {
      const { result } = renderHook(() => useFlowState());
      const speedSignal = result.current.fatigueSignals.find(s => s.type === 'speed');
      expect(speedSignal?.description).toBeTruthy();
      expect(typeof speedSignal?.description).toBe('string');
    });

    it('should describe 3+ consecutive errors as fatigued', () => {
      const { result } = renderHook(() => useFlowState());
      act(() => {
        result.current.recordWrong();
        result.current.recordWrong();
        result.current.recordWrong();
      });
      const errorSignal = result.current.fatigueSignals.find(s => s.type === 'consecutive_errors');
      expect(errorSignal?.description).toContain('需要休息');
    });
  });

  describe('rolling window behavior', () => {
    it('should only consider last 5 answers for accuracy', () => {
      const { result } = renderHook(() => useFlowState());
      // 7 answers: 3 wrong, 4 correct → last 5 are all correct → 100% in window
      act(() => { result.current.recordWrong(); });
      act(() => { result.current.recordWrong(); });
      act(() => { result.current.recordWrong(); });
      act(() => { result.current.recordCorrect(); });
      act(() => { result.current.recordCorrect(); });
      act(() => { result.current.recordCorrect(); });
      act(() => { result.current.recordCorrect(); });
      expect(result.current.flowState).toBe('focused');
    });

    it('should handle rapid correct/wrong alternation', () => {
      const { result } = renderHook(() => useFlowState());
      act(() => {
        result.current.recordCorrect();
        result.current.recordWrong();
        result.current.recordCorrect();
        result.current.recordWrong();
        result.current.recordCorrect();
      });
      // 3 correct, 2 wrong = 60% accuracy → normal state
      expect(result.current.flowState).toBe('normal');
    });
  });
});
