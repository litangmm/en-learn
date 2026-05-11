import { createContext, useContext, useCallback, type ReactNode } from 'react';
import type { View } from './ViewRouter';

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

  return (
    <NavigationContext.Provider value={{ currentView: view, handleNavigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

// Hook in same file - acceptable for context consumers
export function useNavigation(): NavigationContextValue {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}