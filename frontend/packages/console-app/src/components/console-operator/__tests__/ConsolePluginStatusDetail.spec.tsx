import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import ConsolePluginStatusDetail from '../ConsolePluginStatusDetail';
import {
  addFailedPlugin,
  addLoadedPlugin,
  addPendingPlugin,
  createTestPluginStore,
} from './pluginTestUtils';

jest.mock('../ConsoleOperatorConfig', () => ({
  ConsolePluginStatus: ({ status, errorMessage }: { status: string; errorMessage?: string }) => (
    <span>
      {status}
      {errorMessage && ` - ${errorMessage}`}
    </span>
  ),
}));

describe('ConsolePluginStatusDetail', () => {
  const createMockObj = (name: string) => ({
    metadata: { name },
  });

  const renderComponent = (
    pluginName: string,
    setupStore: (store: ReturnType<typeof createTestPluginStore>) => void,
  ) => {
    renderWithProviders(<ConsolePluginStatusDetail obj={createMockObj(pluginName)} />, {
      pluginStore: createTestPluginStore(setupStore),
    });
  };

  it('should display loaded status when plugin is loaded', () => {
    renderComponent('test-plugin', (store) => {
      addLoadedPlugin(store, 'test-plugin');
    });

    expect(screen.getByText('loaded')).toBeVisible();
  });

  it('should display pending status when plugin is pending', () => {
    renderComponent('test-plugin', (store) => {
      addPendingPlugin(store, 'test-plugin');
    });

    expect(screen.getByText('pending')).toBeVisible();
  });

  it('should display failed status with error message', () => {
    renderComponent('test-plugin', (store) => {
      addFailedPlugin(store, 'test-plugin', 'Network error');
    });

    expect(screen.getByText('failed - Network error')).toBeVisible();
  });

  it('should display dash when plugin is not found', () => {
    renderComponent('test-plugin', (store) => {
      addLoadedPlugin(store, 'other-plugin');
    });

    expect(screen.getByText('-')).toBeVisible();
  });

  it('should display dash when plugin list is empty', () => {
    renderComponent('test-plugin', () => {});

    expect(screen.getByText('-')).toBeVisible();
  });

  it('should find correct plugin among multiple plugins', () => {
    renderComponent('target-plugin', (store) => {
      addLoadedPlugin(store, 'plugin-a');
      addPendingPlugin(store, 'target-plugin');
      addLoadedPlugin(store, 'plugin-b');
    });

    expect(screen.getByText('pending')).toBeVisible();
  });
});
