import { describe, it, expect } from 'vitest';
import {
  hasLegacyMetadata,
  getStandardizedProps,
  createViewConfig,
  type StandardizedViewConfig,
} from '../schema';

describe('ViewConfig Schema', () => {
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