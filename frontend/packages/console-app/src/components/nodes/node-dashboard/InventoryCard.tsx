import type { ComponentType, FC } from 'react';
import { useMemo, useContext } from 'react';
import { Card, CardBody, CardHeader, CardTitle, Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { FLAG_NODE_MGMT_V1 } from '@console/app/src/consts';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk/src/api/useResolvedExtensions';
import type { NodeInventoryExtensionItem } from '@console/dynamic-plugin-sdk/src/extensions/node';
import { isNodeInventoryItem } from '@console/dynamic-plugin-sdk/src/extensions/node';
import { useFlag } from '@console/dynamic-plugin-sdk/src/utils/flags';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { PodModel, NodeModel } from '@console/internal/models';
import type { NodeKind, PodKind } from '@console/internal/module/k8s';
import {
  InventoryItem,
  ResourceInventoryItem,
} from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { getPodStatusGroups } from '@console/shared/src/components/dashboard/inventory-card/utils';
import { getName } from '@console/shared/src/selectors/common';
import { WORKLOAD_PAGE_ID } from '../NodeWorkload';
import { NodeDashboardContext } from './NodeDashboardContext';

const NodePodInventoryItem: ComponentType<{ obj: NodeKind }> = ({ obj }) => {
  const nodeName = getName(obj);
  const nodeMgmtV1Enabled = useFlag(FLAG_NODE_MGMT_V1);

  const podResource = useMemo(
    () =>
      nodeName
        ? {
            isList: true,
            kind: PodModel.kind,
            fieldSelector: `spec.nodeName=${nodeName}`,
          }
        : null,
    [nodeName],
  );

  const [pods, podsLoaded, podsError] = useK8sWatchResource<PodKind[]>(podResource);

  if (!nodeName || !podsLoaded) {
    return <InventoryItem title={PodModel.label} count={0} isLoading={!podsLoaded} />;
  }

  const basePath = nodeMgmtV1Enabled
    ? `${resourcePathFromModel(NodeModel, nodeName)}/${WORKLOAD_PAGE_ID}/pods`
    : `${resourcePathFromModel(NodeModel, nodeName)}/pods`;

  return (
    <StackItem>
      <ResourceInventoryItem
        resources={pods}
        basePath={basePath}
        mapper={getPodStatusGroups}
        kind={PodModel}
        isLoading={!podsLoaded}
        error={!!podsError}
      />
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

  const [inventoryItemExtensions, inventoryItemExtensionsResolved] = useResolvedExtensions<
    NodeInventoryExtensionItem
  >(isNodeInventoryItem);

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
