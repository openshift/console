import { screen } from '@testing-library/react';
import { NamespaceContext } from '@console/app/src/providers/detect-context/namespace';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import type { Extension, ResolvedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { usePrometheusPoll } from '@console/internal/components/graphs/prometheus-poll-hook';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { PodModel, VolumeSnapshotModel } from '@console/internal/models';
import { getPrometheusInventoryCount } from '@console/shared/src/components/dashboard/inventory-card/prometheus-utils';
import { useDynamicK8sWatchResources } from '@console/shared/src/hooks/useDynamicK8sWatchResources';
import { usePrometheusGate } from '@console/shared/src/hooks/usePrometheusGate';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { InventoryCard } from '../inventory-card';
import { ProjectDashboardContext } from '../project-dashboard-context';

jest.mock('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions', () => ({
  useResolvedExtensions: jest.fn(),
}));
jest.mock('@console/internal/components/graphs/prometheus-poll-hook', () => ({
  usePrometheusPoll: jest.fn(),
}));
jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
}));
jest.mock('@console/shared/src/hooks/useDynamicK8sWatchResources', () => ({
  useDynamicK8sWatchResources: jest.fn(),
}));
jest.mock('@console/shared/src/hooks/usePrometheusGate', () => ({ usePrometheusGate: jest.fn() }));

const legacy: ResolvedExtension<Extension> = {
  type: 'console.dashboards/project/overview/item',
  pluginName: 'console-app',
  uid: 'legacy',
  properties: { model: PodModel },
};
const prometheus = {
  ...legacy,
  uid: 'prometheus',
  properties: {
    model: PodModel,
    prometheus: {
      getQuery: (namespace: string) => `pod_inventory{namespace="${namespace}"}`,
      mapper: getPrometheusInventoryCount,
    },
  },
};
const snapshot: ResolvedExtension<Extension> = {
  ...legacy,
  uid: 'snapshot',
  properties: { model: VolumeSnapshotModel },
};
const host: ResolvedExtension<Extension> = {
  ...legacy,
  pluginName: 'metal3',
  uid: 'host',
  properties: {
    model: {
      ...PodModel,
      kind: 'Host',
      plural: 'hosts',
      label: 'Host',
      labelPlural: 'Hosts',
      labelKey: undefined,
      labelPluralKey: undefined,
    },
  },
};
const watchResource = jest.fn();
let extensions: ResolvedExtension<Extension>[];
const card = (projectName = 'rendered-project') => (
  <NamespaceContext.Provider value={{ namespace: 'unrelated-global-project' }}>
    <ProjectDashboardContext.Provider
      value={{ obj: { apiVersion: 'v1', kind: 'Project', metadata: { name: projectName } } }}
    >
      <InventoryCard />
    </ProjectDashboardContext.Provider>
  </NamespaceContext.Provider>
);
beforeEach(() => {
  jest.clearAllMocks();
  extensions = [prometheus, snapshot, host];
  jest
    .mocked(useResolvedExtensions)
    .mockImplementation((predicate) => [extensions.filter(predicate), true, []]);
  jest.mocked(usePrometheusGate).mockReturnValue(true);
  jest.mocked(useK8sWatchResources).mockReturnValue({});
  jest.mocked(useDynamicK8sWatchResources).mockReturnValue({
    watchResource,
    stopWatchResource: jest.fn(),
    results: {
      resource: {
        data: [{ metadata: { name: 'one' } }, { metadata: { name: 'two' } }],
        loaded: true,
        loadError: undefined,
      },
    },
  });
  jest.mocked(usePrometheusPoll).mockReturnValue([
    {
      status: 'success',
      data: { resultType: 'vector', result: [{ metric: {}, value: [0, '5'] }] },
    },
    undefined,
    false,
  ]);
});
it('keeps the snapshot watch in its original position before plugin tiles', () => {
  renderWithProviders(card());
  const links = screen.getAllByRole('link');
  expect(links[0]).toHaveTextContent('5 Pods');
  expect(links[1].getAttribute('href')).toContain('snapshot.storage.k8s.io~v1~VolumeSnapshot');
  expect(links[2]).toHaveTextContent('2 Hosts');
});
it('does not start a Pod watch while monitoring is available', () => {
  renderWithProviders(card());
  expect(watchResource).toHaveBeenCalledTimes(2);
  expect(usePrometheusPoll).toHaveBeenCalledWith(
    expect.objectContaining({
      query: 'pod_inventory{namespace="rendered-project"}',
      namespace: 'rendered-project',
    }),
  );
  expect(watchResource).not.toHaveBeenCalledWith(
    'resource',
    expect.objectContaining({ kind: 'Pod' }),
  );
});
it('restores project-scoped resource counts when monitoring is disabled', () => {
  jest.mocked(usePrometheusGate).mockReturnValue(false);
  renderWithProviders(card());
  expect(screen.getByRole('link', { name: '2 Pods' })).toBeVisible();
  expect(usePrometheusPoll).not.toHaveBeenCalled();
  expect(watchResource).toHaveBeenCalledWith(
    'resource',
    expect.objectContaining({ kind: 'Pod', namespace: 'rendered-project' }),
  );
});
it('preserves custom component inventory contributions', () => {
  const CustomInventory = () => <span>Custom inventory</span>;
  extensions.push({
    ...legacy,
    uid: 'custom',
    type: 'console.project-overview/inventory-item',
    properties: { component: CustomInventory },
  });
  renderWithProviders(card());
  expect(screen.getByText('Custom inventory')).toBeVisible();
});

it('shows a loading placeholder while inventory code references resolve', () => {
  jest.mocked(useResolvedExtensions).mockReturnValue([[], false, []]);
  renderWithProviders(card());
  expect(screen.getByText('Loading')).toBeInTheDocument();
  expect(watchResource).not.toHaveBeenCalled();
});
it('contains a throwing project query builder while preserving snapshot counts', () => {
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
    snapshot,
  ];
  renderWithProviders(card());
  expect(screen.getByText('Not available')).toBeVisible();
  expect(screen.getByRole('link', { name: '2 VolumeSnapshots' })).toBeVisible();
});

it('does not start a project watch when the Prometheus query fails', () => {
  extensions = [prometheus];
  jest.mocked(usePrometheusPoll).mockReturnValue([undefined, new Error('Forbidden'), false]);
  renderWithProviders(card());
  expect(screen.getByText('Not available')).toBeVisible();
  expect(watchResource).not.toHaveBeenCalled();
  expect(useK8sWatchResources).not.toHaveBeenCalled();
});
it('waits for monitoring detection without starting a project watch', () => {
  extensions = [prometheus];
  jest.mocked(usePrometheusGate).mockReturnValue(undefined);
  jest.mocked(usePrometheusPoll).mockReturnValue([undefined, undefined, false]);
  renderWithProviders(card());
  expect(screen.getByRole('link', { name: 'Pods' })).toBeVisible();
  expect(screen.queryByText('Not available')).not.toBeInTheDocument();
  expect(usePrometheusPoll).toHaveBeenCalledWith(expect.objectContaining({ query: '' }));
  expect(watchResource).not.toHaveBeenCalled();
});
