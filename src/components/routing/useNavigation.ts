import { useContext } from 'react';
import { NavigationContext } from './NavigationContext';

export type { NavigationContextValue } from './NavigationContext';

/**
 * Hook to access navigation context.
 * Must be used within a NavigationProvider.
 */
export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}