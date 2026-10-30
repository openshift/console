import type { ComponentType, FC } from 'react';
import { useMemo, useContext } from 'react';
import { Card, CardBody, CardHeader, CardTitle, Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { FLAG_OPENSHIFT_5 } from '@console/app/src/consts';
import { PrometheusEndpoint } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import type { NodeKind } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import type { NodeInventoryExtensionItem } from '@console/dynamic-plugin-sdk/src/extensions/node';
import { isNodeInventoryItem } from '@console/dynamic-plugin-sdk/src/extensions/node';
import { useFlag } from '@console/dynamic-plugin-sdk/src/utils/flags';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource';
import { usePrometheusPoll } from '@console/internal/components/graphs/prometheus-poll-hook';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { PodModel, NodeModel } from '@console/internal/models';
import type { PodKind } from '@console/internal/module/k8s/types';
import {
  InventoryItem,
  ResourceInventoryItem,
  StatusGroupInventoryItem,
} from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import {
  getNodePodInventoryQuery,
  getPodInventoryQuery,
  getPrometheusPodStatusGroups,
} from '@console/shared/src/components/dashboard/inventory-card/prometheus-utils';
import { PrometheusInventoryItem } from '@console/shared/src/components/dashboard/inventory-card/PrometheusInventoryItem';
import { getPodStatusGroups } from '@console/shared/src/components/dashboard/inventory-card/utils';
import { usePrometheusGate } from '@console/shared/src/hooks/usePrometheusGate';
import { getName } from '@console/shared/src/selectors/common';
import { WORKLOAD_PAGE_ID } from '../NodeWorkload';
import { NodeDashboardContext } from './NodeDashboardContext';

interface NodePodsProps {
  nodeName: string;
  basePath: string;
}

const WatchedNodePods: FC<NodePodsProps> = ({ nodeName, basePath }) => {
  const resource = useMemo(
    () =>
      nodeName
        ? {
            groupVersionKind: { version: 'v1', kind: 'Pod' },
            isList: true,
            fieldSelector: `spec.nodeName=${nodeName}`,
          }
        : null,
    [nodeName],
  );
  const [pods, loaded, error] = useK8sWatchResource<PodKind[]>(resource);
  return (
    <ResourceInventoryItem
      kind={PodModel}
      resources={pods || []}
      mapper={getPodStatusGroups}
      basePath={basePath}
      isLoading={!nodeName || !loaded}
      error={!!error}
    />
  );
};

const PrometheusNodePods: FC<NodePodsProps> = ({ nodeName, basePath }) => {
  const [response, error, loading] = usePrometheusPoll({
    endpoint: PrometheusEndpoint.QUERY,
    query: nodeName ? getNodePodInventoryQuery(nodeName) : '',
  });
  const [query, invalid] = useMemo(() => {
    if (!response || response.status !== 'success' || response.data?.resultType !== 'vector') {
      return ['', !!response] as const;
    }
    try {
      const uids = response.data.result.flatMap(({ metric }) => (metric.uid ? [metric.uid] : []));
      if (response.data.result.length === 0) return ['', true] as const;
      return [getPodInventoryQuery(undefined, nodeName, uids), false] as const;
    } catch {
      return ['', true] as const;
    }
  }, [response, nodeName]);
  if (!nodeName || loading || error || invalid || !query) {
    return (
      <StatusGroupInventoryItem
        kind={PodModel}
        groups={{}}
        basePath={basePath}
        isLoading={!nodeName || loading}
        error={!!error || invalid}
      />
    );
  }
  return (
    <PrometheusInventoryItem
      query={query}
      prometheusIsAvailable
      keepPreviousData
      basePath={basePath}
      mapper={getPrometheusPodStatusGroups}
      model={PodModel}
    />
  );
};

const NodePodInventoryItem: ComponentType<{ obj: NodeKind }> = ({ obj }) => {
  const nodeName = getName(obj);
  const isOpenShift5 = useFlag(FLAG_OPENSHIFT_5);
  const prometheusIsAvailable = usePrometheusGate();

  const basePath = isOpenShift5
    ? `${resourcePathFromModel(NodeModel, nodeName)}/${WORKLOAD_PAGE_ID}/pods`
    : `${resourcePathFromModel(NodeModel, nodeName)}/pods`;

  return (
    <StackItem>
      {prometheusIsAvailable === undefined ? (
        <StatusGroupInventoryItem
          kind={PodModel}
          groups={{}}
          basePath={basePath}
          isLoading
          error={false}
        />
      ) : prometheusIsAvailable ? (
        <PrometheusNodePods key={nodeName} nodeName={nodeName} basePath={basePath} />
      ) : (
        <WatchedNodePods nodeName={nodeName} basePath={basePath} />
      )}
    </StackItem>
  );
};

const NodeImagesInventoryItem: ComponentType<{ obj: NodeKind }> = ({ obj }) => {
  const { t } = useTranslation('console-app');

  return (
    <StackItem>
      <InventoryItem
        isLoading={!obj}
        title={t('Image')}
        titlePlural={t('Images')}
        count={obj.status?.images?.length}
        error={!obj.status?.images}
      />
    </StackItem>
  );
};

type InventoryItemType = {
  id: string;
  component: ComponentType<{ obj: NodeKind }>;
  priority: number;
};

const StandardInventoryItems: InventoryItemType[] = [
  {
    id: 'pods',
    component: NodePodInventoryItem,
    priority: 90,
  },
  {
    id: 'images',
    component: NodeImagesInventoryItem,
    priority: 70,
  },
];

const InventoryCard: FC = () => {
  const { obj } = useContext(NodeDashboardContext);
  const { t } = useTranslation('console-app');

  const [inventoryItemExtensions, inventoryItemExtensionsResolved] =
    useResolvedExtensions<NodeInventoryExtensionItem>(isNodeInventoryItem);

  const inventoryItems = useMemo(() => {
    if (!inventoryItemExtensionsResolved) {
      return StandardInventoryItems;
    }

    return [
      ...StandardInventoryItems,
      ...inventoryItemExtensions.map((ext, index) => ({
        ...ext.properties,
        id: ext.uid ?? `extension-${ext.properties.priority}-${index}`,
      })),
    ].sort((a, b) => b.priority - a.priority);
  }, [inventoryItemExtensions, inventoryItemExtensionsResolved]);

  return (
    <Card data-test-id="inventory-card">
      <CardHeader>
        <CardTitle>{t('Inventory')}</CardTitle>
      </CardHeader>
      <CardBody>
        <Stack hasGutter>
          {inventoryItems.map((inventoryItem) => (
            <inventoryItem.component key={inventoryItem.id} obj={obj} />
          ))}
        </Stack>
      </CardBody>
    </Card>
  );
};

export default InventoryCard;
