import { render, screen } from '@testing-library/react';
import {
  metricsFromBareMetalHosts,
  useIsBareMetalPluginActive,
  useWatchBareMetalHost,
} from '@console/app/src/components/nodes/NodeBareMetalUtils';
import type { K8sResourceKind } from '@console/dynamic-plugin-sdk/src';
import type { NodeKind } from '@console/internal/module/k8s';
import BareMetalInventoryItems from '../BareMetalInventoryItems';
import { NodeDashboardContext } from '../NodeDashboardContext';

jest.mock('@console/app/src/components/nodes/NodeBareMetalUtils', () => ({
  BareMetalHostModel: {
    apiGroup: 'metal3.io',
    apiVersion: 'v1alpha1',
    kind: 'BareMetalHost',
    plural: 'baremetalhosts',
  },
  metricsFromBareMetalHosts: jest.fn(),
  useIsBareMetalPluginActive: jest.fn(),
  useWatchBareMetalHost: jest.fn(),
}));

jest.mock('react-router', () => ({
  Link: jest.fn(({ to, children }) => <a href={to}>{children}</a>),
}));

jest.mock('@console/internal/components/utils/resource-link', () => ({
  resourcePathFromModel: jest.fn(
    (model, name, namespace) => `/k8s/ns/${namespace}/${model.plural}/${name}`,
  ),
}));

jest.mock('@console/shared/src', () => ({
  DASH: '-',
}));

jest.mock('@console/shared/src/components/dashboard/inventory-card/InventoryItem', () => ({
  InventoryItem: jest.fn(({ title, count, isLoading }) => (
    <div data-testid="inventory-item">{isLoading ? 'Loading...' : `${title}: ${count}`}</div>
  )),
}));

const useIsBareMetalPluginActiveMock = useIsBareMetalPluginActive as jest.Mock;
const useWatchBareMetalHostMock = useWatchBareMetalHost as jest.Mock;
const metricsFromBareMetalHostsMock = metricsFromBareMetalHosts as jest.Mock;

describe('BareMetalInventoryItems', () => {
  const mockNode: NodeKind = {
    apiVersion: 'v1',
    kind: 'Node',
    metadata: {
      name: 'test-node',
      uid: 'node-uid',
    },
    spec: {},
    status: {},
  };

  const mockBareMetalHost: K8sResourceKind = {
    apiVersion: 'metal3.io/v1alpha1',
    kind: 'BareMetalHost',
    metadata: {
      name: 'test-host',
      namespace: 'openshift-machine-api',
      uid: 'host-uid',
    },
    status: {
      hardware: {
        storage: [{}, {}, {}],
        nics: [{}, {}],
        cpu: {
          count: 8,
        },
      },
    },
  };

  const renderWithContext = (node: NodeKind = mockNode) => {
    return render(
      <NodeDashboardContext.Provider
        value={{
          obj: node,
          setCPULimit: () => {},
          setMemoryLimit: () => {},
          setHealthCheck: () => {},
        }}
      >
        <BareMetalInventoryItems />
      </NodeDashboardContext.Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    metricsFromBareMetalHostsMock.mockImplementation((host) => ({
      disks: host?.status?.hardware?.storage?.length,
      nics: host?.status?.hardware?.nics?.length,
      cpus: host?.status?.hardware?.cpu?.count,
    }));
  });

  it('should not render when bare metal plugin is not active', () => {
    useIsBareMetalPluginActiveMock.mockReturnValue(false);
    useWatchBareMetalHostMock.mockReturnValue([null, false, undefined]);

    renderWithContext();

    expect(screen.queryByTestId('inventory-item')).not.toBeInTheDocument();
  });

  it('should show loading state when data is loading', () => {
    useIsBareMetalPluginActiveMock.mockReturnValue(true);
    useWatchBareMetalHostMock.mockReturnValue([null, false, undefined]);

    renderWithContext();

    const loadingItems = screen.getAllByText('Loading...');
    expect(loadingItems).toHaveLength(3); // Disk, Network, CPU
  });

  it('should display dash when there is an error loading', () => {
    useIsBareMetalPluginActiveMock.mockReturnValue(true);
    useWatchBareMetalHostMock.mockReturnValue([null, true, new Error('Failed to load')]);

    renderWithContext();

    const dashItems = screen.getAllByText('-');
    expect(dashItems).toHaveLength(3); // Disk, Network, CPU
  });

  it('should display dash when no bare metal host is found', () => {
    useIsBareMetalPluginActiveMock.mockReturnValue(true);
    useWatchBareMetalHostMock.mockReturnValue([null, true, undefined]);

    renderWithContext();

    const dashItems = screen.getAllByText('-');
    expect(dashItems).toHaveLength(3); // Disk, Network, CPU
  });

  it('should display hardware metrics when bare metal host is loaded', () => {
    useIsBareMetalPluginActiveMock.mockReturnValue(true);
    useWatchBareMetalHostMock.mockReturnValue([mockBareMetalHost, true, undefined]);

    renderWithContext();

    expect(screen.getByText('Disk: 3')).toBeInTheDocument();
    expect(screen.getByText('Network interface: 2')).toBeInTheDocument();
    expect(screen.getByText('CPU: 8')).toBeInTheDocument();
  });

  it('should render links to bare metal host details for disk and network', () => {
    useIsBareMetalPluginActiveMock.mockReturnValue(true);
    useWatchBareMetalHostMock.mockReturnValue([mockBareMetalHost, true, undefined]);

    renderWithContext();

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2); // Disk and Network links

    expect(links[0]).toHaveAttribute(
      'href',
      '/k8s/ns/openshift-machine-api/baremetalhosts/test-host/disks',
    );
    expect(links[1]).toHaveAttribute(
      'href',
      '/k8s/ns/openshift-machine-api/baremetalhosts/test-host/nics',
    );
  });

  it('should not render links when bare metal host is not available', () => {
    useIsBareMetalPluginActiveMock.mockReturnValue(true);
    useWatchBareMetalHostMock.mockReturnValue([null, true, undefined]);

    renderWithContext();

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('should call useWatchBareMetalHost with the node object', () => {
    useIsBareMetalPluginActiveMock.mockReturnValue(true);
    useWatchBareMetalHostMock.mockReturnValue([null, false, undefined]);

    renderWithContext(mockNode);

    expect(useWatchBareMetalHostMock).toHaveBeenCalledWith(mockNode);
  });

  it('should display all three inventory items', () => {
    useIsBareMetalPluginActiveMock.mockReturnValue(true);
    useWatchBareMetalHostMock.mockReturnValue([mockBareMetalHost, true, undefined]);

    renderWithContext();

    expect(screen.getByText('Disk')).toBeInTheDocument();
    expect(screen.getByText('Network interface')).toBeInTheDocument();
    expect(screen.getByText('CPU')).toBeInTheDocument();
  });

  it('should handle missing hardware metrics gracefully', () => {
    useIsBareMetalPluginActiveMock.mockReturnValue(true);
    const hostWithoutMetrics = {
      ...mockBareMetalHost,
      status: {},
    };
    useWatchBareMetalHostMock.mockReturnValue([hostWithoutMetrics, true, undefined]);
    metricsFromBareMetalHostsMock.mockReturnValue({
      disks: undefined,
      nics: undefined,
      cpus: undefined,
    });

    renderWithContext();

    // When metrics are undefined, dashes should be shown
    const dashItems = screen.getAllByText('-');
    expect(dashItems).toHaveLength(3); // Disk, Network, CPU
  });
});
