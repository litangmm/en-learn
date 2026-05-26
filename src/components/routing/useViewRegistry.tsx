import { createContext, useCallback, useContext, useReducer, type ReactNode } from 'react';
import type { View } from './ViewRouter';
import type { ViewConfig } from './index';

// View Registry State
interface ViewRegistryState {
  registry: Record<string, ViewConfig>;
  registeredViews: Set<string>;
}

// View Registry Actions
type ViewRegistryAction =
  | { type: 'REGISTER_VIEW'; payload: ViewConfig }
  | { type: 'UNREGISTER_VIEW'; payload: string }
  | { type: 'BATCH_REGISTER'; payload: ViewConfig[] }
  | { type: 'CLEAR_REGISTRY' };

// Initial state
const initialState: ViewRegistryState = {
  registry: {} as Record<string, ViewConfig>,
  registeredViews: new Set(),
};

// Reducer
function viewRegistryReducer(state: ViewRegistryState, action: ViewRegistryAction): ViewRegistryState {
  switch (action.type) {
    case 'REGISTER_VIEW': {
      const { id, ...rest } = action.payload;
      return {
        ...state,
        registry: { ...state.registry, [id]: { id, ...rest } },
        registeredViews: new Set([...state.registeredViews, id]),
      };
    }
    case 'UNREGISTER_VIEW': {
      const newRegistry = { ...state.registry };
      delete newRegistry[action.payload];
      const newRegisteredViews = new Set(state.registeredViews);
      newRegisteredViews.delete(action.payload);
      return { registry: newRegistry, registeredViews: newRegisteredViews };
    }
    case 'BATCH_REGISTER': {
      const newRegistry = { ...state.registry };
      const newRegisteredViews = new Set(state.registeredViews);
      action.payload.forEach(config => {
        newRegistry[config.id] = config;
        newRegisteredViews.add(config.id);
      });
      return { registry: newRegistry, registeredViews: newRegisteredViews };
    }
    case 'CLEAR_REGISTRY':
      return { registry: {}, registeredViews: new Set() };
    default:
      return state;
  }
}

// Context
interface ViewRegistryContextValue {
  registry: Record<string, ViewConfig>;
  registeredViews: Set<string>;
  registerView: (_config: ViewConfig) => void;
  unregisterView: (_id: string) => void;
  batchRegister: (_configs: ViewConfig[]) => void;
  isViewRegistered: (_id: string) => boolean;
  getViewConfig: (_id: string) => ViewConfig | undefined;
}

const ViewRegistryContext = createContext<ViewRegistryContextValue | null>(null);

// Provider Props
export interface ViewRegistryProviderProps {
  children: ReactNode;
  initialConfigs?: ViewConfig[];
}

// Provider Component
export function ViewRegistryProvider({ children, initialConfigs = [] }: ViewRegistryProviderProps) {
  const [state, dispatch] = useReducer(viewRegistryReducer, {
    ...initialState,
    registry: initialConfigs.reduce(
      (acc, config) => ({ ...acc, [config.id]: config }),
      {}
    ),
    registeredViews: new Set(initialConfigs.map(c => c.id)),
  });

  const registerView = useCallback((config: ViewConfig) => {
    dispatch({ type: 'REGISTER_VIEW', payload: config });
  }, []);

  const unregisterView = useCallback((id: string) => {
    dispatch({ type: 'UNREGISTER_VIEW', payload: id });
  }, []);

  const batchRegister = useCallback((configs: ViewConfig[]) => {
    dispatch({ type: 'BATCH_REGISTER', payload: configs });
  }, []);

  const isViewRegistered = useCallback(
    (id: string) => state.registeredViews.has(id),
    [state.registeredViews]
  );

  const getViewConfig = useCallback(
    (id: string) => state.registry[id],
    [state.registry]
  );

  const value: ViewRegistryContextValue = {
    registry: state.registry,
    registeredViews: state.registeredViews,
    registerView,
    unregisterView,
    batchRegister,
    isViewRegistered,
    getViewConfig,
  };

  return (
    <ViewRegistryContext.Provider value={value}>
      {children}
    </ViewRegistryContext.Provider>
  );
}

// Hook
export function useViewRegistry(): ViewRegistryContextValue {
  const context = useContext(ViewRegistryContext);
  if (!context) {
    throw new Error('useViewRegistry must be used within a ViewRegistryProvider');
  }
  return context;
}

// Convenience hook for getting a specific view config
export function useViewConfig(viewId: View): ViewConfig | undefined {
  const { getViewConfig } = useViewRegistry();
  return getViewConfig(viewId);
}

// Convenience hook for checking if a view is registered
export function useIsViewRegistered(viewId: View): boolean {
  const { isViewRegistered } = useViewRegistry();
  return isViewRegistered(viewId);
}