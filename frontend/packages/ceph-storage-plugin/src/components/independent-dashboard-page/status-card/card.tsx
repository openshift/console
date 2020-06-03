import * as React from 'react';
import { GalleryItem, Gallery } from '@patternfly/react-core';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getCephHealthState } from '../../dashboard-page/storage-dashboard/status-card/utils';
import { cephClusterResource } from '../../../constants/resources';

const StatusCard: React.FC = () => {
  const [data, loaded, loadError] = useK8sWatchResource<K8sResourceKind[]>(cephClusterResource);

  const cephHealth = getCephHealthState({ ceph: { data, loaded, loadError } });

  return (
    <DashboardCard gradient>
      <DashboardCardHeader>
        <DashboardCardTitle>Status</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <HealthBody>
          <Gallery className="co-overview-status__health" gutter="md">
            <GalleryItem>
              <HealthItem
                title="OCS Cluster"
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
