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
  const [storageClasses, setStorageClasses] = React.useState<OcsStorageClassKind[]>([]);
  const [pvcs, setPvcs] = React.useState<PersistentVolumeClaimKind[]>([]);
  const [scResources, scLoaded, scLoadError] = useK8sWatchResource<OcsStorageClassKind[]>(
    scResource,
  );
  const [pvcResources, pvcLoaded, pvcLoadError] = useK8sWatchResource<PersistentVolumeClaimKind[]>(
    pvcResource,
  );
  const filteredScResources: OcsStorageClassKind[] = useDeepCompareMemoize(scResources, true);
  const filteredPvcResources: PersistentVolumeClaimKind[] = useDeepCompareMemoize(
    pvcResources,
    true,
  );

  React.useEffect(() => {
    if (filteredScResources && scLoaded && !scLoadError) {
      setStorageClasses(filteredScResources.filter((sc) => sc.parameters?.pool === name));
    }
  }, [filteredScResources, scLoaded, scLoadError, name]);

  React.useEffect(() => {
    if (filteredPvcResources && pvcLoaded && !pvcLoadError) {
      const sc = storageClasses.map((storageClass) => storageClass?.metadata.name);
      setPvcs(pvcResources.filter((pvc) => sc.includes(getStorageClassName(pvc))));
    }
  }, [filteredPvcResources, pvcLoaded, pvcLoadError, storageClasses, pvcResources]);

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
          resources={storageClasses}
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
