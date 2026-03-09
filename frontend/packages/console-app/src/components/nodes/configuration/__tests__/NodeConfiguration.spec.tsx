import { useResolvedExtensions } from '@openshift/dynamic-plugin-sdk';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NodeStorage from '@console/app/src/components/nodes/configuration/node-storage/NodeStorage';
import type { NodeKind } from '@console/dynamic-plugin-sdk/src';
import * as RouterUtils from '@console/internal/components/utils/router';
import { useQueryParams } from '@console/shared/src';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { NodeConfiguration } from '../NodeConfiguration';

jest.mock('@console/shared/src', () => ({
  useQueryParams: jest.fn(),
}));

jest.mock('../node-storage/NodeStorage', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('../NodeMachine', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('@console/internal/components/utils/router', () => ({
  ...jest.requireActual('@console/internal/components/utils/router'),
  useQueryParamsMutator: jest.fn(),
}));

jest.mock('@openshift/dynamic-plugin-sdk', () => ({
  ...jest.requireActual('@openshift/dynamic-plugin-sdk'),
  useResolvedExtensions: jest.fn(),
}));

const useQueryParamsMock = useQueryParams as jest.Mock;
const setQueryArgumentMock = jest.fn();
const setAllQueryArgumentsMock = jest.fn();
const mockUseResolvedExtensions = useResolvedExtensions as jest.Mock;

describe('NodeConfiguration', () => {
  const mockNode: NodeKind = {
    apiVersion: 'v1',
    kind: 'Node',
    metadata: {
      name: 'test-node',
      uid: 'test-uid',
    },
    spec: {},
    status: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock useQueryParamsMutator
    (RouterUtils.useQueryParamsMutator as jest.Mock).mockReturnValue({
      getQueryArgument: jest.fn(),
      setQueryArgument: setQueryArgumentMock,
      setQueryArguments: jest.fn(),
      setAllQueryArguments: setAllQueryArgumentsMock,
      removeQueryArgument: jest.fn(),
      removeQueryArguments: jest.fn(),
      setOrRemoveQueryArgument: jest.fn(),
    });
    useQueryParamsMock.mockReturnValue(new URLSearchParams());
    mockUseResolvedExtensions.mockReturnValue([[], true]);
  });

  it('should render Storage tab by default', () => {
    const mockQueryParams = new URLSearchParams();
    useQueryParamsMock.mockReturnValue(mockQueryParams);

    render(<NodeConfiguration obj={mockNode} />);

    expect(screen.getByText('Storage')).toBeInTheDocument();
    expect(screen.getByText('Machine')).toBeInTheDocument();

    const tabs = screen.getAllByRole('tab');
    const storageTab = tabs.find((tab) => tab.textContent === 'Storage');
    const machineTab = tabs.find((tab) => tab.textContent === 'Machine');

    expect(storageTab).toHaveAttribute('aria-selected', 'true');
    expect(machineTab).toHaveAttribute('aria-selected', 'false');
  });

  it('should render Machine tab when activeTab query param is set', () => {
    const mockQueryParams = new URLSearchParams('activeTab=machine');
    useQueryParamsMock.mockReturnValue(mockQueryParams);

    render(<NodeConfiguration obj={mockNode} />);

    const tabs = screen.getAllByRole('tab');
    const machineTab = tabs.find((tab) => tab.textContent === 'Machine');

    expect(machineTab).toHaveAttribute('aria-selected', 'true');
  });

  it('should update query argument when tab is clicked', () => {
    const mockQueryParams = new URLSearchParams();
    useQueryParamsMock.mockReturnValue(mockQueryParams);

    render(<NodeConfiguration obj={mockNode} />);

    const machineTab = screen.getByText('Machine');
    fireEvent.click(machineTab);

    expect(setAllQueryArgumentsMock).toHaveBeenCalledWith({ activeTab: 'machine' });
  });

  it('should render vertical tabs navigation', () => {
    const mockQueryParams = new URLSearchParams();
    useQueryParamsMock.mockReturnValue(mockQueryParams);

    const { container } = render(<NodeConfiguration obj={mockNode} />);

    const tabsNav = container.querySelector('nav');
    expect(tabsNav).toBeInTheDocument();
  });

  it('should have correct data-test-id attributes', () => {
    const mockQueryParams = new URLSearchParams();
    useQueryParamsMock.mockReturnValue(mockQueryParams);

    const { container } = render(<NodeConfiguration obj={mockNode} />);

    expect(container.querySelector('[data-test-id="subnav-storage"]')).toBeInTheDocument();
    expect(container.querySelector('[data-test-id="subnav-machine"]')).toBeInTheDocument();
  });

  it('should render tabs from plugin extensions with parentTab configuration', () => {
    const mockExtensions = [
      {
        type: 'console.tab/nodeSubNavTab',
        properties: {
          parentTab: 'configuration',
          page: {
            tabId: 'custom-tab',
            name: 'Custom Tab',
            priority: 60,
          },
          component: jest.fn(() => 'CustomComponent'),
        },
      },
    ];

    mockUseResolvedExtensions.mockReturnValue([mockExtensions, true]);

    renderWithProviders(<NodeConfiguration obj={mockNode} />);

    expect(screen.getByRole('tab', { name: /Custom Tab/i })).toBeVisible();
  });

  it('should filter out extensions with different parentTab values', () => {
    const mockExtensions = [
      {
        type: 'console.tab/nodeSubNavTab',
        properties: {
          parentTab: 'health',
          page: {
            tabId: 'health-tab',
            name: 'Health Tab',
            priority: 60,
          },
          component: jest.fn(() => 'HealthComponent'),
        },
      },
      {
        type: 'console.tab/nodeSubNavTab',
        properties: {
          parentTab: 'workload',
          page: {
            tabId: 'workload-tab',
            name: 'Workload Tab',
            priority: 60,
          },
          component: jest.fn(() => 'WorkloadComponent'),
        },
      },
    ];

    mockUseResolvedExtensions.mockReturnValue([mockExtensions, true]);

    renderWithProviders(<NodeConfiguration obj={mockNode} />);

    expect(screen.queryByRole('tab', { name: /Health Tab/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Workload Tab/i })).not.toBeInTheDocument();
  });

  it('should sort tabs by priority in descending order', () => {
    const mockExtensions = [
      {
        type: 'console.tab/nodeSubNavTab',
        properties: {
          parentTab: 'configuration',
          page: {
            tabId: 'low-priority-tab',
            name: 'Low Priority',
            priority: 30,
          },
          component: jest.fn(() => 'LowPriorityComponent'),
        },
      },
      {
        type: 'console.tab/nodeSubNavTab',
        properties: {
          parentTab: 'configuration',
          page: {
            tabId: 'high-priority-tab',
            name: 'High Priority',
            priority: 90,
          },
          component: jest.fn(() => 'HighPriorityComponent'),
        },
      },
    ];

    mockUseResolvedExtensions.mockReturnValue([mockExtensions, true]);

    renderWithProviders(<NodeConfiguration obj={mockNode} />);

    const tabs = screen.getAllByRole('tab');
    const tabNames = tabs.map((tab) => within(tab).getByText(/\w+/).textContent);

    // Expected order: High Priority (90), Storage (70), Machine (50), Low Priority (30)
    expect(tabNames).toEqual(['High Priority', 'Storage', 'Machine', 'Low Priority']);
  });

  it('should render component from plugin extension when tab is active', async () => {
    const MockComponent = jest.fn(() => 'PluginComponent');
    const mockExtensions = [
      {
        type: 'console.tab/nodeSubNavTab',
        properties: {
          parentTab: 'configuration',
          page: {
            tabId: 'plugin-tab',
            name: 'Plugin Tab',
            priority: 80,
          },
          component: MockComponent,
        },
      },
    ];

    mockUseResolvedExtensions.mockReturnValue([mockExtensions, true]);
    useQueryParamsMock.mockReturnValue(new URLSearchParams('activeTab=plugin-tab'));

    renderWithProviders(<NodeConfiguration obj={mockNode} />);

    expect(screen.getByText('PluginComponent')).toBeInTheDocument();
    expect(MockComponent).toHaveBeenCalledWith({ obj: mockNode }, {});
  });

  it('should pass node object as obj prop to tab components', () => {
    renderWithProviders(<NodeConfiguration obj={mockNode} />);

    expect(NodeStorage).toHaveBeenCalledWith({ obj: mockNode }, {});
  });

  it('should handle multiple plugin extensions with same priority', () => {
    const mockExtensions = [
      {
        type: 'console.tab/nodeSubNavTab',
        properties: {
          parentTab: 'configuration',
          page: {
            tabId: 'tab-1',
            name: 'Tab One',
            priority: 60,
          },
          component: jest.fn(() => 'ComponentOne'),
        },
      },
      {
        type: 'console.tab/nodeSubNavTab',
        properties: {
          parentTab: 'configuration',
          page: {
            tabId: 'tab-2',
            name: 'Tab Two',
            priority: 60,
          },
          component: jest.fn(() => 'ComponentTwo'),
        },
      },
    ];

    mockUseResolvedExtensions.mockReturnValue([mockExtensions, true]);

    renderWithProviders(<NodeConfiguration obj={mockNode} />);

    expect(screen.getByRole('tab', { name: /Tab One/i })).toBeVisible();
    expect(screen.getByRole('tab', { name: /Tab Two/i })).toBeVisible();
  });

  it('should handle tab names using nameKey for i18n translation', () => {
    renderWithProviders(<NodeConfiguration obj={mockNode} />);

    // Storage and Machine tabs use nameKey which gets translated
    expect(screen.getByRole('tab', { name: /Storage/i })).toBeVisible();
    expect(screen.getByRole('tab', { name: /Machine/i })).toBeVisible();
  });

  it('should handle tab names using direct name property from extensions', () => {
    const mockExtensions = [
      {
        type: 'console.tab/nodeSubNavTab',
        properties: {
          parentTab: 'configuration',
          page: {
            tabId: 'direct-name-tab',
            name: 'Direct Name Tab',
            priority: 60,
          },
          component: jest.fn(() => 'DirectNameComponent'),
        },
      },
    ];

    mockUseResolvedExtensions.mockReturnValue([mockExtensions, true]);

    renderWithProviders(<NodeConfiguration obj={mockNode} />);

    expect(screen.getByRole('tab', { name: /Direct Name Tab/i })).toBeVisible();
  });

  it('should switch to plugin extension tab when clicked', async () => {
    const user = userEvent.setup();
    const mockExtensions = [
      {
        type: 'console.tab/nodeSubNavTab',
        properties: {
          parentTab: 'configuration',
          page: {
            tabId: 'clickable-tab',
            name: 'Clickable Tab',
            priority: 60,
          },
          component: jest.fn(() => 'ClickableComponent'),
        },
      },
    ];

    mockUseResolvedExtensions.mockReturnValue([mockExtensions, true]);

    renderWithProviders(<NodeConfiguration obj={mockNode} />);

    const clickableTab = screen.getByRole('tab', { name: /Clickable Tab/i });
    await user.click(clickableTab);

    expect(setAllQueryArgumentsMock).toHaveBeenCalledWith({ activeTab: 'clickable-tab' });
  });

  it('should render only configuration parentTab extensions and not other types', () => {
    const mockExtensions = [
      {
        type: 'console.tab/nodeSubNavTab',
        properties: {
          parentTab: 'configuration',
          page: {
            tabId: 'config-tab',
            name: 'Config Tab',
            priority: 60,
          },
          component: jest.fn(() => 'ConfigComponent'),
        },
      },
      {
        type: 'console.tab/nodeSubNavTab',
        properties: {
          parentTab: 'health',
          page: {
            tabId: 'health-tab',
            name: 'Health Tab',
            priority: 60,
          },
          component: jest.fn(() => 'HealthComponent'),
        },
      },
      {
        type: 'console.tab/nodeSubNavTab',
        properties: {
          parentTab: 'workload',
          page: {
            tabId: 'workload-tab',
            name: 'Workload Tab',
            priority: 60,
          },
          component: jest.fn(() => 'WorkloadComponent'),
        },
      },
    ];

    mockUseResolvedExtensions.mockReturnValue([mockExtensions, true]);

    renderWithProviders(<NodeConfiguration obj={mockNode} />);

    // Only configuration tab should be visible
    expect(screen.getByRole('tab', { name: /Config Tab/i })).toBeVisible();
    expect(screen.queryByRole('tab', { name: /Health Tab/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Workload Tab/i })).not.toBeInTheDocument();
  });
});
