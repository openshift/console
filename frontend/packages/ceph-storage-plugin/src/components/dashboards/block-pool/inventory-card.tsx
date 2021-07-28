import * as React from 'react';
import { useTranslation } from 'react-i18next';

import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { PersistentVolumeClaimKind } from '@console/internal/module/k8s';
import { useDeepCompareMemoize } from '@console/shared';
import { getPVCStatusGroups } from '@console/shared/src/components/dashboard/inventory-card/utils';
import { ResourceInventoryItem } from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { StorageClassModel, PersistentVolumeClaimModel } from '@console/internal/models';

import { BlockPoolDashboardContext } from './block-pool-dashboard-context';
import { OcsStorageClassKind } from '../../../types';
import { scResource, pvcResource } from '../../../resources';
import { getStorageClassName } from '../../../selectors';

export const InventoryCard: React.FC = () => {
  const { t } = useTranslation();
  const { obj } = React.useContext(BlockPoolDashboardContext);
  const { name } = obj.metadata;

  // Hooks
  const [scResources, scLoaded, scLoadError] = useK8sWatchResource<OcsStorageClassKind[]>(
    scResource,
  );
  const [pvcResources, pvcLoaded, pvcLoadError] = useK8sWatchResource<PersistentVolumeClaimKind[]>(
    pvcResource,
  );
  const scMemoized: OcsStorageClassKind[] = useDeepCompareMemoize(scResources, true);
  const pvcMemoized: PersistentVolumeClaimKind[] = useDeepCompareMemoize(pvcResources, true);

  const poolSc: OcsStorageClassKind[] = React.useMemo(
    () => (scMemoized ? scMemoized.filter((sc) => sc.parameters?.pool === name) : []),
    [scMemoized, name],
  );
  const pvcs: PersistentVolumeClaimKind[] = React.useMemo(() => {
    const scList = poolSc.map((sc) => sc?.metadata.name);
    return pvcMemoized.filter((pvc) => scList.includes(getStorageClassName(pvc)));
  }, [poolSc, pvcMemoized]);

  return (
    <DashboardCard data-test-id="inventory-card">
      <DashboardCardHeader>
        <DashboardCardTitle>{t('ceph-storage-plugin~Inventory')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <ResourceInventoryItem
          dataTest="inventory-sc"
          isLoading={!scLoaded}
          error={!!scLoadError}
          kind={StorageClassModel}
          resources={poolSc}
          showLink
        />
        <ResourceInventoryItem
          dataTest="inventory-pvc"
          isLoading={!pvcLoaded}
          error={!!pvcLoadError}
          kind={PersistentVolumeClaimModel}
          resources={pvcs}
          mapper={getPVCStatusGroups}
          showLink
        />
      </DashboardCardBody>
    </DashboardCard>
  );
};
