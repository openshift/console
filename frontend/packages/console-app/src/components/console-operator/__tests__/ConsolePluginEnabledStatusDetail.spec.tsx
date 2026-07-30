import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import * as ConsoleOperatorConfigModule from '../ConsoleOperatorConfig';
import ConsolePluginEnabledStatusDetail from '../ConsolePluginEnabledStatusDetail';
import { addLoadedPlugin, createTestPluginStore } from './pluginTestUtils';

jest.mock('../ConsoleOperatorConfig', () => ({
  ConsolePluginEnabledStatus: ({
    pluginName,
    enabled,
  }: {
    pluginName: string;
    enabled: boolean;
  }) => (
    <span>
      {pluginName}: {enabled ? 'Enabled' : 'Disabled'}
    </span>
  ),
  developmentMode: false,
  useConsoleOperatorConfigData: jest.fn(),
}));

const mockUseConsoleOperatorConfigData = ConsoleOperatorConfigModule.useConsoleOperatorConfigData as jest.Mock;

describe('ConsolePluginEnabledStatusDetail', () => {
  const createMockObj = (name: string) => ({
    metadata: { name },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (
    pluginName: string,
    setupStore: (store: ReturnType<typeof createTestPluginStore>) => void,
    configData: ReturnType<typeof mockUseConsoleOperatorConfigData>,
  ) => {
    mockUseConsoleOperatorConfigData.mockReturnValue(configData);
    renderWithProviders(<ConsolePluginEnabledStatusDetail obj={createMockObj(pluginName)} />, {
      pluginStore: createTestPluginStore(setupStore),
    });
  };

  it('should display enabled status when plugin is in enabled list', () => {
    renderComponent(
      'test-plugin',
      (store) => {
        addLoadedPlugin(store, 'test-plugin');
      },
      {
        consoleOperatorConfig: {
          spec: {
            plugins: ['test-plugin'],
          },
        },
        consoleOperatorConfigLoaded: true,
      },
    );

    expect(screen.getByText('test-plugin: Enabled')).toBeVisible();
  });

  it('should display disabled status when plugin is not in enabled list', () => {
    renderComponent(
      'test-plugin',
      (store) => {
        addLoadedPlugin(store, 'test-plugin');
      },
      {
        consoleOperatorConfig: {
          spec: {
            plugins: ['other-plugin'],
          },
        },
        consoleOperatorConfigLoaded: true,
      },
    );

    expect(screen.getByText('test-plugin: Disabled')).toBeVisible();
  });

  it('should display dash when config is not loaded', () => {
    renderComponent(
      'test-plugin',
      (store) => {
        addLoadedPlugin(store, 'test-plugin');
      },
      {
        consoleOperatorConfig: null,
        consoleOperatorConfigLoaded: false,
      },
    );

    expect(screen.getByText('-')).toBeVisible();
  });

  it('should display dash when plugin name is undefined', () => {
    mockUseConsoleOperatorConfigData.mockReturnValue({
      consoleOperatorConfig: {
        spec: {
          plugins: [],
        },
      },
      consoleOperatorConfigLoaded: true,
    });

    renderWithProviders(<ConsolePluginEnabledStatusDetail obj={{ metadata: {} }} />, {
      pluginStore: createTestPluginStore(),
    });

    expect(screen.getByText('-')).toBeVisible();
  });

  it('should handle empty plugins list', () => {
    renderComponent(
      'test-plugin',
      (store) => {
        addLoadedPlugin(store, 'test-plugin');
      },
      {
        consoleOperatorConfig: {
          spec: {
            plugins: [],
          },
        },
        consoleOperatorConfigLoaded: true,
      },
    );

    expect(screen.getByText('test-plugin: Disabled')).toBeVisible();
  });

  it('should handle undefined plugins in config', () => {
    renderComponent(
      'test-plugin',
      (store) => {
        addLoadedPlugin(store, 'test-plugin');
      },
      {
        consoleOperatorConfig: {
          spec: {},
        },
        consoleOperatorConfigLoaded: true,
      },
    );

    expect(screen.getByText('test-plugin: Disabled')).toBeVisible();
  });
});
