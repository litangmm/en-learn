import type { View } from './ViewRouter';

// ViewConfig: declarative view registration schema
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
