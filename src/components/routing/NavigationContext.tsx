import { createContext, useCallback, useContext, type ReactNode } from 'react';
import type { View } from './ViewRouter';
import type { ViewConfig } from './index';

// Re-export ViewConfig for consumers
export type { ViewConfig } from './index';

export type { View } from './ViewRouter';

// Navigation context value
export interface NavigationContextValue {
  currentView?: View;
  handleNavigate: (_view: View) => void;
  // Registry support
  registry?: Record<string, ViewConfig>;
  isViewRegistered?: (_id: string) => boolean;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);
export { NavigationContext };

export interface NavigationProviderProps {
  view?: View;
  onNavigate: (_view: View) => void;
  children: ReactNode;
  registry?: Record<string, ViewConfig>;
  registeredViews?: Set<string>;
}

export function NavigationProvider({ view, onNavigate, children, registry, registeredViews }: NavigationProviderProps) {
  const handleNavigate = useCallback((targetView: View) => {
    onNavigate(targetView);
  }, [onNavigate]);

  const isViewRegistered = useCallback(
    (_id: string) => registeredViews?.has(_id) ?? false,
    [registeredViews]
  );

  return (
    <NavigationContext.Provider value={{ currentView: view, handleNavigate, registry, isViewRegistered }}>
      {children}
    </NavigationContext.Provider>
  );
}

// Hook to access navigation context
export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}

// Legacy hook name for backwards compatibility
export { useNavigation as useNav };