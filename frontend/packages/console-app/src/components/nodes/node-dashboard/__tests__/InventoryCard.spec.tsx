import { screen } from '@testing-library/react';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import type {
  NodeKind,
  PrometheusResponse,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { Extension, ResolvedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { useFlag } from '@console/dynamic-plugin-sdk/src/utils/flags';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource';
import { usePrometheusPoll } from '@console/internal/components/graphs/prometheus-poll-hook';
import type { PodKind } from '@console/internal/module/k8s/types';
import { usePrometheusGate } from '@console/shared/src/hooks/usePrometheusGate';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import InventoryCard from '../InventoryCard';
import { NodeDashboardContext } from '../NodeDashboardContext';

jest.mock('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions', () => ({
  useResolvedExtensions: jest.fn(),
}));
jest.mock('@console/dynamic-plugin-sdk/src/utils/flags', () => ({
  useFlag: jest.fn(() => false),
}));
jest.mock('@console/internal/components/graphs/prometheus-poll-hook', () => ({
  usePrometheusPoll: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/usePrometheusGate', () => ({
  usePrometheusGate: jest.fn(() => true),
}));
jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource', () => ({
  useK8sWatchResource: jest.fn(),
}));

const mockNode: NodeKind = {
  apiVersion: 'v1',
  kind: 'Node',
  metadata: { name: 'test-node', uid: 'node-uid' },
  spec: {},
  status: { images: [{ names: ['image1'] }, { names: ['image2'] }] },
};
const card = (obj = mockNode) => (
  <NodeDashboardContext.Provider
    value={{
      obj,
      setCPULimit: () => {},
      setMemoryLimit: () => {},
      setHealthCheck: () => {},
    }}
  >
    <InventoryCard />
  </NodeDashboardContext.Provider>
);
const renderCard = () => renderWithProviders(card());
const ExtensionInventoryItem = () => <span>Extension Inventory Item</span>;
const extension: ResolvedExtension<Extension> = {
  uid: 'test-inventory',
  pluginName: 'test-plugin',
  type: 'console.node/inventory-item',
  properties: { priority: 80, component: ExtensionInventoryItem },
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(usePrometheusGate).mockReturnValue(true);
  jest.mocked(useK8sWatchResource).mockReturnValue([[], true, undefined]);
  jest.mocked(useFlag).mockReturnValue(false);
  jest.mocked(useResolvedExtensions).mockReturnValue([[], true, []]);
  const counts: PrometheusResponse = {
    status: 'success',
    data: {
      resultType: 'vector',
      result: [{ metric: { status: 'Running' }, value: [0, '100'] }],
    },
  };
  jest.mocked(usePrometheusPoll).mockImplementation(({ query }) => [
    query.includes('group by (uid)')
      ? {
          status: 'success',
          data: {
            resultType: 'vector',
            result: [
              {
                metric: { namespace: 'example', pod: 'test-pod', uid: 'pod-uid' },
                value: [0, '1'],
              },
            ],
          },
        }
      : counts,
    undefined,
    false,
  ]);
});

it('renders pod and image counts', () => {
  renderCard();
  expect(screen.getByText('Inventory')).toBeVisible();
  expect(screen.getByRole('link', { name: '100 Pods' })).toBeVisible();
  expect(screen.getByText('2 Images')).toBeVisible();
});

it.each([
  [true, 1],
  [undefined, 0],
] as const)(
  'shows the pod label without a false zero while monitoring is %s and data is loading',
  (available, pollCount) => {
    jest.mocked(usePrometheusGate).mockReturnValue(available);
    jest.mocked(usePrometheusPoll).mockReturnValue([undefined, undefined, true]);
    renderCard();
    expect(screen.getByRole('link', { name: 'Pods' })).toBeVisible();
    expect(screen.queryByText('0 Pods')).not.toBeInTheDocument();
    expect(useK8sWatchResource).not.toHaveBeenCalled();
    expect(usePrometheusPoll).toHaveBeenCalledTimes(pollCount);
  },
);

it('shows unavailable on a monitoring error', () => {
  jest.mocked(usePrometheusPoll).mockReturnValue([undefined, new Error('Forbidden'), false]);
  renderCard();
  expect(screen.getByText('Not available')).toBeVisible();
  expect(screen.getByText('2 Images')).toBeVisible();
});

it('renders standard counts before extensions resolve', () => {
  jest.mocked(useResolvedExtensions).mockReturnValue([[], false, []]);
  renderCard();
  expect(screen.getByRole('link', { name: '100 Pods' })).toBeVisible();
});

it('renders plugin inventory items in priority order', () => {
  jest
    .mocked(useResolvedExtensions)
    .mockImplementation((predicate) => [predicate(extension) ? [extension] : [], true, []]);
  renderCard();
  const pods = screen.getByRole('link', { name: '100 Pods' });
  const plugin = screen.getByText('Extension Inventory Item');
  const images = screen.getByText('2 Images');
  expect(pods.compareDocumentPosition(plugin)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  expect(plugin.compareDocumentPosition(images)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
});

it('links to the legacy pod list', () => {
  renderCard();
  expect(screen.getByRole('link', { name: '100 Pods' })).toHaveAttribute(
    'href',
    '/k8s/cluster/nodes/test-node/pods',
  );
});

it('links to the workload pod list in OpenShift 5', () => {
  jest.mocked(useFlag).mockReturnValue(true);
  renderCard();
  expect(screen.getByRole('link', { name: '100 Pods' })).toHaveAttribute(
    'href',
    '/k8s/cluster/nodes/test-node/workload/pods',
  );
});

it('scopes the Prometheus query to this node and does not watch pods', () => {
  renderCard();
  expect(usePrometheusPoll).toHaveBeenCalledWith(
    expect.objectContaining({
      query: expect.stringContaining('node="test-node"'),
    }),
  );
  expect(usePrometheusPoll).toHaveBeenCalledWith(
    expect.objectContaining({
      query: expect.stringContaining('uid=~"pod-uid"'),
    }),
  );
  expect(useK8sWatchResource).not.toHaveBeenCalled();
});

it('uses a node-scoped pod watch when monitoring is disabled', () => {
  jest.mocked(usePrometheusGate).mockReturnValue(false);
  const pods: PodKind[] = [
    { metadata: { name: 'pod' }, spec: { containers: [] }, status: { phase: 'Running' } },
  ];
  jest.mocked(useK8sWatchResource).mockReturnValue([pods, true, undefined]);
  renderCard();
  expect(screen.getByRole('link', { name: '1 Pod' })).toBeVisible();
  expect(usePrometheusPoll).not.toHaveBeenCalled();
  expect(useK8sWatchResource).toHaveBeenCalledWith(
    expect.objectContaining({
      fieldSelector: 'spec.nodeName=test-node',
    }),
  );
});

it('keeps the last count during pod churn but clears it when navigating to another node', () => {
  let refreshing = false;
  const counts: PrometheusResponse = {
    status: 'success',
    data: { resultType: 'vector', result: [{ metric: { status: 'Running' }, value: [0, '100'] }] },
  };
  jest.mocked(usePrometheusPoll).mockImplementation(({ query }) => {
    if (query.includes('group by (uid)')) {
      return [
        {
          status: 'success',
          data: {
            resultType: 'vector',
            result: [{ metric: { uid: refreshing ? 'new-uid' : 'old-uid' }, value: [0, '1'] }],
          },
        },
        undefined,
        false,
      ];
    }
    return refreshing ? [undefined, undefined, true] : [counts, undefined, false];
  });
  const { rerender } = renderCard();
  expect(screen.getByRole('link', { name: '100 Pods' })).toBeVisible();
  refreshing = true;
  rerender(card());
  expect(screen.getByRole('link', { name: '100 Pods' })).toBeVisible();
  expect(usePrometheusPoll).toHaveBeenCalledWith(
    expect.objectContaining({ query: expect.stringContaining('uid=~"new-uid"') }),
  );
  rerender(card({ ...mockNode, metadata: { name: 'other-node' } }));
  expect(screen.queryByRole('link', { name: '100 Pods' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Pods' })).toBeVisible();
});
