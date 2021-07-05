import * as React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardCard from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCardTitle';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { FirehoseResource } from '@console/internal/components/utils';
import {
  getNodeStatusGroups,
  getPVCStatusGroups,
  getPVStatusGroups,
} from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/inventory-card/utils';
import { K8sResourceKind, StorageClassResourceKind } from '@console/internal/module/k8s';
import {
  NodeModel,
  PersistentVolumeClaimModel,
  PersistentVolumeModel,
  StorageClassModel,
} from '@console/internal/models';
import { ResourceInventoryItem } from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/inventory-card/InventoryItem';
import { getName } from '@console/dynamic-plugin-sdk/src/shared/selectors';
import {
  getCephNodes,
  getCephPVs,
  getCephPVCs,
  getCephSC,
  cephStorageLabel,
} from '../../../selectors';

const k8sResources: FirehoseResource[] = [
  {
    isList: true,
    kind: PersistentVolumeModel.kind,
    prop: 'pvs',
  },
  {
    isList: true,
    kind: NodeModel.kind,
    prop: 'nodes',
  },
  {
    isList: true,
    kind: PersistentVolumeClaimModel.kind,
    prop: 'pvcs',
  },
  {
    isList: true,
    kind: StorageClassModel.kind,
    prop: 'sc',
  },
];

const InventoryCard: React.FC<DashboardItemProps> = ({
  watchK8sResource,
  stopWatchK8sResource,
  resources,
}) => {
  const { t } = useTranslation();

  React.useEffect(() => {
    k8sResources.forEach((r) => watchK8sResource(r));
    return () => {
      k8sResources.forEach((r) => stopWatchK8sResource(r));
    };
  }, [watchK8sResource, stopWatchK8sResource]);

  const nodesLoaded = resources?.nodes?.loaded;
  const nodesLoadError = resources?.nodes?.loadError;
  const nodesData = (resources?.nodes?.data ?? []) as K8sResourceKind[];

  const pvcsLoaded = resources?.pvcs?.loaded;
  const pvcsLoadError = resources?.pvcs?.loadError;
  const pvcsData = (resources?.pvcs?.data ?? []) as K8sResourceKind[];

  const pvsLoaded = resources?.pvs?.loaded;
  const pvsLoadError = resources?.pvs?.loadError;
  const pvsData = (resources?.pvs?.data ?? []) as K8sResourceKind[];

  const scData = (resources?.sc?.data ?? []) as StorageClassResourceKind[];
  const filteredCephSC = getCephSC(scData);
  const filteredSCNames = filteredCephSC.map(getName);
  const ocsNodesHref = `/search?kind=${NodeModel.kind}&q=${cephStorageLabel}`;

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>{t('ceph-storage-plugin~Inventory')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <ResourceInventoryItem
          dataTest="inventory-nodes"
          isLoading={!nodesLoaded}
          error={!!nodesLoadError}
          kind={NodeModel}
          resources={getCephNodes(nodesData)}
          mapper={getNodeStatusGroups}
          basePath={ocsNodesHref}
        />
        <ResourceInventoryItem
          dataTest="inventory-pvc"
          isLoading={!pvcsLoaded}
          error={!!pvcsLoadError}
          kind={PersistentVolumeClaimModel}
          resources={getCephPVCs(filteredSCNames, pvcsData, pvsData)}
          mapper={getPVCStatusGroups}
          showLink={false}
        />
        <ResourceInventoryItem
          dataTest="inventory-pv"
          isLoading={!pvsLoaded}
          error={!!pvsLoadError}
          kind={PersistentVolumeModel}
          resources={getCephPVs(pvsData)}
          mapper={getPVStatusGroups}
          showLink={false}
        />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(InventoryCard);
