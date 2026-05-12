import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useProgressStats } from '../useProgressStats';
import { storage } from '@/services/storage';

describe('useProgressStats', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns default values for new user', () => {
    const { result } = renderHook(() => useProgressStats());

    expect(result.current.level).toBe(1);
    expect(result.current.totalXP).toBe(0);
    expect(result.current.currentXP).toBe(0);
    expect(result.current.progressToNextLevel).toBe(0);
    expect(result.current.learningDays).toBe(0);
    expect(result.current.totalAccuracy).toBe(0);
    expect(result.current.completedDictionaries).toBe(0);
    expect(result.current.totalQuestions).toBe(0);
    expect(result.current.totalCorrect).toBe(0);
  });

  it('derives XP level from storage', () => {
    storage.updateXPProfile({ totalXP: 150, currentLevel: 2, levelProgress: 50 });

    const { result } = renderHook(() => useProgressStats());

    expect(result.current.level).toBe(2);
    expect(result.current.totalXP).toBe(150);
  });

  it('calculates learning days from history', () => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Add history entries across 3 different days
    storage.addHistory({
      id: 'session-1',
      timestamp: now - 2 * oneDayMs,
      duration: 300,
      dictionaryId: 'cet4',
      dictionaryName: 'CET-4',
      score: 80,
      totalQuestions: 10,
      correctCount: 8,
      accuracy: 80,
    });
    storage.addHistory({
      id: 'session-2',
      timestamp: now - oneDayMs,
      duration: 300,
      dictionaryId: 'cet4',
      dictionaryName: 'CET-4',
      score: 90,
      totalQuestions: 10,
      correctCount: 9,
      accuracy: 90,
    });
    storage.addHistory({
      id: 'session-3',
      timestamp: now,
      duration: 300,
      dictionaryId: 'cet6',
      dictionaryName: 'CET-6',
      score: 100,
      totalQuestions: 10,
      correctCount: 10,
      accuracy: 100,
    });

    const { result } = renderHook(() => useProgressStats());

    expect(result.current.learningDays).toBe(3);
  });

  it('calculates total accuracy from history', () => {
    storage.addHistory({
      id: 'session-1',
      timestamp: Date.now(),
      duration: 300,
      dictionaryId: 'cet4',
      dictionaryName: 'CET-4',
      score: 80,
      totalQuestions: 10,
      correctCount: 8,
      accuracy: 80,
    });
    storage.addHistory({
      id: 'session-2',
      timestamp: Date.now() - 86400000,
      duration: 300,
      dictionaryId: 'cet4',
      dictionaryName: 'CET-4',
      score: 90,
      totalQuestions: 10,
      correctCount: 7,
      accuracy: 70,
    });

    const { result } = renderHook(() => useProgressStats());

    // (8 + 7) / (10 + 10) = 15/20 = 75%
    expect(result.current.totalAccuracy).toBe(75);
  });

  it('counts completed dictionaries from history', () => {
    storage.addHistory({
      id: 'session-1',
      timestamp: Date.now(),
      duration: 300,
      dictionaryId: 'cet4',
      dictionaryName: 'CET-4',
      score: 80,
      totalQuestions: 10,
      correctCount: 8,
      accuracy: 80,
    });
    storage.addHistory({
      id: 'session-2',
      timestamp: Date.now() - 86400000,
      duration: 300,
      dictionaryId: 'cet6',
      dictionaryName: 'CET-6',
      score: 90,
      totalQuestions: 10,
      correctCount: 9,
      accuracy: 90,
    });

    const { result } = renderHook(() => useProgressStats());

    expect(result.current.completedDictionaries).toBe(2);
  });

  it('returns max progress for max level', () => {
    storage.updateXPProfile({ totalXP: 5000, currentLevel: 12, levelProgress: 100 });

    const { result } = renderHook(() => useProgressStats());

    expect(result.current.level).toBe(12);
    expect(result.current.progressToNextLevel).toBe(100);
  });

  it('includes badge progress in totals', () => {
    const badgeProgress = storage.getBadgeProgress();
    badgeProgress.totalAnswered = 20;
    badgeProgress.totalCorrect = 18;
    storage.saveBadgeProgress(badgeProgress);

    const { result } = renderHook(() => useProgressStats());

    expect(result.current.totalQuestions).toBe(20);
    expect(result.current.totalCorrect).toBe(18);
  });
});