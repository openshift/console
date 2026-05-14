import { screen } from '@testing-library/react';
import {
  metricsFromBareMetalHosts,
  useIsBareMetalPluginActive,
  useWatchBareMetalHost,
} from '@console/app/src/components/nodes/NodeBareMetalUtils';
import type { K8sResourceKind } from '@console/dynamic-plugin-sdk/src';
import type { NodeKind } from '@console/internal/module/k8s';
import { InventoryItem } from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
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

jest.mock('@console/internal/components/utils/resource-link', () => ({
  resourcePathFromModel: jest.fn(
    (model, name, namespace) => `/k8s/ns/${namespace}/${model.plural}/${name}`,
  ),
}));

jest.mock('@console/shared/src/constants/ui', () => ({
  DASH: '-',
}));

jest.mock('@console/shared/src/components/dashboard/inventory-card/InventoryItem', () => ({
  InventoryItem: jest.fn(
    ({ title, count, isLoading }: { title: string; count: React.ReactNode; isLoading: boolean }) =>
      isLoading ? `${title}: Loading...` : `${title}: ${count}`,
  ),
}));

const useIsBareMetalPluginActiveMock = useIsBareMetalPluginActive as jest.Mock;
const useWatchBareMetalHostMock = useWatchBareMetalHost as jest.Mock;
const metricsFromBareMetalHostsMock = metricsFromBareMetalHosts as jest.Mock;
const MockInventoryItem = (InventoryItem as unknown) as jest.Mock;

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

  const renderWithContext = (node: NodeKind = mockNode) =>
    renderWithProviders(
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

    expect(MockInventoryItem).not.toHaveBeenCalled();
  });

  it('should show loading state when data is loading', () => {
    useIsBareMetalPluginActiveMock.mockReturnValue(true);
    useWatchBareMetalHostMock.mockReturnValue([null, false, undefined]);

    renderWithContext();

    expect(screen.getAllByText(/Loading\.\.\./)).toHaveLength(3);
  });

  it('should display dash when there is an error loading', () => {
    useIsBareMetalPluginActiveMock.mockReturnValue(true);
    useWatchBareMetalHostMock.mockReturnValue([null, true, new Error('Failed to load')]);

    renderWithContext();

    const dashItems = screen.getAllByText('-');
    expect(dashItems).toHaveLength(3);
  });

  it('should display dash when no bare metal host is found', () => {
    useIsBareMetalPluginActiveMock.mockReturnValue(true);
    useWatchBareMetalHostMock.mockReturnValue([null, true, undefined]);

    renderWithContext();

    const dashItems = screen.getAllByText('-');
    expect(dashItems).toHaveLength(3);
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

    expect(screen.getByRole('link', { name: 'Disk: 3' })).toHaveAttribute(
      'href',
      '/k8s/ns/openshift-machine-api/baremetalhosts/test-host/disks',
    );
    expect(screen.getByRole('link', { name: 'Network interface: 2' })).toHaveAttribute(
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

    const dashItems = screen.getAllByText('-');
    expect(dashItems).toHaveLength(3);
  });
});
