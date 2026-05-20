import { render, screen } from '@testing-library/react';
import { useWatchVirtualMachineInstances } from '@console/app/src/components/nodes/utils/NodeVmUtils';
import { useIsKubevirtPluginActive } from '@console/app/src/utils/kubevirt';
import type { K8sResourceKind } from '@console/dynamic-plugin-sdk/src';
import type { NodeKind } from '@console/internal/module/k8s';
import { NodeDashboardContext } from '../NodeDashboardContext';
import VirtualMachinesInventoryItems from '../VirtualMachinesInventoryItems';

jest.mock('@console/app/src/components/nodes/utils/NodeVmUtils', () => ({
  VirtualMachineModel: {
    apiGroup: 'kubevirt.io',
    apiVersion: 'v1',
    kind: 'VirtualMachine',
    plural: 'virtualmachines',
  },
  useWatchVirtualMachineInstances: jest.fn(),
}));

jest.mock('@console/app/src/utils/kubevirt', () => ({
  useIsKubevirtPluginActive: jest.fn(),
}));

jest.mock('react-router', () => ({
  Link: jest.fn(({ to, children }) => <a href={to}>{children}</a>),
}));

jest.mock('@console/internal/components/utils/resource-link', () => ({
  resourcePathFromModel: jest.fn((model) => `/k8s/all-namespaces/${model.plural}`),
}));

jest.mock('@console/shared/src/components/dashboard/inventory-card/InventoryItem', () => ({
  InventoryItem: jest.fn(({ title, count, isLoading, error }) => (
    <div data-testid="inventory-item">
      {isLoading ? 'Loading...' : error ? 'Error' : `${title}: ${count}`}
    </div>
  )),
}));

jest.mock('@console/shared/src/components/description-list/DescriptionListTermHelp', () => ({
  DescriptionListTermHelp: jest.fn(({ text }) => <dt>{text}</dt>),
}));

const useIsKubevirtPluginActiveMock = useIsKubevirtPluginActive as jest.Mock;
const useWatchVirtualMachineInstancesMock = useWatchVirtualMachineInstances as jest.Mock;

describe('VirtualMachinesInventoryItems', () => {
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

  const mockVirtualMachines: K8sResourceKind[] = [
    {
      apiVersion: 'kubevirt.io/v1',
      kind: 'VirtualMachine',
      metadata: {
        name: 'vm1',
        namespace: 'default',
        uid: 'vm-uid-1',
      },
    },
    {
      apiVersion: 'kubevirt.io/v1',
      kind: 'VirtualMachine',
      metadata: {
        name: 'vm2',
        namespace: 'openshift-cnv',
        uid: 'vm-uid-2',
      },
    },
  ];

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
        <VirtualMachinesInventoryItems />
      </NodeDashboardContext.Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when kubevirt plugin is not active', () => {
    useIsKubevirtPluginActiveMock.mockReturnValue(false);
    useWatchVirtualMachineInstancesMock.mockReturnValue([[], false, undefined]);

    renderWithContext();

    expect(screen.queryByTestId('inventory-item')).not.toBeInTheDocument();
  });

  it('should show loading state when data is loading', () => {
    useIsKubevirtPluginActiveMock.mockReturnValue(true);
    useWatchVirtualMachineInstancesMock.mockReturnValue([[], false, undefined]);

    renderWithContext();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should display error state when there is a load error', () => {
    useIsKubevirtPluginActiveMock.mockReturnValue(true);
    useWatchVirtualMachineInstancesMock.mockReturnValue([[], true, new Error('Failed to load')]);

    renderWithContext();

    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should display VM count when VMs are loaded', () => {
    useIsKubevirtPluginActiveMock.mockReturnValue(true);
    useWatchVirtualMachineInstancesMock.mockReturnValue([mockVirtualMachines, true, undefined]);

    renderWithContext();

    expect(screen.getByText('Virtual machine: 2')).toBeInTheDocument();
  });

  it('should render link to VM search page filtered by node', () => {
    useIsKubevirtPluginActiveMock.mockReturnValue(true);
    useWatchVirtualMachineInstancesMock.mockReturnValue([mockVirtualMachines, true, undefined]);

    renderWithContext();

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'href',
      '/k8s/all-namespaces/virtualmachines/search?rowFilter-node=test-node',
    );
  });

  it('should call useWatchVirtualMachineInstances with node name', () => {
    useIsKubevirtPluginActiveMock.mockReturnValue(true);
    useWatchVirtualMachineInstancesMock.mockReturnValue([[], false, undefined]);

    renderWithContext(mockNode);

    expect(useWatchVirtualMachineInstancesMock).toHaveBeenCalledWith('test-node');
  });

  it('should display Virtual machines label with help text', () => {
    useIsKubevirtPluginActiveMock.mockReturnValue(true);
    useWatchVirtualMachineInstancesMock.mockReturnValue([mockVirtualMachines, true, undefined]);

    renderWithContext();

    expect(screen.getByText('Virtual machines')).toBeInTheDocument();
  });

  it('should display zero count when no VMs are found', () => {
    useIsKubevirtPluginActiveMock.mockReturnValue(true);
    useWatchVirtualMachineInstancesMock.mockReturnValue([[], true, undefined]);

    renderWithContext();

    expect(screen.getByText('Virtual machine: 0')).toBeInTheDocument();
  });
});
