import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { GalleryItem, Gallery } from '@patternfly/react-core';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { DashboardItemProps } from '@console/internal/components/dashboard/with-dashboard-resources';
import { getCephHealthState } from '../persistent-internal/status-card/utils';
import { cephClusterResource } from '../../../resources';

export const StatusCard: React.FC<DashboardItemProps> = () => {
  const { t } = useTranslation();
  const [data, loaded, loadError] = useK8sWatchResource<K8sResourceKind[]>(cephClusterResource);

  const cephHealth = getCephHealthState({ ceph: { data, loaded, loadError } }, t);

  return (
    <DashboardCard gradient>
      <DashboardCardHeader>
        <DashboardCardTitle>{t('ceph-storage-plugin~Status')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <HealthBody>
          <Gallery className="co-overview-status__health" hasGutter>
            <GalleryItem>
              <HealthItem
                title={t('ceph-storage-plugin~Storage Cluster')}
                state={cephHealth.state}
                details={cephHealth.message}
              />
            </GalleryItem>
          </Gallery>
        </HealthBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default StatusCard;
