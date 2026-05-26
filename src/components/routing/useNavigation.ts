import { useContext } from 'react';
import { NavigationContext, type NavigationContextValue } from './NavigationContext';

export type { NavigationContextValue } from './NavigationContext';

/**
 * Hook to access navigation context.
 * Must be used within a NavigationProvider.
 */
export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

// Legacy hook name for backwards compatibility
export const useNav = useNavigation;