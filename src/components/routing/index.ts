import type { View } from './ViewRouter';
import type { StandardizedViewConfig } from './schema';

// Re-export schema types for consumers
export {
  hasLegacyMetadata,
  getStandardizedProps,
  createViewConfig,
  type StandardizedViewConfig,
  type ViewAuthConfig,
  type ViewRouteConfig,
  type ViewNavigationConfig,
  type LegacyViewMetadata,
} from './schema';

/** View category for grouping and filtering */
export type ViewCategory = 'learning' | 'progress' | 'achievement' | 'social' | 'system';

/**
 * ViewConfig: declarative view registration schema
 * Provides metadata for routing, navigation, and access control.
 *
 * Standardized properties (top-level):
 * - requiresAuth: boolean - whether the view requires authentication
 * - primary: boolean - whether this is a primary/main view
 * - defaultRoute: boolean - whether this is the default landing route
 *
 * Legacy metadata is supported for backward compatibility but top-level
 * properties are preferred for better type safety.
 */
export interface ViewConfig extends StandardizedViewConfig {
  /** Unique identifier for the view */
  id: View;
  /** Human-readable title for display */
  title: string;
}

// Default view registry with all standard views
export const DEFAULT_VIEW_REGISTRY: Record<string, ViewConfig> = {};

export { ViewRouter, type ViewRouterProps } from './ViewRouter';
export { NavigationProvider, type NavigationContextValue, type NavigationProviderProps } from './NavigationContext';
export { useNavigation } from './useNavigation';
export { ViewNavigator } from './ViewRouter';
export type { View } from './ViewRouter';

// Re-export ViewRegistryProvider and related exports for consumers
export {
  ViewRegistryProvider,
  useViewRegistry,
  useViewConfig,
  useIsViewRegistered,
  type ViewRegistryProviderProps,
} from './useViewRegistry';