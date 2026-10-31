import { render, screen } from '@testing-library/react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import type { NodeKind } from '@console/internal/module/k8s';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import BareMetalInventoryItems from '../BareMetalInventoryItems';
import InventoryCard from '../InventoryCard';
import { NodeDashboardContext } from '../NodeDashboardContext';
import VirtualMachinesInventoryItems from '../VirtualMachinesInventoryItems';

jest.mock('@console/shared/src/hooks/useFlag', () => ({
  useFlag: jest.fn(),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

// Mock child components using jest.fn
jest.mock('@console/app/src/components/nodes/node-dashboard/BareMetalInventoryItems', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock('@console/app/src/components/nodes/node-dashboard/VirtualMachinesInventoryItems', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

// Mock InventoryItem components
jest.mock('@console/shared/src/components/dashboard/inventory-card/InventoryItem', () => ({
  InventoryItem: ({ count }) => `Images: ${count || 0}`,
  ResourceInventoryItem: () => 'Pod Inventory',
}));

const useFlagMock = useFlag as jest.Mock;
const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;
const BareMetalInventoryItemsMock = BareMetalInventoryItems as jest.Mock;
const VirtualMachinesInventoryItemsMock = VirtualMachinesInventoryItems as jest.Mock;

describe('InventoryCard', () => {
  const mockNode: NodeKind = {
    apiVersion: 'v1',
    kind: 'Node',
    metadata: {
      name: 'test-node',
      uid: 'node-uid',
    },
    spec: {},
    status: {
      images: [{ names: ['image1'] }, { names: ['image2'] }],
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
        <InventoryCard />
      </NodeDashboardContext.Provider>,
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useK8sWatchResourceMock.mockReturnValue([[], true, undefined]);
  });

  it('should render the inventory card with title', () => {
    useFlagMock.mockReturnValue(false);
    renderWithContext();

    expect(screen.getByText('Inventory')).toBeVisible();
  });

  it('should render Pod and Image inventory items when NODE_MGMT_V1 flag state is false', () => {
    useFlagMock.mockReturnValue(false);
    renderWithContext();

    expect(screen.getByText('Pods')).toBeVisible();
    expect(screen.getByText('Pod Inventory')).toBeVisible();
    expect(screen.getByText('Images')).toBeVisible();
    expect(screen.getByText('Images: 2')).toBeVisible();
  });

  it('should render Pod and Image inventory items when NODE_MGMT_V1 flag state is true', () => {
    useFlagMock.mockReturnValue(true);
    renderWithContext();

    expect(screen.getByText('Pods')).toBeVisible();
    expect(screen.getByText('Pod Inventory')).toBeVisible();
    expect(screen.getByText('Images')).toBeVisible();
    expect(screen.getByText('Images: 2')).toBeVisible();
  });

  it('should not render BareMetalInventoryItems when NODE_MGMT_V1 flag is off', () => {
    useFlagMock.mockReturnValue(false);
    renderWithContext();

    expect(BareMetalInventoryItemsMock).not.toHaveBeenCalled();
  });

  it('should not render VirtualMachinesInventoryItems when NODE_MGMT_V1 flag is off', () => {
    useFlagMock.mockReturnValue(false);
    renderWithContext();

    expect(VirtualMachinesInventoryItemsMock).not.toHaveBeenCalled();
  });

  it('should render BareMetalInventoryItems when NODE_MGMT_V1 flag is on', () => {
    useFlagMock.mockReturnValue(true);
    renderWithContext();

    expect(BareMetalInventoryItemsMock).toHaveBeenCalled();
  });

  it('should render VirtualMachinesInventoryItems when NODE_MGMT_V1 flag is on', () => {
    useFlagMock.mockReturnValue(true);
    renderWithContext();

    expect(VirtualMachinesInventoryItemsMock).toHaveBeenCalled();
  });
});
