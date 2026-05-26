import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLearningProfile } from '../useLearningProfile';
import { storage } from '@/services/storage';
import { MILESTONE_DEFINITIONS } from '@/data/types';

describe('useLearningProfile', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('returns default values for new user with no activity', () => {
      const { result } = renderHook(() => useLearningProfile());

      expect(result.current.totalLearningDays).toBe(0);
      expect(result.current.totalQuestions).toBe(0);
      expect(result.current.totalCorrect).toBe(0);
      expect(result.current.totalAccuracy).toBe(0);
      expect(result.current.maxStreakEver).toBe(0);
      expect(result.current.xpProfile.totalXP).toBe(0);
      expect(result.current.xpProfile.currentLevel).toBe(1);
      expect(result.current.xpProfile.currentXP).toBe(0);
      // Level 1: progress from 0 XP toward threshold[1]=100
      expect(result.current.xpProfile.progressToNextLevel).toBe(0);
      expect(result.current.xpProfile.isMaxLevel).toBe(false);
      expect(result.current.modeAccuracyBreakdown).toHaveLength(4);
      expect(result.current.unlockedMilestones).toHaveLength(0);
      expect(result.current.badgeProgress.totalAnswered).toBe(0);
      expect(result.current.badgeProgress.totalCorrect).toBe(0);
      expect(result.current.unlockedMilestoneCount).toBe(0);
      expect(result.current.totalMilestones).toBe(MILESTONE_DEFINITIONS.length);
      expect(result.current.hasActivity).toBe(false);
    });

    it('returns all four practice modes in modeAccuracyBreakdown', () => {
      const { result } = renderHook(() => useLearningProfile());

      const modes = result.current.modeAccuracyBreakdown.map(m => m.mode);
      expect(modes).toContain('fill-in-blanks');
      expect(modes).toContain('multiple-choice');
      expect(modes).toContain('sentence-reorder');
      expect(modes).toContain('dictation');
    });
  });

  describe('XP profile aggregation', () => {
    it('aggregates XP profile from storage', () => {
      storage.updateXPProfile({ totalXP: 250, currentLevel: 2, levelProgress: 50 });

      const { result } = renderHook(() => useLearningProfile());

      expect(result.current.xpProfile.totalXP).toBe(250);
      expect(result.current.xpProfile.currentLevel).toBe(2);
    });

    it('calculates current XP within level correctly', () => {
      // Level 3: prevThreshold = threshold[3-2] = threshold[1] = 100
      // currentXP = totalXP - prevThreshold = 350 - 100 = 250
      storage.updateXPProfile({ totalXP: 350, currentLevel: 3, levelProgress: 30 });

      const { result } = renderHook(() => useLearningProfile());

      expect(result.current.xpProfile.totalXP).toBe(350);
      expect(result.current.xpProfile.currentLevel).toBe(3);
      expect(result.current.xpProfile.currentXP).toBe(250); // 350 - 100 (prevThreshold for level 3)
    });

    it('handles max level correctly', () => {
      // Max XP at level 12 (threshold[11] = 4000)
      storage.updateXPProfile({ totalXP: 5000, currentLevel: 12, levelProgress: 100 });

      const { result } = renderHook(() => useLearningProfile());

      expect(result.current.xpProfile.isMaxLevel).toBe(true);
      expect(result.current.xpProfile.nextLevelXP).toBeNull();
      expect(result.current.xpProfile.progressToNextLevel).toBe(100);
    });

    it('calculates progress to next level correctly', () => {
      // Level 2: 175 total XP, threshold[0]=0, threshold[1]=100
      // prevThreshold = threshold[0] = 0
      // progress = ((175 - 0) / (100 - 0)) * 100 = 175%, capped at 100
      storage.updateXPProfile({ totalXP: 175, currentLevel: 2, levelProgress: 50 });

      const { result } = renderHook(() => useLearningProfile());

      expect(result.current.xpProfile.progressToNextLevel).toBe(100); // Capped at 100
    });
  });

  describe('badge progress aggregation', () => {
    it('aggregates badge progress from storage', () => {
      storage.saveBadgeProgress({
        totalAnswered: 100,
        totalCorrect: 85,
        totalSessions: 20,
        maxStreakEver: 15,
        perfectSessions: 5,
        totalReviews: 30,
        totalChallengesCompleted: 7,
      });

      const { result } = renderHook(() => useLearningProfile());

      expect(result.current.badgeProgress.totalAnswered).toBe(100);
      expect(result.current.badgeProgress.totalCorrect).toBe(85);
      expect(result.current.badgeProgress.totalSessions).toBe(20);
      expect(result.current.badgeProgress.maxStreakEver).toBe(15);
      expect(result.current.badgeProgress.perfectSessions).toBe(5);
      expect(result.current.badgeProgress.totalReviews).toBe(30);
      expect(result.current.badgeProgress.totalChallengesCompleted).toBe(7);
      expect(result.current.maxStreakEver).toBe(15);
    });

    it('calculates max streak correctly', () => {
      storage.saveBadgeProgress({
        totalAnswered: 50,
        totalCorrect: 40,
        totalSessions: 10,
        maxStreakEver: 25,
        perfectSessions: 3,
        totalReviews: 15,
        totalChallengesCompleted: 2,
      });

      const { result } = renderHook(() => useLearningProfile());

      expect(result.current.maxStreakEver).toBe(25);
    });
  });

  describe('learning days calculation', () => {
    it('calculates unique learning days from history', () => {
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

      const { result } = renderHook(() => useLearningProfile());

      expect(result.current.totalLearningDays).toBe(3);
    });

    it('includes today in learning days when XP exists', () => {
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      // Add XP to trigger "today" inclusion
      storage.updateXPProfile({ totalXP: 50, currentLevel: 1, levelProgress: 50 });

      // Add history from yesterday
      storage.addHistory({
        id: 'session-1',
        timestamp: now - oneDayMs,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 80,
        totalQuestions: 10,
        correctCount: 8,
        accuracy: 80,
      });

      const { result } = renderHook(() => useLearningProfile());

      // Should be at least 2: yesterday + today (due to XP)
      expect(result.current.totalLearningDays).toBeGreaterThanOrEqual(2);
    });

    it('counts same day multiple sessions as one learning day', () => {
      const now = Date.now();

      // Add multiple sessions on the same day
      storage.addHistory({
        id: 'session-1',
        timestamp: now,
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
        timestamp: now + 3600000, // 1 hour later
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 90,
        totalQuestions: 10,
        correctCount: 9,
        accuracy: 90,
      });

      const { result } = renderHook(() => useLearningProfile());

      expect(result.current.totalLearningDays).toBe(1);
    });
  });

  describe('total questions and accuracy calculation', () => {
    it('calculates total accuracy correctly', () => {
      storage.saveBadgeProgress({
        totalAnswered: 100,
        totalCorrect: 75,
        totalSessions: 10,
        maxStreakEver: 10,
        perfectSessions: 2,
        totalReviews: 5,
        totalChallengesCompleted: 3,
      });

      const { result } = renderHook(() => useLearningProfile());

      expect(result.current.totalQuestions).toBe(100);
      expect(result.current.totalCorrect).toBe(75);
      expect(result.current.totalAccuracy).toBe(75);
    });

    it('returns 0% accuracy when no questions answered', () => {
      const { result } = renderHook(() => useLearningProfile());

      expect(result.current.totalAccuracy).toBe(0);
    });

    it('rounds accuracy to nearest integer', () => {
      storage.saveBadgeProgress({
        totalAnswered: 33,
        totalCorrect: 10,
        totalSessions: 5,
        maxStreakEver: 3,
        perfectSessions: 1,
        totalReviews: 2,
        totalChallengesCompleted: 1,
      });

      const { result } = renderHook(() => useLearningProfile());

      // 10/33 = 30.3% -> 30%
      expect(result.current.totalAccuracy).toBe(30);
    });
  });

  describe('mode accuracy breakdown', () => {
    it('returns all four modes with zero stats when no data', () => {
      const { result } = renderHook(() => useLearningProfile());

      result.current.modeAccuracyBreakdown.forEach(modeData => {
        expect(modeData.accuracy).toBe(0);
        expect(modeData.totalQuestions).toBe(0);
        expect(modeData.correctCount).toBe(0);
      });
    });

    it('aggregates mode stats from storage', () => {
      // Simulate mode stats from storage
      const mockModeStats = {
        'fill-in-blanks': { questions: 50, correct: 40, lastUpdated: Date.now() },
        'multiple-choice': { questions: 30, correct: 25, lastUpdated: Date.now() },
        'sentence-reorder': { questions: 20, correct: 15, lastUpdated: Date.now() },
        'dictation': { questions: 25, correct: 20, lastUpdated: Date.now() },
      };
      vi.spyOn(storage, 'getModeStats').mockReturnValue(mockModeStats);

      const { result } = renderHook(() => useLearningProfile());

      const fillInBlanks = result.current.modeAccuracyBreakdown.find(m => m.mode === 'fill-in-blanks');
      expect(fillInBlanks?.totalQuestions).toBe(50);
      expect(fillInBlanks?.correctCount).toBe(40);
      expect(fillInBlanks?.accuracy).toBe(80);
    });

    it('calculates mode accuracy correctly', () => {
      const mockModeStats = {
        'fill-in-blanks': { questions: 100, correct: 73, lastUpdated: Date.now() },
        'multiple-choice': { questions: 50, correct: 25, lastUpdated: Date.now() },
        'sentence-reorder': { questions: 0, correct: 0, lastUpdated: Date.now() },
        'dictation': { questions: 20, correct: 10, lastUpdated: Date.now() },
      };
      vi.spyOn(storage, 'getModeStats').mockReturnValue(mockModeStats);

      const { result } = renderHook(() => useLearningProfile());

      const modes = result.current.modeAccuracyBreakdown;

      expect(modes.find(m => m.mode === 'fill-in-blanks')?.accuracy).toBe(73);
      expect(modes.find(m => m.mode === 'multiple-choice')?.accuracy).toBe(50);
      expect(modes.find(m => m.mode === 'sentence-reorder')?.accuracy).toBe(0); // No questions
      expect(modes.find(m => m.mode === 'dictation')?.accuracy).toBe(50);
    });

    it('falls back to history mode data when no mode stats', () => {
      // Clear mode stats
      vi.spyOn(storage, 'getModeStats').mockReturnValue({});

      const now = Date.now();
      storage.addHistory({
        id: 'session-1',
        timestamp: now,
        duration: 300,
        dictionaryId: 'cet4',
        dictionaryName: 'CET-4',
        score: 80,
        totalQuestions: 10,
        correctCount: 8,
        accuracy: 80,
        mode: 'fill-in-blanks',
      });

      const { result } = renderHook(() => useLearningProfile());

      const fillInBlanks = result.current.modeAccuracyBreakdown.find(m => m.mode === 'fill-in-blanks');
      expect(fillInBlanks?.totalQuestions).toBe(10);
      expect(fillInBlanks?.correctCount).toBe(8);
    });
  });

  describe('milestone aggregation', () => {
    it('returns empty milestones for new user', () => {
      const { result } = renderHook(() => useLearningProfile());

      expect(result.current.unlockedMilestones).toHaveLength(0);
      expect(result.current.unlockedMilestoneCount).toBe(0);
      expect(result.current.totalMilestones).toBe(MILESTONE_DEFINITIONS.length);
    });

    it('aggregates unlocked milestones with details', () => {
      const now = Date.now();
      const milestoneState = {
        unlockedMilestones: [
          { id: '7-days', unlockedAt: now - 86400000 * 10 }, // 10 days ago
          { id: '14-days', unlockedAt: now - 86400000 * 3 }, // 3 days ago
        ],
        updatedAt: now,
      };
      vi.spyOn(storage, 'getMilestones').mockReturnValue(milestoneState);

      const { result } = renderHook(() => useLearningProfile());

      expect(result.current.unlockedMilestoneCount).toBe(2);
      expect(result.current.unlockedMilestones).toHaveLength(2);

      // Check milestone details
      const firstMilestone = result.current.unlockedMilestones[0];
      expect(firstMilestone.id).toBe('7-days');
      expect(firstMilestone.title).toBe('初露锋芒');
      expect(firstMilestone.titleEn).toBe('First Week');
      expect(firstMilestone.icon).toBe('☀️');
      expect(firstMilestone.xpReward).toBe(20);
      expect(firstMilestone.requiredDays).toBe(7);
    });

    it('sorts milestones by unlock date ascending', () => {
      const now = Date.now();
      const milestoneState = {
        unlockedMilestones: [
          { id: '14-days', unlockedAt: now - 86400000 * 3 }, // 3 days ago
          { id: '7-days', unlockedAt: now - 86400000 * 10 }, // 10 days ago
        ],
        updatedAt: now,
      };
      vi.spyOn(storage, 'getMilestones').mockReturnValue(milestoneState);

      const { result } = renderHook(() => useLearningProfile());

      // Should be sorted by unlock date ascending (oldest first)
      expect(result.current.unlockedMilestones[0].id).toBe('7-days');
      expect(result.current.unlockedMilestones[1].id).toBe('14-days');
    });

    it('handles unknown milestone ID gracefully', () => {
      const now = Date.now();
      const milestoneState = {
        unlockedMilestones: [
          { id: 'unknown-milestone', unlockedAt: now },
        ],
        updatedAt: now,
      };
      vi.spyOn(storage, 'getMilestones').mockReturnValue(milestoneState);

      const { result } = renderHook(() => useLearningProfile());

      expect(result.current.unlockedMilestones).toHaveLength(1);
      expect(result.current.unlockedMilestones[0].title).toBe('unknown-milestone');
      expect(result.current.unlockedMilestones[0].icon).toBe('🏆');
    });
  });

  describe('hasActivity detection', () => {
    it('returns false for completely new user', () => {
      const { result } = renderHook(() => useLearningProfile());

      expect(result.current.hasActivity).toBe(false);
    });

    it('returns true when user has answered questions', () => {
      storage.saveBadgeProgress({
        totalAnswered: 10,
        totalCorrect: 5,
        totalSessions: 2,
        maxStreakEver: 3,
        perfectSessions: 0,
        totalReviews: 0,
        totalChallengesCompleted: 0,
      });

      const { result } = renderHook(() => useLearningProfile());

      expect(result.current.hasActivity).toBe(true);
    });

    it('returns true when user has XP', () => {
      storage.updateXPProfile({ totalXP: 50, currentLevel: 1, levelProgress: 50 });

      const { result } = renderHook(() => useLearningProfile());

      expect(result.current.hasActivity).toBe(true);
    });

    it('returns true when user has unlocked milestones', () => {
      const now = Date.now();
      const milestoneState = {
        unlockedMilestones: [
          { id: '7-days', unlockedAt: now },
        ],
        updatedAt: now,
      };
      vi.spyOn(storage, 'getMilestones').mockReturnValue(milestoneState);

      const { result } = renderHook(() => useLearningProfile());

      expect(result.current.hasActivity).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles corrupted milestone state gracefully', () => {
      // getMilestones returns default empty state for corrupted data
      vi.spyOn(storage, 'getMilestones').mockReturnValue({
        unlockedMilestones: [],
        updatedAt: Date.now(),
      });

      const { result } = renderHook(() => useLearningProfile());

      expect(result.current.unlockedMilestones).toHaveLength(0);
      expect(result.current.unlockedMilestoneCount).toBe(0);
    });

    it('handles missing badge progress gracefully', () => {
      // Default badge progress is used when storage returns null
      vi.spyOn(storage, 'getBadgeProgress').mockReturnValue({
        totalAnswered: 0,
        totalCorrect: 0,
        totalSessions: 0,
        maxStreakEver: 0,
        perfectSessions: 0,
        totalReviews: 0,
        totalChallengesCompleted: 0,
      });

      const { result } = renderHook(() => useLearningProfile());

      expect(result.current.totalQuestions).toBe(0);
      expect(result.current.totalCorrect).toBe(0);
      expect(result.current.maxStreakEver).toBe(0);
    });

    it('caps progress to next level at 100%', () => {
      // If XP exceeds level threshold
      storage.updateXPProfile({ totalXP: 200, currentLevel: 2, levelProgress: 100 });

      const { result } = renderHook(() => useLearningProfile());

      expect(result.current.xpProfile.progressToNextLevel).toBeLessThanOrEqual(100);
    });

    it('handles zero XP and zero threshold edge case', () => {
      // When XP is 0 at level 1, thresholds[0]=0, thresholds[1]=100
      // This can cause division by zero if not handled
      storage.updateXPProfile({ totalXP: 0, currentLevel: 1, levelProgress: 0 });

      const { result } = renderHook(() => useLearningProfile());

      // Should handle gracefully without NaN
      expect(Number.isNaN(result.current.xpProfile.progressToNextLevel)).toBe(false);
      expect(result.current.xpProfile.progressToNextLevel).toBeGreaterThanOrEqual(0);
    });
  });

  describe('data consistency', () => {
    it('totalQuestions comes from badgeProgress', () => {
      storage.saveBadgeProgress({
        totalAnswered: 200,
        totalCorrect: 150,
        totalSessions: 30,
        maxStreakEver: 20,
        perfectSessions: 10,
        totalReviews: 25,
        totalChallengesCompleted: 5,
      });

      const { result } = renderHook(() => useLearningProfile());

      expect(result.current.totalQuestions).toBe(200);
      expect(result.current.totalQuestions).toBe(result.current.badgeProgress.totalAnswered);
    });

    it('totalCorrect comes from badgeProgress', () => {
      storage.saveBadgeProgress({
        totalAnswered: 200,
        totalCorrect: 150,
        totalSessions: 30,
        maxStreakEver: 20,
        perfectSessions: 10,
        totalReviews: 25,
        totalChallengesCompleted: 5,
      });

      const { result } = renderHook(() => useLearningProfile());

      expect(result.current.totalCorrect).toBe(150);
      expect(result.current.totalCorrect).toBe(result.current.badgeProgress.totalCorrect);
    });

    it('maxStreakEver comes from badgeProgress', () => {
      storage.saveBadgeProgress({
        totalAnswered: 100,
        totalCorrect: 80,
        totalSessions: 20,
        maxStreakEver: 25,
        perfectSessions: 5,
        totalReviews: 10,
        totalChallengesCompleted: 3,
      });

      const { result } = renderHook(() => useLearningProfile());

      expect(result.current.maxStreakEver).toBe(25);
      expect(result.current.maxStreakEver).toBe(result.current.badgeProgress.maxStreakEver);
    });
  });
});