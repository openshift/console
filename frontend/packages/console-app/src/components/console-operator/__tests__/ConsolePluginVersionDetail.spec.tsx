import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import ConsolePluginVersionDetail from '../ConsolePluginVersionDetail';
import {
  addLoadedPlugin,
  addLoadedPluginWithoutVersion,
  createTestPluginStore,
} from './pluginTestUtils';

describe('ConsolePluginVersionDetail', () => {
  const createMockObj = (name: string) => ({
    metadata: { name },
  });

  const renderComponent = (
    pluginName: string,
    setupStore: (store: ReturnType<typeof createTestPluginStore>) => void,
  ) => {
    renderWithProviders(<ConsolePluginVersionDetail obj={createMockObj(pluginName)} />, {
      pluginStore: createTestPluginStore(setupStore),
    });
  };

  it('should display plugin version when plugin is found', () => {
    renderComponent('test-plugin', (store) => {
      addLoadedPlugin(store, 'test-plugin', { version: '1.2.3' });
    });

    expect(screen.getByText('1.2.3')).toBeVisible();
  });

  it('should display dash when plugin is not found', () => {
    renderComponent('test-plugin', (store) => {
      addLoadedPlugin(store, 'other-plugin', { version: '1.0.0' });
    });

    expect(screen.getByText('-')).toBeVisible();
  });

  it('should display dash when plugin has no version', () => {
    renderComponent('test-plugin', (store) => {
      addLoadedPluginWithoutVersion(store, 'test-plugin');
    });

    expect(screen.getByText('-')).toBeVisible();
  });

  it('should display dash when plugin list is empty', () => {
    renderComponent('test-plugin', () => {});

    expect(screen.getByText('-')).toBeVisible();
  });

  it('should find correct plugin among multiple plugins', () => {
    renderComponent('target-plugin', (store) => {
      addLoadedPlugin(store, 'plugin-a', { version: '1.0.0' });
      addLoadedPlugin(store, 'target-plugin', { version: '2.5.0' });
      addLoadedPlugin(store, 'plugin-b', { version: '3.0.0' });
    });

    expect(screen.getByText('2.5.0')).toBeVisible();
  });
});
