import { describe, it, expect } from 'vitest';
import {
  calculateWeakModeRecommendation,
  generateModeAdvice,
} from '../useLearnInsights';
import type { ModeAccuracy, PracticeMode } from '@/data/types';

/**
 * Helper to create ModeAccuracy data for testing
 */
function createModeAccuracy(
  mode: PracticeMode,
  accuracy: number,
  totalQuestions: number = 10
): ModeAccuracy {
  return {
    mode,
    accuracy,
    totalQuestions,
    correctCount: Math.round((accuracy / 100) * totalQuestions),
  };
}

describe('calculateWeakModeRecommendation', () => {
  describe('edge cases', () => {
    it('should return null when modeAccuracy array is empty', () => {
      const result = calculateWeakModeRecommendation([]);
      expect(result).toBeNull();
    });

    it('should return null when all modes have zero questions (not practiced)', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 50, 0),
        createModeAccuracy('dictation', 60, 0),
        createModeAccuracy('multiple-choice', 40, 0),
        createModeAccuracy('sentence-reorder', 30, 0),
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy);
      expect(result).toBeNull();
    });
  });

  describe('no weak mode found', () => {
    it('should return null when all modes have accuracy above threshold (default 70)', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 85, 20),
        createModeAccuracy('dictation', 80, 15),
        createModeAccuracy('multiple-choice', 90, 25),
        createModeAccuracy('sentence-reorder', 75, 18),
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy);
      expect(result).toBeNull();
    });

    it('should return null when modes with questions are all above threshold', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 90, 20),
        createModeAccuracy('dictation', 85, 15),
        createModeAccuracy('multiple-choice', 75, 0), // 0 questions - should be ignored
        createModeAccuracy('sentence-reorder', 80, 18),
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy);
      expect(result).toBeNull();
    });

    it('should return null when only unpracticed modes are below threshold', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 95, 30),
        createModeAccuracy('dictation', 88, 25),
        createModeAccuracy('multiple-choice', 40, 0), // below threshold but 0 questions
        createModeAccuracy('sentence-reorder', 92, 20),
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy);
      expect(result).toBeNull();
    });
  });

  describe('single weak mode', () => {
    it('should return the weak mode when one mode is significantly weaker', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 90, 20),
        createModeAccuracy('dictation', 55, 15), // significantly lower
        createModeAccuracy('multiple-choice', 85, 25),
        createModeAccuracy('sentence-reorder', 80, 18),
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy);

      expect(result).not.toBeNull();
      expect(result?.mode).toBe('dictation');
      expect(result?.accuracy).toBe(55);
    });

    it('should return the weak mode when only one mode is below threshold', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 80, 10),
        createModeAccuracy('dictation', 85, 10),
        createModeAccuracy('multiple-choice', 65, 10), // only one below 70
        createModeAccuracy('sentence-reorder', 90, 10),
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy);

      expect(result).not.toBeNull();
      expect(result?.mode).toBe('multiple-choice');
    });

    it('should return the weak mode with correct suggestion', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 75, 10),
        createModeAccuracy('dictation', 50, 10),
        createModeAccuracy('multiple-choice', 80, 10),
        createModeAccuracy('sentence-reorder', 85, 10),
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy);

      expect(result).not.toBeNull();
      expect(result?.suggestion).toBe('听写需要多听音频，跟读练习会很有帮助');
    });
  });

  describe('multiple weak modes', () => {
    it('should return the weakest mode (lowest accuracy) when multiple modes are weak', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 65, 20),
        createModeAccuracy('dictation', 45, 15), // lowest - should be returned
        createModeAccuracy('multiple-choice', 58, 25),
        createModeAccuracy('sentence-reorder', 55, 18),
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy);

      expect(result).not.toBeNull();
      expect(result?.mode).toBe('dictation');
      expect(result?.accuracy).toBe(45);
    });

    it('should prioritize lowest accuracy even when other modes have more questions', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 30, 100), // lowest accuracy but most questions
        createModeAccuracy('dictation', 50, 5),
        createModeAccuracy('multiple-choice', 60, 3),
        createModeAccuracy('sentence-reorder', 45, 10),
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy);

      expect(result).not.toBeNull();
      expect(result?.mode).toBe('fill-in-blanks');
      expect(result?.accuracy).toBe(30);
    });
  });

  describe('custom threshold', () => {
    it('should respect custom threshold parameter', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 80, 20),
        createModeAccuracy('dictation', 75, 15), // below 80 threshold, above default 70
        createModeAccuracy('multiple-choice', 85, 25),
        createModeAccuracy('sentence-reorder', 90, 18),
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy, 80);

      expect(result).not.toBeNull();
      expect(result?.mode).toBe('dictation');
      expect(result?.accuracy).toBe(75);
    });

    it('should return null when no modes fall below custom threshold', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 65, 20),
        createModeAccuracy('dictation', 55, 15),
        createModeAccuracy('multiple-choice', 70, 25),
        createModeAccuracy('sentence-reorder', 60, 18),
      ];

      // No modes below 50, so nothing is weak according to this threshold
      const result = calculateWeakModeRecommendation(modeAccuracy, 50);

      expect(result).toBeNull();
    });

    it('should return null when threshold is 0 (no accuracy can be below 0)', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 90, 20),
        createModeAccuracy('dictation', 30, 15),
        createModeAccuracy('multiple-choice', 85, 25),
        createModeAccuracy('sentence-reorder', 80, 18),
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy, 0);

      // With threshold 0, no mode has accuracy < 0 (minimum accuracy is 0)
      // So the filter m.accuracy < 0 never matches, result is null
      expect(result).toBeNull();
    });

    it('should return null when accuracy is exactly at threshold (70)', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 90, 20),
        createModeAccuracy('dictation', 70, 15), // exactly at threshold, not below
        createModeAccuracy('multiple-choice', 85, 25),
        createModeAccuracy('sentence-reorder', 80, 18),
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy);

      // 70 is NOT < 70, so dictation is NOT considered weak
      expect(result).toBeNull();
    });

    it('should return null when accuracy is just above threshold (71)', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 90, 20),
        createModeAccuracy('dictation', 71, 15),
        createModeAccuracy('multiple-choice', 85, 25),
        createModeAccuracy('sentence-reorder', 80, 18),
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy);

      expect(result).toBeNull();
    });

    it('should return dictation when threshold is 1 (0 < 1)', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 90, 20),
        createModeAccuracy('dictation', 0, 15), // 0 < 1, so it IS below threshold
        createModeAccuracy('multiple-choice', 85, 25),
        createModeAccuracy('sentence-reorder', 80, 18),
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy, 1);

      // 0 is less than 1, so dictation is considered weak
      expect(result).not.toBeNull();
      expect(result?.mode).toBe('dictation');
    });

    it('should work with very low threshold', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 90, 20),
        createModeAccuracy('dictation', 30, 15),
        createModeAccuracy('multiple-choice', 85, 25),
        createModeAccuracy('sentence-reorder', 80, 18),
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy, 2);

      // With threshold 2, modes with accuracy < 2 are considered weak
      // 30, 90, 85, 80 are all >= 2, so no modes qualify
      expect(result).toBeNull();
    });

    it('should work with threshold of 100', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 90, 20),
        createModeAccuracy('dictation', 95, 15),
        createModeAccuracy('multiple-choice', 85, 25),
        createModeAccuracy('sentence-reorder', 80, 18),
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy, 100);

      // All modes are below 100 threshold, so should return the weakest
      expect(result).not.toBeNull();
      expect(result?.mode).toBe('sentence-reorder');
    });

    it('should detect weak mode when accuracy is just below threshold (69)', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 90, 20),
        createModeAccuracy('dictation', 69, 15), // just below 70
        createModeAccuracy('multiple-choice', 85, 25),
        createModeAccuracy('sentence-reorder', 80, 18),
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy);

      expect(result).not.toBeNull();
      expect(result?.mode).toBe('dictation');
      expect(result?.accuracy).toBe(69);
    });
  });

  describe('priority calculation', () => {
    it('should return priority 1 when accuracy < 50', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 85, 20),
        createModeAccuracy('dictation', 35, 15), // < 50
        createModeAccuracy('multiple-choice', 80, 25),
        createModeAccuracy('sentence-reorder', 90, 18),
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy);

      expect(result).not.toBeNull();
      expect(result?.priority).toBe(1);
    });

    it('should return priority 1 for very low accuracy (0-49)', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 20, 10),
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy);

      expect(result).not.toBeNull();
      expect(result?.priority).toBe(1);
    });

    it('should return priority 2 when accuracy is 50-59', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 85, 20),
        createModeAccuracy('dictation', 55, 15), // 50-59
        createModeAccuracy('multiple-choice', 80, 25),
        createModeAccuracy('sentence-reorder', 90, 18),
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy);

      expect(result).not.toBeNull();
      expect(result?.priority).toBe(2);
    });

    it('should return priority 2 for accuracy at boundary (49 vs 50)', () => {
      const modeAccuracy49: ModeAccuracy[] = [createModeAccuracy('fill-in-blanks', 49, 10)];
      const modeAccuracy50: ModeAccuracy[] = [createModeAccuracy('fill-in-blanks', 50, 10)];

      const result49 = calculateWeakModeRecommendation(modeAccuracy49);
      const result50 = calculateWeakModeRecommendation(modeAccuracy50);

      expect(result49?.priority).toBe(1); // 49 < 50
      expect(result50?.priority).toBe(2); // 50 >= 50 && < 60
    });

    it('should return priority 3 at threshold boundary (69 vs 70)', () => {
      const modeAccuracy69: ModeAccuracy[] = [createModeAccuracy('fill-in-blanks', 69, 10)];
      const modeAccuracy70: ModeAccuracy[] = [createModeAccuracy('fill-in-blanks', 70, 10)];

      const result69 = calculateWeakModeRecommendation(modeAccuracy69);
      const result70 = calculateWeakModeRecommendation(modeAccuracy70);

      expect(result69?.priority).toBe(3); // 69 < 70, above 60
      expect(result70).toBeNull(); // 70 is not < 70, so not weak
    });

    it('should return priority 3 when accuracy is 60-69', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 85, 20),
        createModeAccuracy('dictation', 65, 15), // 60-69
        createModeAccuracy('multiple-choice', 80, 25),
        createModeAccuracy('sentence-reorder', 90, 18),
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy);

      expect(result).not.toBeNull();
      expect(result?.priority).toBe(3);
    });

    it('should return priority 3 for accuracy at boundary (59 vs 60)', () => {
      const modeAccuracy59: ModeAccuracy[] = [createModeAccuracy('fill-in-blanks', 59, 10)];
      const modeAccuracy60: ModeAccuracy[] = [createModeAccuracy('fill-in-blanks', 60, 10)];

      const result59 = calculateWeakModeRecommendation(modeAccuracy59);
      const result60 = calculateWeakModeRecommendation(modeAccuracy60);

      expect(result59?.priority).toBe(2); // 59 < 60
      expect(result60?.priority).toBe(3); // 60 >= 60 && < threshold
    });

    it('should return priority 1 for accuracy exactly at 0', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 0, 10),
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy);

      expect(result).not.toBeNull();
      expect(result?.priority).toBe(1);
      expect(result?.accuracy).toBe(0);
    });

    it('should return correct recommendation structure with all fields', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 55, 20),
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy);

      expect(result).not.toBeNull();
      expect(result).toHaveProperty('weakMode');
      expect(result).toHaveProperty('mode');
      expect(result).toHaveProperty('accuracy');
      expect(result).toHaveProperty('suggestion');
      expect(result).toHaveProperty('priority');
      expect(result?.weakMode).toBe(result?.mode);
    });
  });

  describe('mixed practiced and unpracticed modes', () => {
    it('should ignore modes with 0 questions when finding weakest', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 20, 0), // below threshold but 0 questions
        createModeAccuracy('dictation', 45, 15), // lowest with questions
        createModeAccuracy('multiple-choice', 55, 0), // below threshold but 0 questions
        createModeAccuracy('sentence-reorder', 30, 0), // below threshold but 0 questions
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy);

      expect(result).not.toBeNull();
      expect(result?.mode).toBe('dictation');
      expect(result?.accuracy).toBe(45);
    });

    it('should consider mode with 0 questions as not weak when above threshold', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 90, 30), // practiced and good
        createModeAccuracy('dictation', 50, 10), // practiced and weak
        createModeAccuracy('multiple-choice', 40, 0), // not practiced, below threshold
        createModeAccuracy('sentence-reorder', 95, 20), // practiced and good
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy);

      expect(result).not.toBeNull();
      expect(result?.mode).toBe('dictation'); // Only weak practiced mode
    });

    it('should return null when all modes are unpracticed (0 questions)', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 20, 0), // below threshold but 0 questions
        createModeAccuracy('dictation', 30, 0), // below threshold but 0 questions
        createModeAccuracy('multiple-choice', 40, 0), // below threshold but 0 questions
        createModeAccuracy('sentence-reorder', 50, 0), // below threshold but 0 questions
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy);

      // All modes have 0 questions, so none can be considered practiced
      expect(result).toBeNull();
    });

    it('should return weak practiced mode when all modes below threshold but some are unpracticed', () => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 85, 30),
        createModeAccuracy('dictation', 65, 10), // practiced, weak (below 70)
        createModeAccuracy('multiple-choice', 50, 0), // not practiced, below threshold
        createModeAccuracy('sentence-reorder', 60, 0), // not practiced, below threshold
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy);

      expect(result).not.toBeNull();
      expect(result?.mode).toBe('dictation'); // Only practiced weak mode
    });
  });
});

describe('generateModeAdvice', () => {
  it('should return correct advice for fill-in-blanks mode', () => {
    const advice = generateModeAdvice('fill-in-blanks');
    expect(advice).toBe('填空需要多阅读例句，理解上下文语境会很有帮助');
  });

  it('should return correct advice for dictation mode', () => {
    const advice = generateModeAdvice('dictation');
    expect(advice).toBe('听写需要多听音频，跟读练习会很有帮助');
  });

  it('should return correct advice for multiple-choice mode', () => {
    const advice = generateModeAdvice('multiple-choice');
    expect(advice).toBe('选择题需要仔细阅读选项，理解题意再作答');
  });

  it('should return correct advice for sentence-reorder mode', () => {
    const advice = generateModeAdvice('sentence-reorder');
    expect(advice).toBe('排序需要理解句子结构，多分析语法关系会很有帮助');
  });

  it('should return advice as non-empty string for all modes', () => {
    const modes: PracticeMode[] = [
      'fill-in-blanks',
      'dictation',
      'multiple-choice',
      'sentence-reorder',
    ];

    modes.forEach(mode => {
      const advice = generateModeAdvice(mode);
      expect(typeof advice).toBe('string');
      expect(advice.length).toBeGreaterThan(0);
    });
  });

  it('should return advice containing learning strategy keywords', () => {
    const advice = generateModeAdvice('fill-in-blanks');
    expect(advice).toContain('阅读');
    expect(advice).toContain('语境');

    const dictationAdvice = generateModeAdvice('dictation');
    expect(dictationAdvice).toContain('听');
    expect(dictationAdvice).toContain('跟读');
  });
});

describe('integration: calculateWeakModeRecommendation with generateModeAdvice', () => {
  it('should generate appropriate advice for detected weak mode', () => {
    const modeAccuracy: ModeAccuracy[] = [
      createModeAccuracy('fill-in-blanks', 85, 20),
      createModeAccuracy('dictation', 45, 15), // weakest mode
      createModeAccuracy('multiple-choice', 75, 25),
      createModeAccuracy('sentence-reorder', 80, 18),
    ];

    const result = calculateWeakModeRecommendation(modeAccuracy);

    expect(result).not.toBeNull();
    expect(result?.weakMode).toBe('dictation');
    expect(result?.suggestion).toBe('听写需要多听音频，跟读练习会很有帮助');
  });

  it('should return correct advice for each mode when it is the weakest', () => {
    const modes: PracticeMode[] = [
      'fill-in-blanks',
      'dictation',
      'multiple-choice',
      'sentence-reorder',
    ];

    const expectedAdvice: Record<PracticeMode, string> = {
      'fill-in-blanks': '填空需要多阅读例句，理解上下文语境会很有帮助',
      'dictation': '听写需要多听音频，跟读练习会很有帮助',
      'multiple-choice': '选择题需要仔细阅读选项，理解题意再作答',
      'sentence-reorder': '排序需要理解句子结构，多分析语法关系会很有帮助',
    };

    modes.forEach(mode => {
      const modeAccuracy: ModeAccuracy[] = [
        createModeAccuracy('fill-in-blanks', 90, 20),
        createModeAccuracy('dictation', 95, 15),
        createModeAccuracy('multiple-choice', 88, 25),
        createModeAccuracy('sentence-reorder', 85, 18),
        createModeAccuracy(mode, 40, 10), // Make this mode the weakest
      ];

      const result = calculateWeakModeRecommendation(modeAccuracy);

      expect(result).not.toBeNull();
      expect(result?.mode).toBe(mode);
      expect(result?.suggestion).toBe(expectedAdvice[mode]);
    });
  });
});