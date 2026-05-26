import type { View } from './ViewRouter';

/** View category for grouping and filtering */
export type ViewCategory = 'learning' | 'progress' | 'achievement' | 'social' | 'system';

/**
 * Standardized view properties that were previously scattered in metadata.
 * These fields are promoted to top-level optional properties for better
 * type safety and discoverability.
 */

/** Authentication requirement for a view */
export interface ViewAuthConfig {
  /** Whether the view requires authentication (default: false) */
  requiresAuth?: boolean;
}

/** Route priority and role configuration */
export interface ViewRouteConfig {
  /** Whether this is a primary/main view (default: false) */
  primary?: boolean;
  /** Whether this is the default landing route (default: false) */
  defaultRoute?: boolean;
}

/** Navigation configuration */
export interface ViewNavigationConfig {
  /** Icon name for navigation items */
  navIcon?: string;
  /** Label for navigation items */
  navLabel?: string;
}

/** Legacy metadata shape for backward compatibility */
export interface LegacyViewMetadata extends ViewAuthConfig, ViewRouteConfig, ViewNavigationConfig {
  /** Additional view-specific metadata */
  [key: string]: unknown;
}

/**
 * Standardized ViewConfig interface with promoted metadata fields.
 *
 * Backward compatibility: metadata property still supported but deprecated.
 * New code should use top-level optional properties directly.
 *
 * @example
 * ```typescript
 * // New style (recommended)
 * { id: 'practice', title: '练习', primary: true, requiresAuth: false }
 *
 * // Old style (deprecated but supported)
 * { id: 'practice', title: '练习', metadata: { primary: true, requiresAuth: false } }
 * ```
 */
export interface StandardizedViewConfig {
  /** Unique identifier for the view */
  id: View;
  /** Human-readable title for display */
  title: string;
  /** Internationalization key */
  i18n?: string;
  /** Icon identifier for navigation items */
  icon?: string;
  /** Accessibility role for screen readers */
  a11yRole?: string;
  /** Human-readable description for the view */
  description?: string;
  /** Category for grouping views (learning/progress/achievement/social/system) */
  category?: ViewCategory;
  /** Numeric order for sorting in navigation menus */
  navigationOrder?: number;
  /** Group name for navigation menu grouping */
  menuGroup?: string;

  // Standardized top-level properties (previously in metadata)
  /** Whether the view requires authentication (default: false) */
  requiresAuth?: boolean;
  /** Whether this is a primary/main view (default: false) */
  primary?: boolean;
  /** Whether this is the default landing route (default: false) */
  defaultRoute?: boolean;

  // Legacy metadata (deprecated but supported for backward compatibility)
  /** Optional metadata - prefer top-level properties instead */
  metadata?: LegacyViewMetadata;
}

/**
 * Type guard to check if a view config uses the legacy metadata pattern.
 * @deprecated Use top-level properties instead.
 */
export function hasLegacyMetadata(config: StandardizedViewConfig): config is StandardizedViewConfig & { metadata: LegacyViewMetadata } {
  return config.metadata !== undefined && typeof config.metadata === 'object';
}

/**
 * Get standardized properties from a view config.
 * Merges top-level properties with legacy metadata for full backward compatibility.
 */
export function getStandardizedProps(config: StandardizedViewConfig): ViewAuthConfig & ViewRouteConfig & ViewNavigationConfig {
  const topLevel: ViewAuthConfig & ViewRouteConfig & ViewNavigationConfig = {
    requiresAuth: config.requiresAuth,
    primary: config.primary,
    defaultRoute: config.defaultRoute,
  };

  if (!hasLegacyMetadata(config)) {
    return topLevel;
  }

  // Merge with metadata, top-level takes precedence
  return {
    requiresAuth: topLevel.requiresAuth ?? config.metadata.requiresAuth,
    primary: topLevel.primary ?? config.metadata.primary,
    defaultRoute: topLevel.defaultRoute ?? config.metadata.defaultRoute,
  };
}

/**
 * Create a ViewConfig with standardized properties.
 * Provides type-safe factory for view configuration creation.
 */
export function createViewConfig<T extends StandardizedViewConfig>(
  config: Omit<T, keyof StandardizedViewConfig> & Partial<StandardizedViewConfig>
): StandardizedViewConfig {
  // Preserve required id and title, apply defaults for standardized properties
  return {
    requiresAuth: false,
    primary: false,
    defaultRoute: false,
    ...config,
  } as StandardizedViewConfig;
}