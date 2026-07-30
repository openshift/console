import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import ConsolePluginDescriptionDetail from '../ConsolePluginDescriptionDetail';
import {
  addFailedPlugin,
  addLoadedPlugin,
  addPendingPlugin,
  createTestPluginStore,
} from './pluginTestUtils';

describe('ConsolePluginDescriptionDetail', () => {
  const createMockObj = (name: string) => ({
    metadata: { name },
  });

  const renderComponent = (
    pluginName: string,
    setupStore: (store: ReturnType<typeof createTestPluginStore>) => void,
  ) => {
    renderWithProviders(<ConsolePluginDescriptionDetail obj={createMockObj(pluginName)} />, {
      pluginStore: createTestPluginStore(setupStore),
    });
  };

  it('should display plugin description when plugin is loaded', () => {
    renderComponent('test-plugin', (store) => {
      addLoadedPlugin(store, 'test-plugin', {
        customProperties: { console: { description: 'A test plugin' } },
      });
    });

    expect(screen.getByText('A test plugin')).toBeVisible();
  });

  it('should display dash when plugin is not loaded', () => {
    renderComponent('test-plugin', (store) => {
      addPendingPlugin(store, 'test-plugin');
    });

    expect(screen.getByText('-')).toBeVisible();
  });

  it('should display dash when plugin has no description', () => {
    renderComponent('test-plugin', (store) => {
      addLoadedPlugin(store, 'test-plugin');
    });

    expect(screen.getByText('-')).toBeVisible();
  });

  it('should display dash when plugin is not found', () => {
    renderComponent('test-plugin', (store) => {
      addLoadedPlugin(store, 'other-plugin', {
        customProperties: { console: { description: 'Other desc' } },
      });
    });

    expect(screen.getByText('-')).toBeVisible();
  });

  it('should display dash when plugin failed to load', () => {
    renderComponent('test-plugin', (store) => {
      addFailedPlugin(store, 'test-plugin', 'Load failed');
    });

    expect(screen.getByText('-')).toBeVisible();
  });

  it('should find correct plugin among multiple plugins', () => {
    renderComponent('target-plugin', (store) => {
      addLoadedPlugin(store, 'plugin-a', {
        customProperties: { console: { description: 'First plugin' } },
      });
      addLoadedPlugin(store, 'target-plugin', {
        customProperties: { console: { description: 'Target description' } },
      });
      addLoadedPlugin(store, 'plugin-b', {
        customProperties: { console: { description: 'Third plugin' } },
      });
    });

    expect(screen.getByText('Target description')).toBeVisible();
  });
});
