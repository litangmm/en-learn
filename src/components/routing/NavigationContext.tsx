import { createContext, useCallback, type ReactNode } from 'react';
import type { View } from './ViewRouter';

export type { View } from './ViewRouter';

export interface NavigationContextValue {
  currentView?: View;
  handleNavigate: (_view: View) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);
export { NavigationContext };

export interface NavigationProviderProps {
  view?: View;
  onNavigate: (_view: View) => void;
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