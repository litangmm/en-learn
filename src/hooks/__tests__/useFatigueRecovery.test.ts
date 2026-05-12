import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFatigueRecovery } from '../useFatigueRecovery';
import * as useFlowStateModule from '../useFlowState';

// Mock useFlowState
vi.mock('../useFlowState', () => ({
  useFlowState: vi.fn(),
}));

const mockUseFlowState = useFlowStateModule.useFlowState as ReturnType<typeof vi.fn>;

describe('useFatigueRecovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not show recovery when flow state is normal', () => {
    vi.useFakeTimers();
    mockUseFlowState.mockReturnValue({
      flowState: 'normal',
      fatigueSignals: [],
      recordCorrect: vi.fn(),
      recordWrong: vi.fn(),
      reset: vi.fn(),
      consecutiveErrors: 0,
      recentAccuracy: 0.8,
    });

    const { result } = renderHook(() => useFatigueRecovery());

    expect(result.current.showRecovery).toBe(false);
    expect(result.current.stage).toBe('none');
    vi.useRealTimers();
  });

  it('should show recovery suggestion after delay when fatigued', () => {
    vi.useFakeTimers();
    mockUseFlowState.mockReturnValue({
      flowState: 'fatigued',
      fatigueSignals: [
        { type: 'consecutive_errors', trend: 'declining', description: '连续错误 3 次', severity: 1 },
      ],
      recordCorrect: vi.fn(),
      recordWrong: vi.fn(),
      reset: vi.fn(),
      consecutiveErrors: 3,
      recentAccuracy: 0.3,
    });

    const { result } = renderHook(() => useFatigueRecovery());

    // Initially not showing
    expect(result.current.showRecovery).toBe(false);

    // Advance timer past the suggestion delay (5 seconds)
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(result.current.showRecovery).toBe(true);
    expect(result.current.stage).toBe('suggestion');
    vi.useRealTimers();
  });

  it('should recommend deep breathing for high consecutive errors', () => {
    vi.useFakeTimers();
    mockUseFlowState.mockReturnValue({
      flowState: 'fatigued',
      fatigueSignals: [
        { type: 'consecutive_errors', trend: 'declining', description: '连续错误 5 次', severity: 1 },
      ],
      recordCorrect: vi.fn(),
      recordWrong: vi.fn(),
      reset: vi.fn(),
      consecutiveErrors: 5,
      recentAccuracy: 0.2,
    });

    const { result } = renderHook(() => useFatigueRecovery());

    expect(result.current.recommendedOption).toBe('deep_breathing');
    vi.useRealTimers();
  });

  it('should recommend stretch for moderate fatigue', () => {
    vi.useFakeTimers();
    mockUseFlowState.mockReturnValue({
      flowState: 'fatigued',
      fatigueSignals: [
        { type: 'accuracy', trend: 'declining', description: '正确率下降', severity: 0.6 },
      ],
      recordCorrect: vi.fn(),
      recordWrong: vi.fn(),
      reset: vi.fn(),
      consecutiveErrors: 1,
      recentAccuracy: 0.5,
    });

    const { result } = renderHook(() => useFatigueRecovery());

    expect(result.current.recommendedOption).toBe('stretch');
    vi.useRealTimers();
  });

  it('should start recovery session with deep breathing', () => {
    vi.useFakeTimers();
    mockUseFlowState.mockReturnValue({
      flowState: 'fatigued',
      fatigueSignals: [
        { type: 'consecutive_errors', trend: 'declining', description: '连续错误 3 次', severity: 1 },
      ],
      recordCorrect: vi.fn(),
      recordWrong: vi.fn(),
      reset: vi.fn(),
      consecutiveErrors: 3,
      recentAccuracy: 0.3,
    });

    const { result } = renderHook(() => useFatigueRecovery());

    // Advance to show suggestion
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(result.current.showRecovery).toBe(true);

    // Start recovery
    act(() => {
      result.current.startRecovery('deep_breathing');
    });

    expect(result.current.stage).toBe('in_progress');
    expect(result.current.currentSession?.option).toBe('deep_breathing');
    expect(result.current.exerciseTimeRemaining).toBe(60);
    vi.useRealTimers();
  });

  it('should start recovery session with stretch', () => {
    vi.useFakeTimers();
    mockUseFlowState.mockReturnValue({
      flowState: 'fatigued',
      fatigueSignals: [
        { type: 'accuracy', trend: 'declining', description: '正确率下降', severity: 0.6 },
      ],
      recordCorrect: vi.fn(),
      recordWrong: vi.fn(),
      reset: vi.fn(),
      consecutiveErrors: 1,
      recentAccuracy: 0.5,
    });

    const { result } = renderHook(() => useFatigueRecovery());

    // Advance to show suggestion
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(result.current.showRecovery).toBe(true);

    // Start recovery
    act(() => {
      result.current.startRecovery('stretch');
    });

    expect(result.current.stage).toBe('in_progress');
    expect(result.current.currentSession?.option).toBe('stretch');
    expect(result.current.exerciseTimeRemaining).toBe(30);
    vi.useRealTimers();
  });

  it('should skip recovery and continue', () => {
    vi.useFakeTimers();
    mockUseFlowState.mockReturnValue({
      flowState: 'fatigued',
      fatigueSignals: [
        { type: 'accuracy', trend: 'declining', description: '正确率下降', severity: 0.6 },
      ],
      recordCorrect: vi.fn(),
      recordWrong: vi.fn(),
      reset: vi.fn(),
      consecutiveErrors: 1,
      recentAccuracy: 0.5,
    });

    const { result } = renderHook(() => useFatigueRecovery());

    // Advance to show suggestion
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(result.current.showRecovery).toBe(true);

    // Skip recovery
    act(() => {
      result.current.skipRecovery();
    });

    expect(result.current.showRecovery).toBe(false);
    expect(result.current.stage).toBe('none');
    expect(result.current.currentSession).toBeNull();
    vi.useRealTimers();
  });

  it('should dismiss suggestion without starting recovery', () => {
    vi.useFakeTimers();
    mockUseFlowState.mockReturnValue({
      flowState: 'fatigued',
      fatigueSignals: [
        { type: 'accuracy', trend: 'declining', description: '正确率下降', severity: 0.6 },
      ],
      recordCorrect: vi.fn(),
      recordWrong: vi.fn(),
      reset: vi.fn(),
      consecutiveErrors: 1,
      recentAccuracy: 0.5,
    });

    const { result } = renderHook(() => useFatigueRecovery());

    // Advance to show suggestion
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(result.current.showRecovery).toBe(true);

    // Dismiss suggestion
    act(() => {
      result.current.dismissSuggestion();
    });

    expect(result.current.showRecovery).toBe(false);
    expect(result.current.stage).toBe('none');
    vi.useRealTimers();
  });

  it('should complete recovery session', () => {
    vi.useFakeTimers();
    mockUseFlowState.mockReturnValue({
      flowState: 'fatigued',
      fatigueSignals: [
        { type: 'accuracy', trend: 'declining', description: '正确率下降', severity: 0.6 },
      ],
      recordCorrect: vi.fn(),
      recordWrong: vi.fn(),
      reset: vi.fn(),
      consecutiveErrors: 1,
      recentAccuracy: 0.5,
    });

    const { result } = renderHook(() => useFatigueRecovery());

    // Advance to show suggestion
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    expect(result.current.showRecovery).toBe(true);

    // Start recovery
    act(() => {
      result.current.startRecovery('stretch');
    });

    // Complete recovery
    act(() => {
      result.current.completeRecovery();
    });

    expect(result.current.stage).toBe('completed');
    vi.useRealTimers();
  });
});
