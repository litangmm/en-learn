import type { View } from './ViewRouter';

/** View category for grouping and filtering */
export type ViewCategory = 'learning' | 'progress' | 'achievement' | 'social' | 'system';

/**
 * ViewConfig: declarative view registration schema
 * Provides metadata for routing, navigation, and access control
 */
export interface ViewConfig {
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
  /** Optional metadata for view-specific behavior */
  metadata?: Record<string, unknown>;
  /** Human-readable description for the view */
  description?: string;
  /** Category for grouping views (learning/progress/achievement/social/system) */
  category?: ViewCategory;
  /** Numeric order for sorting in navigation menus */
  navigationOrder?: number;
  /** Group name for navigation menu grouping */
  menuGroup?: string;
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
