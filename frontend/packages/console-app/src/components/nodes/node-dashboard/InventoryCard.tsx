import type { FC } from 'react';
import { useMemo, useContext } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import BareMetalInventoryItems from '@console/app/src/components/nodes/node-dashboard/BareMetalInventoryItems';
import VirtualMachinesInventoryItems from '@console/app/src/components/nodes/node-dashboard/VirtualMachinesInventoryItems';
import { FLAG_NODE_MGMT_V1 } from '@console/app/src/consts';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { PodModel, NodeModel } from '@console/internal/models';
import type { K8sResourceCommon, K8sKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import type { StatusGroupMapper } from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import {
  InventoryItem,
  ResourceInventoryItem,
} from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { getPodStatusGroups } from '@console/shared/src/components/dashboard/inventory-card/utils';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { NodeDashboardContext } from './NodeDashboardContext';

const NodeInventoryItem: FC<NodeInventoryItemProps> = ({ nodeName, model, mapper }) => {
  const resource = useMemo(
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

const InventoryCard: FC = () => {
  const { obj } = useContext(NodeDashboardContext);
  const { t } = useTranslation();
  const nodeMgmtV1Enabled = useFlag(FLAG_NODE_MGMT_V1);

  return (
    <Card data-test-id="inventory-card">
      <CardHeader>
        <CardTitle>{t('console-app~Inventory')}</CardTitle>
      </CardHeader>
      <CardBody>
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('console-app~Pods')}</DescriptionListTerm>
            <DescriptionListDescription>
              <NodeInventoryItem
                nodeName={obj.metadata.name}
                model={PodModel}
                mapper={getPodStatusGroups}
              />
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('console-app~Images')}</DescriptionListTerm>
            <DescriptionListDescription>
              <InventoryItem
                isLoading={!obj}
                title={t('console-app~Image')}
                titlePlural={t('console-app~Images')}
                count={obj.status?.images?.length}
                error={!obj.status?.images}
              />
            </DescriptionListDescription>
          </DescriptionListGroup>
          {nodeMgmtV1Enabled && (
            <>
              <BareMetalInventoryItems />
              <VirtualMachinesInventoryItems />
            </>
          )}
        </DescriptionList>
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
