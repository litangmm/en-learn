import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHintLevel } from '../useHintLevel';
import { storage } from '@/services/storage';
import { DEFAULT_HINT_CONFIG, HINT_ADJUSTMENT_THRESHOLDS } from '@/data/types';

describe('useHintLevel', () => {
  // Mutable mock state to simulate storage behavior
  let mockHintConfig: { level: 'none' | 'low' | 'medium' | 'high'; consecutiveCorrect: number; consecutiveWrong: number };

  beforeEach(() => {
    mockHintConfig = { ...DEFAULT_HINT_CONFIG };
    vi.spyOn(storage, 'getHintConfig').mockImplementation(() => ({ ...mockHintConfig }));
    vi.spyOn(storage, 'setHintConfig').mockImplementation((config) => {
      mockHintConfig = { ...config };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default medium level', () => {
      const { result } = renderHook(() => useHintLevel());

      expect(result.current.hintLevel).toBe('medium');
      expect(result.current.config.level).toBe('medium');
    });

    it('should initialize with zero consecutive counts', () => {
      const { result } = renderHook(() => useHintLevel());

      expect(result.current.config.consecutiveCorrect).toBe(0);
      expect(result.current.config.consecutiveWrong).toBe(0);
    });

    it('should load from storage if available', () => {
      mockHintConfig = {
        level: 'high',
        consecutiveCorrect: 3,
        consecutiveWrong: 0,
      };

      const { result } = renderHook(() => useHintLevel());

      expect(result.current.hintLevel).toBe('high');
      expect(result.current.config.consecutiveCorrect).toBe(3);
    });
  });

  describe('recordCorrectAnswer', () => {
    it('should increment consecutive correct count', () => {
      const { result } = renderHook(() => useHintLevel());

      act(() => {
        result.current.recordCorrectAnswer();
      });

      expect(result.current.config.consecutiveCorrect).toBe(1);
      expect(result.current.config.consecutiveWrong).toBe(0);
    });

    it('should reset consecutive wrong count on correct answer', () => {
      mockHintConfig = {
        level: 'medium',
        consecutiveCorrect: 0,
        consecutiveWrong: 2,
      };

      const { result } = renderHook(() => useHintLevel());

      act(() => {
        result.current.recordCorrectAnswer();
      });

      expect(result.current.config.consecutiveCorrect).toBe(1);
      expect(result.current.config.consecutiveWrong).toBe(0);
    });

    it('should increase to high level after 5 consecutive correct answers', () => {
      const { result } = renderHook(() => useHintLevel());

      act(() => {
        for (let i = 0; i < HINT_ADJUSTMENT_THRESHOLDS.correctToHigh; i++) {
          result.current.recordCorrectAnswer();
        }
      });

      expect(result.current.hintLevel).toBe('high');
      expect(result.current.config.consecutiveCorrect).toBe(
        HINT_ADJUSTMENT_THRESHOLDS.correctToHigh
      );
    });

    it('should not change level before reaching threshold', () => {
      const { result } = renderHook(() => useHintLevel());

      act(() => {
        for (let i = 0; i < HINT_ADJUSTMENT_THRESHOLDS.correctToHigh - 1; i++) {
          result.current.recordCorrectAnswer();
        }
      });

      expect(result.current.hintLevel).toBe('medium');
    });

    it('should persist config after recording', () => {
      const setHintConfigSpy = vi.spyOn(storage, 'setHintConfig');
      const { result } = renderHook(() => useHintLevel());

      act(() => {
        result.current.recordCorrectAnswer();
      });

      expect(setHintConfigSpy).toHaveBeenCalledWith({
        level: 'medium',
        consecutiveCorrect: 1,
        consecutiveWrong: 0,
      });
    });
  });

  describe('recordWrongAnswer', () => {
    it('should increment consecutive wrong count', () => {
      const { result } = renderHook(() => useHintLevel());

      act(() => {
        result.current.recordWrongAnswer();
      });

      expect(result.current.config.consecutiveWrong).toBe(1);
      expect(result.current.config.consecutiveCorrect).toBe(0);
    });

    it('should reset consecutive correct count on wrong answer', () => {
      mockHintConfig = {
        level: 'medium',
        consecutiveCorrect: 3,
        consecutiveWrong: 0,
      };

      const { result } = renderHook(() => useHintLevel());

      act(() => {
        result.current.recordWrongAnswer();
      });

      expect(result.current.config.consecutiveCorrect).toBe(0);
      expect(result.current.config.consecutiveWrong).toBe(1);
    });

    it('should decrease to none level after 3 consecutive wrong answers', () => {
      const { result } = renderHook(() => useHintLevel());

      act(() => {
        for (let i = 0; i < HINT_ADJUSTMENT_THRESHOLDS.wrongToNone; i++) {
          result.current.recordWrongAnswer();
        }
      });

      expect(result.current.hintLevel).toBe('none');
      expect(result.current.config.consecutiveWrong).toBe(
        HINT_ADJUSTMENT_THRESHOLDS.wrongToNone
      );
    });

    it('should not change level before reaching threshold', () => {
      const { result } = renderHook(() => useHintLevel());

      act(() => {
        for (let i = 0; i < HINT_ADJUSTMENT_THRESHOLDS.wrongToNone - 1; i++) {
          result.current.recordWrongAnswer();
        }
      });

      expect(result.current.hintLevel).toBe('medium');
    });

    it('should persist config after recording', () => {
      const setHintConfigSpy = vi.spyOn(storage, 'setHintConfig');
      const { result } = renderHook(() => useHintLevel());

      act(() => {
        result.current.recordWrongAnswer();
      });

      expect(setHintConfigSpy).toHaveBeenCalledWith({
        level: 'medium',
        consecutiveCorrect: 0,
        consecutiveWrong: 1,
      });
    });
  });

  describe('setHintLevel (manual override)', () => {
    it('should allow manual override to none', () => {
      const { result } = renderHook(() => useHintLevel());

      act(() => {
        result.current.setHintLevel('none');
      });

      expect(result.current.hintLevel).toBe('none');
    });

    it('should allow manual override to low', () => {
      const { result } = renderHook(() => useHintLevel());

      act(() => {
        result.current.setHintLevel('low');
      });

      expect(result.current.hintLevel).toBe('low');
    });

    it('should allow manual override to high', () => {
      const { result } = renderHook(() => useHintLevel());

      act(() => {
        result.current.setHintLevel('high');
      });

      expect(result.current.hintLevel).toBe('high');
    });

    it('should reset consecutive counts on manual override', () => {
      mockHintConfig = {
        level: 'high',
        consecutiveCorrect: 5,
        consecutiveWrong: 0,
      };

      const { result } = renderHook(() => useHintLevel());

      act(() => {
        result.current.setHintLevel('low');
      });

      expect(result.current.config.consecutiveCorrect).toBe(0);
      expect(result.current.config.consecutiveWrong).toBe(0);
    });

    it('should persist manual override to storage', () => {
      const setHintConfigSpy = vi.spyOn(storage, 'setHintConfig');
      const { result } = renderHook(() => useHintLevel());

      act(() => {
        result.current.setHintLevel('high');
      });

      expect(setHintConfigSpy).toHaveBeenCalledWith({
        level: 'high',
        consecutiveCorrect: 0,
        consecutiveWrong: 0,
      });
    });
  });

  describe('shouldShowHint', () => {
    it('should always return false at none level', () => {
      mockHintConfig = {
        level: 'none',
        consecutiveCorrect: 0,
        consecutiveWrong: 0,
      };

      const { result } = renderHook(() => useHintLevel());

      // Multiple calls should all be false
      expect(result.current.shouldShowHint()).toBe(false);
      expect(result.current.shouldShowHint()).toBe(false);
    });

    it('should always return true at high level', () => {
      mockHintConfig = {
        level: 'high',
        consecutiveCorrect: 5,
        consecutiveWrong: 0,
      };

      const { result } = renderHook(() => useHintLevel());

      expect(result.current.shouldShowHint()).toBe(true);
    });

    it('should return true probabilistically at low level (20%)', () => {
      mockHintConfig = {
        level: 'low',
        consecutiveCorrect: 0,
        consecutiveWrong: 0,
      };

      // Mock Math.random before rendering the hook
      vi.spyOn(Math, 'random').mockReturnValue(0.1);

      const { result } = renderHook(() => useHintLevel());

      // With random mocked to 0.1 (< 0.2), should show hint
      expect(result.current.shouldShowHint()).toBe(true);

      // With random mocked to 0.5 (> 0.2), should NOT show hint
      vi.spyOn(Math, 'random').mockReturnValue(0.5);
      expect(result.current.shouldShowHint()).toBe(false);
    });

    it('should return true probabilistically at medium level (50%)', () => {
      mockHintConfig = {
        level: 'medium',
        consecutiveCorrect: 0,
        consecutiveWrong: 0,
      };

      const { result } = renderHook(() => useHintLevel());

      // With random mocked to 0.3 (below 0.5), should show hint
      vi.spyOn(Math, 'random').mockReturnValue(0.3);
      expect(result.current.shouldShowHint()).toBe(true);

      // With random mocked to 0.7 (above 0.5), should NOT show hint
      vi.spyOn(Math, 'random').mockReturnValue(0.7);
      expect(result.current.shouldShowHint()).toBe(false);
    });

    it('should be deterministic with fixed random values', () => {
      mockHintConfig = {
        level: 'medium',
        consecutiveCorrect: 0,
        consecutiveWrong: 0,
      };

      const { result } = renderHook(() => useHintLevel());

      // Same random value should produce same result
      vi.spyOn(Math, 'random').mockReturnValue(0.3);
      const result1 = result.current.shouldShowHint();

      vi.spyOn(Math, 'random').mockReturnValue(0.3);
      const result2 = result.current.shouldShowHint();

      expect(result1).toBe(result2);
    });
  });

  describe('reset', () => {
    it('should reset level to medium', () => {
      mockHintConfig = {
        level: 'high',
        consecutiveCorrect: 5,
        consecutiveWrong: 0,
      };

      const { result } = renderHook(() => useHintLevel());

      act(() => {
        result.current.reset();
      });

      expect(result.current.hintLevel).toBe('medium');
    });

    it('should reset consecutive counts to zero', () => {
      mockHintConfig = {
        level: 'none',
        consecutiveCorrect: 0,
        consecutiveWrong: 3,
      };

      const { result } = renderHook(() => useHintLevel());

      act(() => {
        result.current.reset();
      });

      expect(result.current.config.consecutiveCorrect).toBe(0);
      expect(result.current.config.consecutiveWrong).toBe(0);
    });

    it('should persist reset config to storage', () => {
      const setHintConfigSpy = vi.spyOn(storage, 'setHintConfig');
      const { result } = renderHook(() => useHintLevel());

      act(() => {
        result.current.reset();
      });

      expect(setHintConfigSpy).toHaveBeenCalledWith({
        level: 'medium',
        consecutiveCorrect: 0,
        consecutiveWrong: 0,
      });
    });
  });

  describe('level transition scenarios', () => {
    it('should handle correct-wrong-correct-correct cycle', () => {
      const { result } = renderHook(() => useHintLevel());

      act(() => {
        // Correct (count: 1)
        result.current.recordCorrectAnswer();
      });
      expect(result.current.config.consecutiveCorrect).toBe(1);

      act(() => {
        // Wrong (resets correct count)
        result.current.recordWrongAnswer();
      });
      expect(result.current.config.consecutiveCorrect).toBe(0);
      expect(result.current.config.consecutiveWrong).toBe(1);

      act(() => {
        // Correct (new streak)
        result.current.recordCorrectAnswer();
      });
      expect(result.current.config.consecutiveCorrect).toBe(1);
      expect(result.current.config.consecutiveWrong).toBe(0);

      act(() => {
        // Correct (streak continues)
        result.current.recordCorrectAnswer();
      });
      expect(result.current.config.consecutiveCorrect).toBe(2);
    });

    it('should eventually trigger high after consecutive correct answers', () => {
      const { result } = renderHook(() => useHintLevel());

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.recordCorrectAnswer();
        }
      });

      expect(result.current.hintLevel).toBe('high');
    });

    it('should eventually trigger none after consecutive wrong answers', () => {
      const { result } = renderHook(() => useHintLevel());

      act(() => {
        for (let i = 0; i < 3; i++) {
          result.current.recordWrongAnswer();
        }
      });

      expect(result.current.hintLevel).toBe('none');
    });

    it('should allow manual override even after auto-adjustment', () => {
      const { result } = renderHook(() => useHintLevel());

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.recordCorrectAnswer();
        }
      });
      expect(result.current.hintLevel).toBe('high');

      act(() => {
        result.current.setHintLevel('none');
      });
      expect(result.current.hintLevel).toBe('none');
    });
  });
});
