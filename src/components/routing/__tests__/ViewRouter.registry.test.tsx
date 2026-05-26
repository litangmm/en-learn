import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { ViewNavigator } from '../ViewRouter';
import { ViewRegistryProvider, useViewRegistry } from '../useViewRegistry';
import type { ViewConfig, View } from '../index';

// =============================================================================
// Test helper utilities
// =============================================================================

/**
 * Type-safe view ID cast for testing with non-production view IDs.
 * Only use in tests - production code should use actual View union members.
 */
function toTestView(id: string): View {
  return id as View;
}

/**
 * Create a test view config with proper typing for non-production IDs.
 */
function createTestConfig(id: string, title: string, extras?: Partial<ViewConfig>): ViewConfig {
  return { id: toTestView(id), title, ...extras };
}

// =============================================================================
// Component display helpers for test assertions
// =============================================================================

/** Displays registry size and registeredViews count for testing */
function RegistryDisplay() {
  const { registry, registeredViews } = useViewRegistry();
  return (
    <div>
      <span data-testid="registry-size">{Object.keys(registry).length}</span>
      <span data-testid="views-count">{registeredViews.size}</span>
    </div>
  );
}

/** Displays registration status for a specific view ID */
function RegistrationStatus({ viewId }: { viewId: string }) {
  const { registry, registeredViews, isViewRegistered } = useViewRegistry();
  return (
    <div>
      <span data-testid="registry-size">{Object.keys(registry).length}</span>
      <span data-testid="is-registered">{String(isViewRegistered(viewId))}</span>
      <span data-testid="registered-views-has">{String(registeredViews.has(toTestView(viewId)))}</span>
    </div>
  );
}

/** Displays a view config's properties */
function ConfigDisplay({ viewId }: { viewId: string }) {
  const { getViewConfig } = useViewRegistry();
  const config = getViewConfig(viewId);

  return (
    <div>
      <span data-testid="has-config">{String(!!config)}</span>
      <span data-testid="config-title">{config?.title || 'N/A'}</span>
      <span data-testid="config-i18n">{config?.i18n || 'N/A'}</span>
      <span data-testid="config-icon">{config?.icon || 'N/A'}</span>
      <span data-testid="config-metadata">{JSON.stringify(config?.metadata ?? null)}</span>
      <span data-testid="config-a11y">{config?.a11yRole || 'N/A'}</span>
    </div>
  );
}

/** Dynamic registration test component */
function DynamicRegistrationTest() {
  const { registry, registerView, isViewRegistered } = useViewRegistry();

  return (
    <div>
      <button
        data-testid="register-btn"
        onClick={() => registerView(createTestConfig('test-view', '测试视图'))}
      >
        Register
      </button>
      <span data-testid="registry-size">{Object.keys(registry).length}</span>
      <span data-testid="is-registered">{String(isViewRegistered('test-view'))}</span>
    </div>
  );
}

/** Unregistration test component */
function UnregistrationTest() {
  const { registry, registerView, unregisterView, isViewRegistered } = useViewRegistry();

  return (
    <div>
      <button
        data-testid="register-btn"
        onClick={() => registerView(createTestConfig('another-view', '另一个视图'))}
      >
        Register
      </button>
      <button data-testid="unregister-btn" onClick={() => unregisterView('test-view')}>
        Unregister
      </button>
      <span data-testid="registry-size">{Object.keys(registry).length}</span>
      <span data-testid="is-registered">{String(isViewRegistered('test-view'))}</span>
    </div>
  );
}

/** Batch registration test component */
function BatchRegistrationTest() {
  const { registry, batchRegister } = useViewRegistry();

  return (
    <div>
      <button
        data-testid="batch-register-btn"
        onClick={() =>
          batchRegister([
            createTestConfig('view-1', '视图1'),
            createTestConfig('view-2', '视图2'),
            createTestConfig('view-3', '视图3'),
          ])
        }
      >
        Batch Register
      </button>
      <span data-testid="registry-size">{Object.keys(registry).length}</span>
    </div>
  );
}

/** Clear all registry test component */
function ClearAllTest() {
  const { registry, registeredViews, unregisterView } = useViewRegistry();

  return (
    <div>
      <button
        data-testid="clear-all-btn"
        onClick={() => registeredViews.forEach(id => unregisterView(id))}
      >
        Clear All
      </button>
      <span data-testid="registry-size">{Object.keys(registry).length}</span>
    </div>
  );
}

/** Duplicate registration test component */
function DuplicateRegistrationTest() {
  const { registry, registerView, registeredViews } = useViewRegistry();

  return (
    <div>
      <button
        data-testid="update-btn"
        onClick={() => registerView(createTestConfig('progress', '更新标题'))}
      >
        Update
      </button>
      <span data-testid="title">{registry['progress']?.title || 'N/A'}</span>
      <span data-testid="registry-size">{Object.keys(registry).length}</span>
      <span data-testid="registered-views-has">{String(registeredViews.has('progress'))}</span>
    </div>
  );
}

// =============================================================================
// Component mocks - extracted to reduce file bloat (must be at module top level)
// =============================================================================

vi.mock('@/components/MistakeBook', () => ({
  MistakeBook: vi.fn(() => <div data-testid="mistake-book">MistakeBook</div>),
}));
vi.mock('@/components/HistoryView', () => ({
  HistoryView: vi.fn(() => <div data-testid="history-view">HistoryView</div>),
}));
vi.mock('@/components/DataManager', () => ({
  DataManager: vi.fn(() => <div data-testid="data-manager">DataManager</div>),
}));
vi.mock('@/components/SmartReview', () => ({
  SmartReview: vi.fn(() => <div data-testid="smart-review">SmartReview</div>),
}));
vi.mock('@/components/DailyChallengePanel', () => ({
  DailyChallengePanel: vi.fn(() => <div data-testid="daily-challenge-panel">DailyChallengePanel</div>),
}));
vi.mock('@/components/BadgePanel', () => ({
  BadgePanel: vi.fn(() => <div data-testid="badge-panel">BadgePanel</div>),
}));
vi.mock('@/components/Leaderboard', () => ({
  Leaderboard: vi.fn(() => <div data-testid="leaderboard">Leaderboard</div>),
}));
vi.mock('@/components/ProgressHub', () => ({
  ProgressHub: vi.fn(() => <div data-testid="progress-hub">ProgressHub</div>),
}));
vi.mock('@/components/LearningProfile', () => ({
  LearningProfile: vi.fn(() => <div data-testid="learning-profile">LearningProfile</div>),
}));
vi.mock('@/components/WeaknessPanel', () => ({
  WeaknessPanel: vi.fn(() => <div data-testid="weakness-panel">WeaknessPanel</div>),
}));
vi.mock('@/components/LearningEfficiencyPanel', () => ({
  LearningEfficiencyPanel: vi.fn(() => <div data-testid="learning-efficiency-panel">LearningEfficiencyPanel</div>),
}));
vi.mock('@/components/InviteFriendsPanel', () => ({
  InviteFriendsPanel: vi.fn(() => <div data-testid="invite-friends-panel">InviteFriendsPanel</div>),
}));
vi.mock('@/components/GoalSettingPanel', () => ({
  GoalSettingPanel: vi.fn(() => <div data-testid="goal-setting-panel">GoalSettingPanel</div>),
}));
vi.mock('@/components/ChurnWarningDashboard', () => ({
  ChurnWarningDashboard: vi.fn(() => <div data-testid="churn-warning-dashboard">ChurnWarningDashboard</div>),
}));
vi.mock('@/components/LearnInsightPanel', () => ({
  LearnInsightPanel: vi.fn(() => <div data-testid="learn-insight-panel">LearnInsightPanel</div>),
}));
vi.mock('@/components/LearnInsightDashboard', () => ({
  LearnInsightDashboard: vi.fn(() => <div data-testid="learn-insight-dashboard">LearnInsightDashboard</div>),
}));
vi.mock('@/components/LearningReportPanel', () => ({
  LearningReportPanel: vi.fn(() => <div data-testid="learning-report-panel">LearningReportPanel</div>),
}));
vi.mock('@/components/DictionaryBrowser', () => ({
  DictionaryBrowser: vi.fn(() => <div data-testid="dictionary-browser">DictionaryBrowser</div>),
}));

describe('ViewRouter Registry', () => {
  afterEach(() => {
    cleanup();
  });

  describe('ViewRegistryProvider', () => {

    it('should provide empty registry by default', () => {
      render(
        <ViewRegistryProvider>
          <RegistryDisplay />
        </ViewRegistryProvider>
      );

      expect(screen.getByTestId('registry-size')).toHaveTextContent('0');
      expect(screen.getByTestId('views-count')).toHaveTextContent('0');
    });

    it('should register initial configs', () => {
      const initialConfigs = [
        createTestConfig('practice', '练习'),
        createTestConfig('progress', '进度'),
      ];

      render(
        <ViewRegistryProvider initialConfigs={initialConfigs}>
          <RegistrationStatus viewId="progress" />
        </ViewRegistryProvider>
      );

      expect(screen.getByTestId('registry-size')).toHaveTextContent('2');
      expect(screen.getByTestId('is-registered')).toHaveTextContent('true');
    });

    it('should register views dynamically', () => {
      render(
        <ViewRegistryProvider>
          <DynamicRegistrationTest />
        </ViewRegistryProvider>
      );

      expect(screen.getByTestId('registry-size')).toHaveTextContent('0');
      expect(screen.getByTestId('is-registered')).toHaveTextContent('false');

      act(() => {
        screen.getByTestId('register-btn').click();
      });

      expect(screen.getByTestId('registry-size')).toHaveTextContent('1');
      expect(screen.getByTestId('is-registered')).toHaveTextContent('true');
    });

    it('should unregister views', () => {
      const initialConfigs = [createTestConfig('test-view', '测试视图')];

      render(
        <ViewRegistryProvider initialConfigs={initialConfigs}>
          <UnregistrationTest />
        </ViewRegistryProvider>
      );

      expect(screen.getByTestId('registry-size')).toHaveTextContent('1');
      expect(screen.getByTestId('is-registered')).toHaveTextContent('true');

      act(() => {
        screen.getByTestId('unregister-btn').click();
      });

      expect(screen.getByTestId('registry-size')).toHaveTextContent('0');
      expect(screen.getByTestId('is-registered')).toHaveTextContent('false');
    });

    it('should batch register views', () => {
      render(
        <ViewRegistryProvider>
          <BatchRegistrationTest />
        </ViewRegistryProvider>
      );

      expect(screen.getByTestId('registry-size')).toHaveTextContent('0');

      act(() => {
        screen.getByTestId('batch-register-btn').click();
      });

      expect(screen.getByTestId('registry-size')).toHaveTextContent('3');
    });

    it('should get view config by id', () => {
      const initialConfigs = [
        createTestConfig('progress', '学习进度', { i18n: 'nav.progress', icon: 'chart' }),
      ];

      render(
        <ViewRegistryProvider initialConfigs={initialConfigs}>
          <ConfigDisplay viewId="progress" />
        </ViewRegistryProvider>
      );

      expect(screen.getByTestId('has-config')).toHaveTextContent('true');
      expect(screen.getByTestId('config-title')).toHaveTextContent('学习进度');
      expect(screen.getByTestId('config-i18n')).toHaveTextContent('nav.progress');
      expect(screen.getByTestId('config-icon')).toHaveTextContent('chart');
    });

    it('should throw error when useViewRegistry is used outside provider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      function TestComponent() {
        useViewRegistry();
        return <div>Test</div>;
      }

      expect(() => render(<TestComponent />)).toThrow('useViewRegistry must be used within a ViewRegistryProvider');

      consoleError.mockRestore();
    });
  });

  describe('Registry edge cases', () => {
    it('should overwrite existing config when registering duplicate view ID', () => {
      const initialConfigs = [createTestConfig('progress', '原始标题')];

      render(
        <ViewRegistryProvider initialConfigs={initialConfigs}>
          <DuplicateRegistrationTest />
        </ViewRegistryProvider>
      );

      expect(screen.getByTestId('title')).toHaveTextContent('原始标题');
      expect(screen.getByTestId('registry-size')).toHaveTextContent('1');
      expect(screen.getByTestId('registered-views-has')).toHaveTextContent('true');

      act(() => {
        screen.getByTestId('update-btn').click();
      });

      expect(screen.getByTestId('title')).toHaveTextContent('更新标题');
      expect(screen.getByTestId('registry-size')).toHaveTextContent('1');
      // Verify the view remains registered after duplicate registration
      expect(screen.getByTestId('registered-views-has')).toHaveTextContent('true');
    });

    it('should clear entire registry', () => {
      const initialConfigs = [
        createTestConfig('progress', '进度'),
        createTestConfig('profile', '档案'),
      ];

      render(
        <ViewRegistryProvider initialConfigs={initialConfigs}>
          <ClearAllTest />
        </ViewRegistryProvider>
      );

      expect(screen.getByTestId('registry-size')).toHaveTextContent('2');

      act(() => {
        screen.getByTestId('clear-all-btn').click();
      });

      expect(screen.getByTestId('registry-size')).toHaveTextContent('0');
    });

    it('should handle empty initial configs array', () => {
      render(
        <ViewRegistryProvider initialConfigs={[]}>
          <RegistryDisplay />
        </ViewRegistryProvider>
      );

      expect(screen.getByTestId('registry-size')).toHaveTextContent('0');
      expect(screen.getByTestId('views-count')).toHaveTextContent('0');
    });

    it('should return undefined for non-existent view config', () => {
      function TestComponent() {
        const { getViewConfig } = useViewRegistry();
        const config = getViewConfig('non-existent-view');

        return (
          <div>
            <span data-testid="config-exists">{String(!!config)}</span>
          </div>
        );
      }

      render(
        <ViewRegistryProvider>
          <TestComponent />
        </ViewRegistryProvider>
      );

      expect(screen.getByTestId('config-exists')).toHaveTextContent('false');
    });
  });

  describe('ViewNavigator integration', () => {
    it('should create ViewNavigator with setView', () => {
      const setView = vi.fn();
      const navigator = new ViewNavigator(setView);

      expect(() => navigator.navigate('progress')).not.toThrow();
      expect(setView).toHaveBeenCalledWith('progress');
    });

    it('should go back to practice view', () => {
      const setView = vi.fn();
      const navigator = new ViewNavigator(setView);

      navigator.goBack();
      expect(setView).toHaveBeenCalledWith('practice');
    });

    it('should throw error when ViewNavigator is created without setView', () => {
      expect(() => new ViewNavigator(null as unknown as (_view: View) => void)).toThrow(
        'ViewNavigator requires a setView function'
      );
    });

    it('should accept registry in constructor for metadata access', () => {
      const setView = vi.fn();
      const registry = { practice: { title: 'Practice', icon: 'practice' } };
      const navigator = new ViewNavigator(setView, registry);

      // Registry is passed but not used directly - metadata is accessed internally during navigation
      navigator.navigate('practice');
      expect(setView).toHaveBeenCalledWith('practice');
    });
  });

  describe('Registry-based navigation metadata', () => {
    it('should provide metadata through registry config', () => {
      const initialConfigs = [
        createTestConfig('progress', '学习进度', {
          i18n: 'nav.progress',
          icon: 'chart',
          a11yRole: 'navigation',
          metadata: { requiresAuth: true, priority: 1 },
        }),
      ];

      render(
        <ViewRegistryProvider initialConfigs={initialConfigs}>
          <ConfigDisplay viewId="progress" />
        </ViewRegistryProvider>
      );

      expect(screen.getByTestId('has-config')).toHaveTextContent('true');
      expect(screen.getByTestId('config-metadata')).toHaveTextContent('{"requiresAuth":true,"priority":1}');
      expect(screen.getByTestId('config-a11y')).toHaveTextContent('navigation');
    });
  });
});