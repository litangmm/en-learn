import { createContext, useCallback, useContext, useReducer, type ReactNode } from 'react';
import type { View } from './ViewRouter';
import type { ViewConfig } from './index';
import { getStandardizedProps, type ViewAuthConfig, type ViewRouteConfig } from './schema';

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
  // Type-safe query methods using new schema
  getPrimaryViews: () => ViewConfig[];
  getDefaultRoute: () => ViewConfig | undefined;
  getViewsByCategory: (_category: string) => ViewConfig[];
  getViewsByAuth: (_requiresAuth: boolean) => ViewConfig[];
  getAuthRequiredViews: () => ViewConfig[];
  getPublicViews: () => ViewConfig[];
}

const ViewRegistryContext = createContext<ViewRegistryContextValue | null>(null);

// Provider Props
export interface ViewRegistryProviderProps {
  children: ReactNode;
  initialConfigs?: ViewConfig[];
}

// Helper to get standardized properties from config
function extractRouteConfig(config: ViewConfig): ViewRouteConfig {
  const props = getStandardizedProps(config);
  return { primary: props.primary, defaultRoute: props.defaultRoute };
}

function extractAuthConfig(config: ViewConfig): ViewAuthConfig {
  const props = getStandardizedProps(config);
  return { requiresAuth: props.requiresAuth };
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

  // Type-safe query methods using new schema
  const getPrimaryViews = useCallback(() => {
    return Object.values(state.registry).filter(config => {
      const props = extractRouteConfig(config);
      return props.primary === true;
    });
  }, [state.registry]);

  const getDefaultRoute = useCallback(() => {
    return Object.values(state.registry).find(config => {
      const props = extractRouteConfig(config);
      return props.defaultRoute === true;
    });
  }, [state.registry]);

  const getViewsByCategory = useCallback(
    (_category: string) => {
      return Object.values(state.registry).filter(config => config.category === _category);
    },
    [state.registry]
  );

  const getViewsByAuth = useCallback(
    (_requiresAuth: boolean) => {
      return Object.values(state.registry).filter(config => {
        const props = extractAuthConfig(config);
        return props.requiresAuth === _requiresAuth;
      });
    },
    [state.registry]
  );

  const getAuthRequiredViews = useCallback(() => {
    return getViewsByAuth(true);
  }, [getViewsByAuth]);

  const getPublicViews = useCallback(() => {
    return getViewsByAuth(false);
  }, [getViewsByAuth]);

  const value: ViewRegistryContextValue = {
    registry: state.registry,
    registeredViews: state.registeredViews,
    registerView,
    unregisterView,
    batchRegister,
    isViewRegistered,
    getViewConfig,
    // Type-safe query methods
    getPrimaryViews,
    getDefaultRoute,
    getViewsByCategory,
    getViewsByAuth,
    getAuthRequiredViews,
    getPublicViews,
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