import { screen } from '@testing-library/react';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import type { Extension, ResolvedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { usePrometheusPoll } from '@console/internal/components/graphs/prometheus-poll-hook';
import {
  useK8sWatchResource,
  useK8sWatchResources,
} from '@console/internal/components/utils/k8s-watch-hook';
import { NodeModel } from '@console/internal/models';
import { getPrometheusInventoryCount } from '@console/shared/src/components/dashboard/inventory-card/prometheus-utils';
import { usePrometheusGate } from '@console/shared/src/hooks/usePrometheusGate';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { InventoryCard } from '../inventory-card';

jest.mock('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions', () => ({
  useResolvedExtensions: jest.fn(),
}));
jest.mock('@console/internal/components/graphs/prometheus-poll-hook', () => ({
  usePrometheusPoll: jest.fn(),
}));
jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
  useK8sWatchResources: jest.fn(),
}));
jest.mock('@console/shared/src/hooks/usePrometheusGate', () => ({ usePrometheusGate: jest.fn() }));

const legacy: ResolvedExtension<Extension> = {
  type: 'console.dashboards/overview/inventory/item',
  pluginName: 'console-app',
  uid: 'legacy-node',
  properties: { model: NodeModel },
};
const prometheus = {
  ...legacy,
  uid: 'prometheus-node',
  properties: {
    model: NodeModel,
    prometheus: {
      getQuery: () => 'node_inventory',
      mapper: getPrometheusInventoryCount,
    },
  },
};
const host: ResolvedExtension<Extension> = {
  ...legacy,
  pluginName: 'metal3',
  uid: 'host',
  properties: {
    model: {
      ...NodeModel,
      kind: 'BareMetalHost',
      labelKey: undefined,
      labelPluralKey: undefined,
      plural: 'hosts',
      label: 'Host',
      labelPlural: 'Hosts',
    },
  },
};
let extensions: ResolvedExtension<Extension>[];
beforeEach(() => {
  jest.clearAllMocks();
  extensions = [prometheus, host];
  jest
    .mocked(useResolvedExtensions)
    .mockImplementation((predicate) => [extensions.filter(predicate), true, []]);
  jest.mocked(usePrometheusGate).mockReturnValue(true);
  jest
    .mocked(useK8sWatchResource)
    .mockReturnValue([
      [
        { metadata: { name: 'one' } },
        { metadata: { name: 'two' } },
        { metadata: { name: 'three' } },
      ],
      true,
      undefined,
    ]);
  jest.mocked(useK8sWatchResources).mockReturnValue({});
  jest.mocked(usePrometheusPoll).mockReturnValue([
    {
      status: 'success',
      data: { resultType: 'vector', result: [{ metric: {}, value: [0, '5'] }] },
    },
    undefined,
    false,
  ]);
});
it('keeps the built-in Node tile ahead of a resource-backed baremetal contribution', () => {
  renderWithProviders(<InventoryCard />);
  const links = screen.getAllByRole('link');
  expect(links[0]).toHaveTextContent('5 Nodes');
  expect(links[1]).toHaveTextContent('3 Hosts');
});
it('does not mount the built-in resource watch while monitoring is enabled', () => {
  renderWithProviders(<InventoryCard />);
  expect(useK8sWatchResource).toHaveBeenCalledTimes(1);
  expect(useK8sWatchResource).toHaveBeenCalledWith(
    expect.objectContaining({ kind: 'BareMetalHost' }),
  );
});
it('restores Kubernetes counts without polling when monitoring is disabled', () => {
  jest.mocked(usePrometheusGate).mockReturnValue(false);
  renderWithProviders(<InventoryCard />);
  expect(screen.getByRole('link', { name: '3 Nodes' })).toBeVisible();
  expect(usePrometheusPoll).not.toHaveBeenCalled();
  expect(useK8sWatchResource).toHaveBeenCalledTimes(2);
});
it('preserves existing replacement precedence for a built-in Prometheus tile', () => {
  extensions.push({
    ...legacy,
    type: 'console.dashboards/overview/inventory/item/replacement',
    uid: 'replacement',
  });
  renderWithProviders(<InventoryCard />);
  expect(screen.getByRole('link', { name: '3 Nodes' })).toBeVisible();
  expect(usePrometheusPoll).not.toHaveBeenCalled();
});
it('contains an invalid plugin mapper while preserving neighboring tiles', () => {
  extensions = [
    {
      ...prometheus,
      properties: {
        ...prometheus.properties,
        prometheus: {
          ...prometheus.properties.prometheus,
          mapper: () => ({ ERROR: { count: 2, filterType: 'status' } }),
        },
      },
    },
    host,
  ];
  renderWithProviders(<InventoryCard />);
  expect(screen.getByText('Not available')).toBeVisible();
  expect(screen.getByRole('link', { name: '3 Hosts' })).toBeVisible();
});

it('contains a throwing query builder while preserving neighboring tiles', () => {
  extensions = [
    {
      ...prometheus,
      properties: {
        ...prometheus.properties,
        prometheus: {
          ...prometheus.properties.prometheus,
          getQuery: () => {
            throw new Error('bad input');
          },
        },
      },
    },
    host,
  ];
  renderWithProviders(<InventoryCard />);
  expect(screen.getByText('Not available')).toBeVisible();
  expect(screen.getByRole('link', { name: '3 Hosts' })).toBeVisible();
});

it('does not start a watch when a configured Prometheus query fails', () => {
  extensions = [prometheus];
  jest.mocked(usePrometheusPoll).mockReturnValue([undefined, new Error('Forbidden'), false]);
  renderWithProviders(<InventoryCard />);
  expect(screen.getByText('Not available')).toBeVisible();
  expect(useK8sWatchResource).not.toHaveBeenCalled();
  expect(useK8sWatchResources).not.toHaveBeenCalled();
});
it('waits for monitoring detection without starting watches or queries', () => {
  extensions = [prometheus];
  jest.mocked(usePrometheusGate).mockReturnValue(undefined);
  jest.mocked(usePrometheusPoll).mockReturnValue([undefined, undefined, false]);
  renderWithProviders(<InventoryCard />);
  expect(screen.getByRole('link', { name: 'Nodes' })).toBeVisible();
  expect(screen.queryByText('Not available')).not.toBeInTheDocument();
  expect(usePrometheusPoll).toHaveBeenCalledWith(expect.objectContaining({ query: '' }));
  expect(useK8sWatchResource).not.toHaveBeenCalled();
});
