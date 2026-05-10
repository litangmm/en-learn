import { createContext, useContext, useCallback, type ReactNode } from 'react';
import type { View } from './ViewRouter';

// Re-export View type for consumers
export type { View } from './ViewRouter';

export interface NavigationContextValue {
  currentView: View;
  handleNavigate: (view: View) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export interface NavigationProviderProps {
  view: View;
  onNavigate: (view: View) => void;
  children: ReactNode;
}

export function NavigationProvider({ view, onNavigate, children }: NavigationProviderProps) {
  const handleNavigate = useCallback((targetView: View) => {
    onNavigate(targetView);
  }, [onNavigate]);

  const value: NavigationContextValue = {
    currentView: view,
    handleNavigate,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}