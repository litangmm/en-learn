import { describe, it, expect } from 'vitest';
import { generateWeaknessPatterns } from '../useLearnInsights';

/**
 * Helper to create weakness data for testing
 */
function createWeakness(
  overrides: Partial<{
    sentenceId: string;
    weakType: string;
    dictionaryId: string;
    accuracy: number;
    wrongCount: number;
    mode: string;
  }> = {}
) {
  return {
    sentenceId: 'sentence-1',
    weakType: 'high-error',
    dictionaryId: 'dict-1',
    accuracy: 0.5,
    wrongCount: 3,
    mode: 'dictation' as const,
    ...overrides,
  };
}

describe('generateWeaknessPatterns', () => {
  describe('empty array', () => {
    it('should return empty array when weaknesses is empty', () => {
      const result = generateWeaknessPatterns([]);
      expect(result).toEqual([]);
    });
  });

  describe('single weakness type: high-error', () => {
    it('should generate pattern for single high-error weakness', () => {
      const weaknesses = [createWeakness({ weakType: 'high-error', sentenceId: 's1' })];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'weakness-high-error',
        patternType: 'accuracy',
        title: '高频错误',
        description: expect.stringContaining('1'),
        affectedCount: 1,
        severity: 1,
        suggestedAction: '进入错题复习模式强化练习',
      });
    });

    it('should calculate severity 1 when count is 2 or less', () => {
      const weaknesses = [
        createWeakness({ weakType: 'high-error', sentenceId: 's1' }),
        createWeakness({ weakType: 'high-error', sentenceId: 's2' }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result[0].severity).toBe(1);
    });

    it('should calculate severity 2 when count is 3-5', () => {
      const weaknesses = [
        createWeakness({ weakType: 'high-error', sentenceId: 's1' }),
        createWeakness({ weakType: 'high-error', sentenceId: 's2' }),
        createWeakness({ weakType: 'high-error', sentenceId: 's3' }),
        createWeakness({ weakType: 'high-error', sentenceId: 's4' }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result[0].severity).toBe(2);
    });

    it('should calculate severity 3 when count is more than 5', () => {
      const weaknesses = Array.from({ length: 6 }, (_, i) =>
        createWeakness({ weakType: 'high-error', sentenceId: `s${i}` })
      );
      const result = generateWeaknessPatterns(weaknesses);

      expect(result[0].severity).toBe(3);
      expect(result[0].affectedCount).toBe(6);
    });
  });

  describe('single weakness type: low-accuracy', () => {
    it('should generate pattern for low-accuracy weakness', () => {
      const weaknesses = [
        createWeakness({ weakType: 'low-accuracy', accuracy: 0.3 }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'weakness-low-accuracy',
        patternType: 'accuracy',
        title: '正确率偏低',
        description: expect.stringContaining('1'),
        affectedCount: 1,
        suggestedAction: '通过练习巩固这些知识点',
      });
    });

    it('should calculate severity 1 when avg accuracy >= 0.5', () => {
      const weaknesses = [
        createWeakness({ weakType: 'low-accuracy', accuracy: 0.55 }),
        createWeakness({ weakType: 'low-accuracy', accuracy: 0.5 }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result[0].severity).toBe(1);
    });

    it('should calculate severity 2 when avg accuracy is 0.4-0.5', () => {
      const weaknesses = [
        createWeakness({ weakType: 'low-accuracy', accuracy: 0.45 }),
        createWeakness({ weakType: 'low-accuracy', accuracy: 0.42 }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result[0].severity).toBe(2);
    });

    it('should calculate severity 3 when avg accuracy < 0.4', () => {
      const weaknesses = [
        createWeakness({ weakType: 'low-accuracy', accuracy: 0.35 }),
        createWeakness({ weakType: 'low-accuracy', accuracy: 0.3 }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result[0].severity).toBe(3);
    });

    it('should handle boundary at accuracy 0.5', () => {
      const weaknesses = [
        createWeakness({ weakType: 'low-accuracy', accuracy: 0.5 }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result[0].severity).toBe(1); // 0.5 is NOT < 0.5, so severity 1
    });

    it('should handle boundary at accuracy 0.4', () => {
      const weaknesses = [
        createWeakness({ weakType: 'low-accuracy', accuracy: 0.4 }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result[0].severity).toBe(2); // 0.4 is NOT < 0.4, so severity 2 (0.4 <= avg < 0.5)
    });
  });

  describe('single weakness type: review-neglected', () => {
    it('should generate pattern for review-neglected weakness', () => {
      const weaknesses = [
        createWeakness({ weakType: 'review-neglected', sentenceId: 's1' }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'weakness-review-neglected',
        patternType: 'neglected',
        title: '复习遗漏',
        suggestedAction: '立即开始复习队列',
      });
    });

    it('should always have severity 3 regardless of count', () => {
      const weaknesses = [
        createWeakness({ weakType: 'review-neglected', sentenceId: 's1' }),
        createWeakness({ weakType: 'review-neglected', sentenceId: 's2' }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result[0].severity).toBe(3);
    });
  });

  describe('single weakness type: mode-weak', () => {
    it('should generate pattern for mode-weak weakness', () => {
      const weaknesses = [
        createWeakness({
          weakType: 'mode-weak',
          mode: 'dictation',
          sentenceId: 's1',
        }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'weakness-mode-weak',
        patternType: 'mode',
        title: 'dictation 模式薄弱',
        description: expect.stringContaining('dictation'),
        suggestedAction: '专注练习此模式',
      });
    });

    it('should use first item mode when multiple items exist', () => {
      const weaknesses = [
        createWeakness({ weakType: 'mode-weak', mode: 'dictation', sentenceId: 's1' }),
        createWeakness({ weakType: 'mode-weak', mode: 'fill-in-blanks', sentenceId: 's2' }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result[0].title).toBe('dictation 模式薄弱'); // First item's mode
    });

    it('should calculate severity 1 when count is 3 or less', () => {
      const weaknesses = [
        createWeakness({ weakType: 'mode-weak', mode: 'dictation', sentenceId: 's1' }),
        createWeakness({ weakType: 'mode-weak', mode: 'dictation', sentenceId: 's2' }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result[0].severity).toBe(1);
    });

    it('should calculate severity 2 when count is more than 3', () => {
      const weaknesses = Array.from({ length: 4 }, (_, i) =>
        createWeakness({ weakType: 'mode-weak', mode: 'dictation', sentenceId: `s${i}` })
      );
      const result = generateWeaknessPatterns(weaknesses);

      expect(result[0].severity).toBe(2);
      expect(result[0].affectedCount).toBe(4);
    });

    it('should handle unknown mode gracefully', () => {
      const weaknesses = [
        createWeakness({ weakType: 'mode-weak', mode: undefined, sentenceId: 's1' }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result[0].title).toBe('未知 模式薄弱');
      expect(result[0].description).toContain('未知');
    });
  });

  describe('unknown weakType', () => {
    it('should handle unknown weakType with default values', () => {
      const weaknesses = [
        createWeakness({ weakType: 'unknown-type', sentenceId: 's1' }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'weakness-unknown-type',
        patternType: 'accuracy',
        title: '薄弱点',
        description: expect.stringContaining('1'),
        severity: 1,
        suggestedAction: '持续练习提升',
      });
    });

    it('should handle unknown weakType with multiple items', () => {
      const weaknesses = [
        createWeakness({ weakType: 'unknown-type', sentenceId: 's1' }),
        createWeakness({ weakType: 'unknown-type', sentenceId: 's2' }),
        createWeakness({ weakType: 'unknown-type', sentenceId: 's3' }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result[0].affectedCount).toBe(3);
      expect(result[0].severity).toBe(1);
    });
  });

  describe('multiple weakness types', () => {
    it('should generate patterns for all unique weakTypes', () => {
      const weaknesses = [
        createWeakness({ weakType: 'high-error', sentenceId: 's1' }),
        createWeakness({ weakType: 'low-accuracy', sentenceId: 's2' }),
        createWeakness({ weakType: 'review-neglected', sentenceId: 's3' }),
        createWeakness({ weakType: 'mode-weak', sentenceId: 's4' }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result).toHaveLength(4);
    });

    it('should group multiple items of same type into single pattern', () => {
      const weaknesses = [
        createWeakness({ weakType: 'high-error', sentenceId: 's1' }),
        createWeakness({ weakType: 'high-error', sentenceId: 's2' }),
        createWeakness({ weakType: 'high-error', sentenceId: 's3' }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result).toHaveLength(1);
      expect(result[0].affectedCount).toBe(3);
    });
  });

  describe('severity sorting', () => {
    it('should sort patterns by severity descending (highest first)', () => {
      // Create weaknesses that will produce patterns with different severities
      const weaknesses = [
        // high-error with count=1 -> severity 1
        createWeakness({ weakType: 'high-error', sentenceId: 's1' }),
        // review-neglected -> always severity 3
        createWeakness({ weakType: 'review-neglected', sentenceId: 's2' }),
        // low-accuracy with accuracy 0.3 -> severity 3
        createWeakness({ weakType: 'low-accuracy', accuracy: 0.3, sentenceId: 's3' }),
        // mode-weak with count=1 -> severity 1
        createWeakness({ weakType: 'mode-weak', sentenceId: 's4' }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      // Should be sorted: severity 3 first, then severity 1
      expect(result[0].severity).toBe(3);
      expect(result[1].severity).toBe(3);
      expect(result[2].severity).toBe(1);
      expect(result[3].severity).toBe(1);
    });

    it('should maintain stable order for same severity', () => {
      const weaknesses = [
        createWeakness({ weakType: 'high-error', sentenceId: 's1' }),
        createWeakness({ weakType: 'mode-weak', sentenceId: 's2' }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      // Both have severity 1, but should still be consistent
      expect(result).toHaveLength(2);
      expect(result[0].severity).toBe(1);
      expect(result[1].severity).toBe(1);
    });

    it('should handle single pattern correctly', () => {
      const weaknesses = [
        createWeakness({ weakType: 'high-error', sentenceId: 's1' }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result).toHaveLength(1);
      expect(result[0].severity).toBe(1);
    });
  });

  describe('pattern structure', () => {
    it('should include all required fields in pattern', () => {
      const weaknesses = [
        createWeakness({ weakType: 'high-error', sentenceId: 's1' }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      const pattern = result[0];
      expect(pattern).toHaveProperty('id');
      expect(pattern).toHaveProperty('patternType');
      expect(pattern).toHaveProperty('title');
      expect(pattern).toHaveProperty('description');
      expect(pattern).toHaveProperty('affectedCount');
      expect(pattern).toHaveProperty('severity');
      expect(pattern).toHaveProperty('suggestedAction');
    });

    it('should generate unique ids for different types', () => {
      const weaknesses = [
        createWeakness({ weakType: 'high-error', sentenceId: 's1' }),
        createWeakness({ weakType: 'low-accuracy', sentenceId: 's2' }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      const ids = result.map(p => p.id);
      expect(new Set(ids).size).toBe(ids.length); // All unique
    });
  });

  describe('edge cases', () => {
    it('should handle single item array', () => {
      const weaknesses = [
        createWeakness({ weakType: 'high-error' }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result).toHaveLength(1);
      expect(result[0].affectedCount).toBe(1);
    });

    it('should handle large number of weaknesses', () => {
      const weaknesses = Array.from({ length: 100 }, (_, i) =>
        createWeakness({
          weakType: i % 2 === 0 ? 'high-error' : 'low-accuracy',
          sentenceId: `s${i}`,
          accuracy: 0.3,
        })
      );
      const result = generateWeaknessPatterns(weaknesses);

      expect(result).toHaveLength(2);
      expect(result[0].affectedCount).toBe(50);
      expect(result[1].affectedCount).toBe(50);
    });

    it('should handle weaknesses with varying accuracy values', () => {
      const weaknesses = [
        createWeakness({ weakType: 'low-accuracy', accuracy: 0.1, sentenceId: 's1' }),
        createWeakness({ weakType: 'low-accuracy', accuracy: 0.9, sentenceId: 's2' }),
        createWeakness({ weakType: 'low-accuracy', accuracy: 0.2, sentenceId: 's3' }),
        createWeakness({ weakType: 'low-accuracy', accuracy: 0.3, sentenceId: 's4' }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      // avg = (0.1 + 0.9 + 0.2 + 0.3) / 4 = 0.375 < 0.4 -> severity 3
      expect(result[0].severity).toBe(3);
      expect(result[0].affectedCount).toBe(4);
    });

    it('should handle multiple mode-weak with different modes', () => {
      const weaknesses = [
        createWeakness({ weakType: 'mode-weak', mode: 'dictation', sentenceId: 's1' }),
        createWeakness({ weakType: 'mode-weak', mode: 'fill-in-blanks', sentenceId: 's2' }),
        createWeakness({ weakType: 'mode-weak', mode: 'multiple-choice', sentenceId: 's3' }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      // All grouped into single pattern with first mode
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('dictation 模式薄弱');
      expect(result[0].affectedCount).toBe(3);
    });
  });

  describe('description content', () => {
    it('should include count in high-error description', () => {
      const weaknesses = [
        createWeakness({ weakType: 'high-error', sentenceId: 's1' }),
        createWeakness({ weakType: 'high-error', sentenceId: 's2' }),
        createWeakness({ weakType: 'high-error', sentenceId: 's3' }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result[0].description).toContain('3');
    });

    it('should include count in low-accuracy description', () => {
      const weaknesses = [
        createWeakness({ weakType: 'low-accuracy', sentenceId: 's1' }),
        createWeakness({ weakType: 'low-accuracy', sentenceId: 's2' }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result[0].description).toContain('2');
      expect(result[0].description).toContain('60%');
    });

    it('should include count in review-neglected description', () => {
      const weaknesses = [
        createWeakness({ weakType: 'review-neglected', sentenceId: 's1' }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result[0].description).toContain('1');
    });

    it('should include mode and count in mode-weak description', () => {
      const weaknesses = [
        createWeakness({ weakType: 'mode-weak', mode: 'dictation', sentenceId: 's1' }),
        createWeakness({ weakType: 'mode-weak', mode: 'dictation', sentenceId: 's2' }),
      ];
      const result = generateWeaknessPatterns(weaknesses);

      expect(result[0].description).toContain('dictation');
      expect(result[0].description).toContain('2');
    });
  });
});