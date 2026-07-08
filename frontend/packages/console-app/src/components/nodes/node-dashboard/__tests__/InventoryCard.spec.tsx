import { useResolvedExtensions } from '@openshift/dynamic-plugin-sdk';
import { render, screen } from '@testing-library/react';
import { useFlag } from '@console/dynamic-plugin-sdk/src/utils/flags';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import type { NodeKind } from '@console/internal/module/k8s';
import InventoryCard from '../InventoryCard';
import { NodeDashboardContext } from '../NodeDashboardContext';

jest.mock('@openshift/dynamic-plugin-sdk', () => ({
  ...jest.requireActual('@openshift/dynamic-plugin-sdk'),
  useResolvedExtensions: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/utils/flags', () => ({
  useFlag: jest.fn(() => false),
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

const mockResourceInventoryItem = jest.fn();

jest.mock('@console/shared/src/components/dashboard/inventory-card/InventoryItem', () => ({
  InventoryItem: ({ title, count }: { title: string; count?: number }) => (
    <div data-test-inventory-item={`${title}:${count ?? 0}`}>{`${title}: ${count ?? 0}`}</div>
  ),
  ResourceInventoryItem: (props: { basePath: string }) => {
    mockResourceInventoryItem(props);
    return <div data-test-inventory-item="pods">Pod Inventory</div>;
  },
}));

const MockExtensionInventoryItem = jest.fn(() => (
  <div data-test-inventory-item="extension">Extension Inventory Item</div>
));

const useResolvedExtensionsMock = useResolvedExtensions as jest.Mock;
const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;
const useFlagMock = useFlag as jest.Mock;

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
    useFlagMock.mockReturnValue(false);
    useResolvedExtensionsMock.mockReturnValue([[], true]);
    useK8sWatchResourceMock.mockReturnValue([[], true, undefined]);
  });

  it('should render the inventory card with title', () => {
    renderWithContext();

    expect(screen.getByText('Inventory')).toBeVisible();
  });

  it('should render Pod and Image inventory items', () => {
    renderWithContext();

    expect(screen.getByText('Pod Inventory')).toBeVisible();
    expect(screen.getByText('Image: 2')).toBeVisible();
  });

  it('should watch pods for the current node', () => {
    renderWithContext();

    expect(useK8sWatchResourceMock).toHaveBeenCalledWith({
      isList: true,
      kind: 'Pod',
      fieldSelector: 'spec.nodeName=test-node',
    });
  });

  it('should show loading state for pods when pods are not loaded', () => {
    useK8sWatchResourceMock.mockReturnValue([[], false, undefined]);

    renderWithContext();

    expect(screen.getByText('Pod: 0')).toBeVisible();
    expect(screen.queryByText('Pod Inventory')).not.toBeInTheDocument();
  });

  it('should render standard inventory items when extensions are not resolved', () => {
    useResolvedExtensionsMock.mockReturnValue([[], false]);

    renderWithContext();

    expect(screen.getByText('Pod Inventory')).toBeVisible();
    expect(screen.getByText('Image: 2')).toBeVisible();
    expect(screen.queryByText('Extension Inventory Item')).not.toBeInTheDocument();
  });

  it('should render extension inventory items when extensions are resolved', () => {
    useResolvedExtensionsMock.mockReturnValue([
      [
        {
          uid: 'extension-1',
          type: 'console.node/inventory-item',
          properties: {
            priority: 80,
            component: MockExtensionInventoryItem,
          },
        },
      ],
      true,
    ]);

    renderWithContext();

    expect(MockExtensionInventoryItem).toHaveBeenCalled();
    expect(screen.getByText('Extension Inventory Item')).toBeVisible();
  });

  it('should use legacy pods path when FLAG_NODE_MGMT_V1 is disabled', () => {
    useFlagMock.mockReturnValue(false);

    renderWithContext();

    expect(mockResourceInventoryItem).toHaveBeenCalledWith(
      expect.objectContaining({
        basePath: '/k8s/cluster/nodes/test-node/pods',
      }),
    );
  });

  it('should use workload pods path when FLAG_NODE_MGMT_V1 is enabled', () => {
    useFlagMock.mockReturnValue(true);

    renderWithContext();

    expect(mockResourceInventoryItem).toHaveBeenCalledWith(
      expect.objectContaining({
        basePath: '/k8s/cluster/nodes/test-node/workload/pods',
      }),
    );
  });

  it('should sort inventory items by priority from highest to lowest', () => {
    useResolvedExtensionsMock.mockReturnValue([
      [
        {
          uid: 'extension-1',
          type: 'console.node/inventory-item',
          properties: {
            priority: 80,
            component: MockExtensionInventoryItem,
          },
        },
      ],
      true,
    ]);

    renderWithContext();

    const podInventory = screen.getByText('Pod Inventory');
    const extensionInventory = screen.getByText('Extension Inventory Item');
    const imageInventory = screen.getByText('Image: 2');

    expect(podInventory.compareDocumentPosition(extensionInventory)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(extensionInventory.compareDocumentPosition(imageInventory)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
});
