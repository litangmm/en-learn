import { describe, it, expect } from 'vitest';
import {
  hasLegacyMetadata,
  getStandardizedProps,
  createViewConfig,
  type StandardizedViewConfig,
  type ViewAdaptiveConfig,
  type ViewDifficultyLevel,
} from '../schema';
import type { FlowState } from '@/hooks/useAdaptiveQuestionSelector';

describe('ViewConfig Schema', () => {
  // ========================================================================
  // Adaptive State Type Tests
  // ========================================================================

  describe('adaptiveState type', () => {
    it('should accept valid difficulty levels', () => {
      const configEasy: ViewAdaptiveConfig = { difficulty: 'easy' };
      const configNormal: ViewAdaptiveConfig = { difficulty: 'normal' };
      const configHard: ViewAdaptiveConfig = { difficulty: 'hard' };

      expect(configEasy.difficulty).toBe('easy');
      expect(configNormal.difficulty).toBe('normal');
      expect(configHard.difficulty).toBe('hard');
    });

    it('should accept priority values', () => {
      const config: ViewAdaptiveConfig = { priority: 100 };
      expect(config.priority).toBe(100);

      const configZero: ViewAdaptiveConfig = { priority: 0 };
      expect(configZero.priority).toBe(0);

      const configNegative: ViewAdaptiveConfig = { priority: -50 };
      expect(configNegative.priority).toBe(-50);
    });

    it('should accept valid flow states array', () => {
      const flowStates: FlowState[] = ['focused', 'normal', 'fatigued'];
      const config: ViewAdaptiveConfig = { flowStates };
      expect(config.flowStates).toEqual(['focused', 'normal', 'fatigued']);
    });

    it('should accept partial flow states', () => {
      const config: ViewAdaptiveConfig = { flowStates: ['focused'] };
      expect(config.flowStates).toEqual(['focused']);
    });

    it('should accept empty adaptive config', () => {
      const config: ViewAdaptiveConfig = {};
      expect(config.difficulty).toBeUndefined();
      expect(config.priority).toBeUndefined();
      expect(config.flowStates).toBeUndefined();
    });

    it('should accept full adaptive config', () => {
      const config: ViewAdaptiveConfig = {
        difficulty: 'hard',
        priority: 50,
        flowStates: ['focused', 'normal'],
      };
      expect(config.difficulty).toBe('hard');
      expect(config.priority).toBe(50);
      expect(config.flowStates).toEqual(['focused', 'normal']);
    });

    it('should work with StandardizedViewConfig', () => {
      const config: StandardizedViewConfig = {
        id: 'practice',
        title: '练习',
        adaptiveState: {
          difficulty: 'normal',
          priority: 20,
          flowStates: ['normal', 'fatigued'],
        },
      };

      expect(config.adaptiveState?.difficulty).toBe('normal');
      expect(config.adaptiveState?.priority).toBe(20);
      expect(config.adaptiveState?.flowStates).toEqual(['normal', 'fatigued']);
    });

    it('should support multiple views with different adaptive configs', () => {
      const practiceConfig: StandardizedViewConfig = {
        id: 'practice',
        title: '练习',
        adaptiveState: { difficulty: 'normal', priority: 10, flowStates: ['normal'] },
      };

      const challengeConfig: StandardizedViewConfig = {
        id: 'challenges',
        title: '挑战',
        adaptiveState: { difficulty: 'hard', priority: 30, flowStates: ['focused'] },
      };

      const progressConfig: StandardizedViewConfig = {
        id: 'progress',
        title: '进度',
        adaptiveState: { difficulty: 'easy', priority: 5, flowStates: ['fatigued'] },
      };

      expect(practiceConfig.adaptiveState?.difficulty).toBe('normal');
      expect(challengeConfig.adaptiveState?.difficulty).toBe('hard');
      expect(progressConfig.adaptiveState?.difficulty).toBe('easy');

      expect(practiceConfig.adaptiveState?.priority).toBe(10);
      expect(challengeConfig.adaptiveState?.priority).toBe(30);
      expect(progressConfig.adaptiveState?.priority).toBe(5);
    });

    it('should support adaptive config in createViewConfig', () => {
      const config = createViewConfig({
        id: 'practice' as const,
        title: '练习',
        adaptiveState: {
          difficulty: 'hard',
          priority: 25,
          flowStates: ['focused'],
        },
      });

      expect(config.adaptiveState).toBeDefined();
      expect(config.adaptiveState?.difficulty).toBe('hard');
      expect(config.adaptiveState?.priority).toBe(25);
      expect(config.adaptiveState?.flowStates).toEqual(['focused']);
    });

    it('should allow undefined adaptiveState', () => {
      const config: StandardizedViewConfig = {
        id: 'practice',
        title: '练习',
      };

      expect(config.adaptiveState).toBeUndefined();
    });

    it('should support mixed metadata and adaptiveState', () => {
      const config: StandardizedViewConfig = {
        id: 'practice',
        title: '练习',
        adaptiveState: { difficulty: 'normal', priority: 10 },
        metadata: { primary: true, requiresAuth: false },
      };

      expect(config.adaptiveState?.difficulty).toBe('normal');
      expect(config.metadata?.primary).toBe(true);
    });
  });

  describe('ViewDifficultyLevel type guard', () => {
    it('should accept all valid difficulty levels as ViewDifficultyLevel', () => {
      const checkDifficulty = (level: ViewDifficultyLevel): boolean => {
        return ['easy', 'normal', 'hard'].includes(level);
      };

      expect(checkDifficulty('easy')).toBe(true);
      expect(checkDifficulty('normal')).toBe(true);
      expect(checkDifficulty('hard')).toBe(true);
    });
  });

  describe('FlowState integration with adaptive config', () => {
    it('should correctly map flow states for view optimization', () => {
      const viewForFocused: ViewAdaptiveConfig = {
        difficulty: 'hard',
        flowStates: ['focused'],
      };

      const viewForFatigued: ViewAdaptiveConfig = {
        difficulty: 'easy',
        flowStates: ['fatigued'],
      };

      const viewForAll: ViewAdaptiveConfig = {
        difficulty: 'normal',
        flowStates: ['focused', 'normal', 'fatigued'],
      };

      expect(viewForFocused.flowStates).toContain('focused');
      expect(viewForFatigued.flowStates).toContain('fatigued');
      expect(viewForAll.flowStates).toHaveLength(3);
    });
  });

  // ========================================================================
  // Legacy Schema Tests
  // ========================================================================

  describe('hasLegacyMetadata', () => {
    it('should return true when metadata is defined', () => {
      const config = {
        id: 'practice' as const,
        title: '练习',
        metadata: { requiresAuth: false, primary: true },
      };
      expect(hasLegacyMetadata(config)).toBe(true);
    });

    it('should return false when metadata is undefined', () => {
      const config = {
        id: 'practice' as const,
        title: '练习',
        primary: true,
      };
      expect(hasLegacyMetadata(config)).toBe(false);
    });

    it('should handle empty metadata object', () => {
      const config = {
        id: 'practice' as const,
        title: '练习',
        metadata: {},
      };
      expect(hasLegacyMetadata(config)).toBe(true);
    });
  });

  describe('getStandardizedProps', () => {
    it('should extract top-level properties when no metadata', () => {
      const config = {
        id: 'practice' as const,
        title: '练习',
        primary: true,
        defaultRoute: true,
        requiresAuth: false,
      };
      const props = getStandardizedProps(config);
      expect(props).toEqual({
        primary: true,
        defaultRoute: true,
        requiresAuth: false,
      });
    });

    it('should prefer top-level over metadata when both present', () => {
      const config = {
        id: 'practice' as const,
        title: '练习',
        primary: true, // top-level
        metadata: { primary: false }, // metadata
      };
      const props = getStandardizedProps(config);
      expect(props.primary).toBe(true); // top-level wins
    });

    it('should fall back to metadata when top-level is undefined', () => {
      const config = {
        id: 'practice' as const,
        title: '练习',
        metadata: { primary: true, defaultRoute: true },
      };
      const props = getStandardizedProps(config);
      expect(props.primary).toBe(true);
      expect(props.defaultRoute).toBe(true);
    });

    it('should handle missing metadata gracefully', () => {
      const config = {
        id: 'practice' as const,
        title: '练习',
      };
      const props = getStandardizedProps(config);
      expect(props.primary).toBeUndefined();
      expect(props.defaultRoute).toBeUndefined();
      expect(props.requiresAuth).toBeUndefined();
    });

    it('should handle mixed top-level and metadata', () => {
      const config = {
        id: 'practice' as const,
        title: '练习',
        primary: true, // top-level
        // requiresAuth comes from metadata
        metadata: { requiresAuth: true, defaultRoute: false },
      };
      const props = getStandardizedProps(config);
      expect(props.primary).toBe(true); // top-level
      expect(props.requiresAuth).toBe(true); // from metadata
      expect(props.defaultRoute).toBe(false); // from metadata
    });
  });

  describe('createViewConfig', () => {
    it('should create config with defaults applied', () => {
      const config = createViewConfig({
        id: 'practice' as const,
        title: '练习',
      });
      expect(config.requiresAuth).toBe(false);
      expect(config.primary).toBe(false);
      expect(config.defaultRoute).toBe(false);
    });

    it('should override defaults with provided values', () => {
      const config = createViewConfig({
        id: 'practice' as const,
        title: '练习',
        primary: true,
        defaultRoute: true,
        category: 'learning' as const,
      });
      expect(config.primary).toBe(true);
      expect(config.defaultRoute).toBe(true);
      expect(config.category).toBe('learning');
    });

    it('should preserve additional properties', () => {
      const config = createViewConfig({
        id: 'practice' as const,
        title: '练习',
        icon: 'practice',
        description: '核心练习界面',
        menuGroup: 'main',
      });
      expect(config.icon).toBe('practice');
      expect(config.description).toBe('核心练习界面');
      expect(config.menuGroup).toBe('main');
    });

    it('should handle metadata override', () => {
      const config = createViewConfig({
        id: 'practice' as const,
        title: '练习',
        metadata: { primary: true, requiresAuth: true },
      });
      // metadata is preserved but top-level defaults still apply
      expect(config.metadata).toBeDefined();
      expect(config.metadata?.primary).toBe(true);
    });
  });

  describe('ViewConfig type compatibility', () => {
    it('should accept minimal config', () => {
      const config: StandardizedViewConfig = {
        id: 'practice',
        title: '练习',
      };
      expect(config.id).toBe('practice');
    });

    it('should accept full standardized config', () => {
      const config: StandardizedViewConfig = {
        id: 'practice',
        title: '练习',
        icon: 'practice',
        description: '核心练习界面',
        category: 'learning',
        navigationOrder: 1,
        menuGroup: 'main',
        requiresAuth: false,
        primary: true,
        defaultRoute: true,
      };
      expect(config.primary).toBe(true);
      expect(config.defaultRoute).toBe(true);
    });

    it('should accept legacy metadata config', () => {
      const config: StandardizedViewConfig = {
        id: 'practice',
        title: '练习',
        metadata: {
          primary: true,
          defaultRoute: true,
          requiresAuth: false,
        },
      };
      expect(hasLegacyMetadata(config)).toBe(true);
    });

    it('should accept mixed top-level and metadata', () => {
      const config: StandardizedViewConfig = {
        id: 'practice',
        title: '练习',
        primary: true, // top-level
        metadata: {
          requiresAuth: true, // metadata only
        },
      };
      const props = getStandardizedProps(config);
      expect(props.primary).toBe(true); // top-level wins
      expect(props.requiresAuth).toBe(true); // from metadata
    });
  });

  describe('Backward compatibility', () => {
    it('should maintain backward compatibility with existing view configs', () => {
      // Simulating existing VIEW_CONFIGS structure
      const existingConfig = {
        id: 'practice' as const,
        title: '练习',
        icon: 'practice',
        description: '核心练习界面',
        category: 'learning' as const,
        navigationOrder: 1,
        menuGroup: 'main',
        metadata: { primary: true, defaultRoute: true, requiresAuth: false },
      };

      // Should be compatible with StandardizedViewConfig
      const config: StandardizedViewConfig = existingConfig;
      expect(config.metadata?.primary).toBe(true);
      expect(config.metadata?.defaultRoute).toBe(true);

      // Should extract standardized props correctly
      const props = getStandardizedProps(config);
      expect(props.primary).toBe(true);
      expect(props.defaultRoute).toBe(true);
    });

    it('should support gradual migration from metadata to top-level', () => {
      // Partially migrated config
      const partiallyMigratedConfig = {
        id: 'practice' as const,
        title: '练习',
        primary: true, // migrated to top-level
        metadata: {
          defaultRoute: true, // still in metadata
        },
      };

      const config: StandardizedViewConfig = partiallyMigratedConfig;
      const props = getStandardizedProps(config);

      expect(props.primary).toBe(true); // from top-level
      expect(props.defaultRoute).toBe(true); // from metadata
    });
  });
});