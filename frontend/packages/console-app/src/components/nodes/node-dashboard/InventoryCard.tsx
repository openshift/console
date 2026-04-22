import type { FC } from 'react';
import { useMemo, useContext } from 'react';
import { useResolvedExtensions } from '@openshift/dynamic-plugin-sdk';
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
import { Link } from 'react-router';
import BareMetalInventoryItems from '@console/app/src/components/nodes/node-dashboard/BareMetalInventoryItems';
import { WORKLOADS_PAGE_ID } from '@console/app/src/components/nodes/NodeSubNavPage';
import { useIsKubevirtPluginActive } from '@console/app/src/utils/kubevirt';
import type { NodeSubNavTab } from '@console/dynamic-plugin-sdk/src';
import { isNodeSubNavTab } from '@console/dynamic-plugin-sdk/src';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { PodModel, NodeModel } from '@console/internal/models';
import type { K8sResourceCommon, K8sKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { useTranslatedExtensions } from '@console/plugin-sdk/src/utils/useTranslatedExtensions';
import type { StatusGroupMapper } from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import {
  InventoryItem,
  ResourceInventoryItem,
} from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { getPodStatusGroups } from '@console/shared/src/components/dashboard/inventory-card/utils';
import { DescriptionListTermHelp } from '@console/shared/src/components/description-list/DescriptionListTermHelp';
import { useWatchVirtualMachineInstances, VirtualMachineModel } from '../utils/NodeVmUtils';
import { NodeDashboardContext } from './NodeDashboardContext';

const NODE_VIRTUAL_MACHINES_PAGE_ID = 'virtualmachines';

export const NodeInventoryItem: FC<NodeInventoryItemProps> = ({ nodeName, model, mapper }) => {
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

  const showVms = useIsKubevirtPluginActive();
  const [vms, vmsLoaded, vmsLoadError] = useWatchVirtualMachineInstances(obj.metadata.name);

  const [subTabExtensions, extensionsResolved] = useResolvedExtensions<NodeSubNavTab>(
    isNodeSubNavTab,
  );
  const nodeSubTabExtensions = useTranslatedExtensions(subTabExtensions ?? []);

  const vmsLink = useMemo(() => {
    if (extensionsResolved) {
      const workloadExtensions = nodeSubTabExtensions.filter(
        (ext) => ext.properties.parentTab === WORKLOADS_PAGE_ID,
      );
      if (
        workloadExtensions.find(
          (ext) => ext.properties.page.tabId === NODE_VIRTUAL_MACHINES_PAGE_ID,
        )
      ) {
        return `${resourcePathFromModel(NodeModel)}/${
          obj.metadata.name
        }/${WORKLOADS_PAGE_ID}?activeTab${NODE_VIRTUAL_MACHINES_PAGE_ID}`;
      }
    }
    return `${resourcePathFromModel(VirtualMachineModel)}/search?rowFilter-node=${
      obj.metadata.name
    }`;
  }, [extensionsResolved, nodeSubTabExtensions, obj.metadata.name]);

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
          <BareMetalInventoryItems />
          {showVms ? (
            <DescriptionListGroup>
              <DescriptionListTermHelp
                text={t('console-app~Virtual machines')}
                textHelp={t(
                  'console-app~This count reflects your access permissions and might not include all virtual machines.',
                )}
              />
              <DescriptionListDescription>
                <Link to={vmsLink}>
                  <InventoryItem
                    isLoading={!vmsLoaded}
                    title={t('console-app~Virtual machine')}
                    titlePlural={t('console-app~Virtual machines')}
                    count={vms.length}
                    error={!!vmsLoadError}
                  />
                </Link>
              </DescriptionListDescription>
            </DescriptionListGroup>
          ) : null}
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
