import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { GalleryItem, Gallery, Card, CardHeader, CardTitle } from '@patternfly/react-core';

import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
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
    <Card className="co-overview-card--gradient">
      <CardHeader>
        <CardTitle>{t('ceph-storage-plugin~Status')}</CardTitle>
      </CardHeader>
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
    </Card>
  );
};

export default StatusCard;
