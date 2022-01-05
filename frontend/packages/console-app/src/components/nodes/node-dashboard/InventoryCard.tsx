import * as React from 'react';
import { Card, CardBody, CardHeader, CardTitle, Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { PodModel, NodeModel } from '@console/internal/models';
import { referenceForModel, K8sResourceCommon, K8sKind } from '@console/internal/module/k8s';
import InventoryItem, {
  ResourceInventoryItem,
  StatusGroupMapper,
} from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { getPodStatusGroups } from '@console/shared/src/components/dashboard/inventory-card/utils';
import { NodeDashboardContext } from './NodeDashboardContext';

export const NodeInventoryItem: React.FC<NodeInventoryItemProps> = ({
  nodeName,
  model,
  mapper,
}) => {
  const resource = React.useMemo(
    () => ({
      kind: model.crd ? referenceForModel(model) : model.kind,
      fieldSelector: `spec.nodeName=${nodeName}`,
      isList: true,
    }),
    [nodeName, model],
  );
  const [data, loaded, loadError] = useK8sWatchResource<K8sResourceCommon[]>(resource);
  const basePath = `${resourcePathFromModel(NodeModel, nodeName)}/pods`;

  return (
    <ResourceInventoryItem
      kind={model}
      isLoading={!loaded}
      error={!!loadError}
      resources={data}
      mapper={mapper}
      basePath={basePath}
    />
  );
};

const InventoryCard: React.FC = () => {
  const { obj } = React.useContext(NodeDashboardContext);
  const { t } = useTranslation();

  return (
    <Card data-test-id="inventory-card">
      <CardHeader>
        <CardTitle>{t('console-app~Inventory')}</CardTitle>
      </CardHeader>
      <CardBody>
        <Stack hasGutter>
          <StackItem>
            <NodeInventoryItem
              nodeName={obj.metadata.name}
              model={PodModel}
              mapper={getPodStatusGroups}
            />
          </StackItem>
          <StackItem>
            <InventoryItem
              isLoading={!obj}
              title={t('console-app~Image')}
              titlePlural={t('console-app~Images')}
              count={obj.status?.images?.length}
              error={!obj.status?.images}
            />
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};

type NodeInventoryItemProps = {
  nodeName: string;
  model: K8sKind;
  mapper?: StatusGroupMapper;
};

export default InventoryCard;
