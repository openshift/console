import * as React from 'react';
import { GalleryItem, Gallery } from '@patternfly/react-core';
import { withDashboardResources } from '@console/internal/components/dashboard/with-dashboard-resources';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import { referenceForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { FirehoseResource, FirehoseResult } from '@console/internal/components/utils/types';
import { OCSServiceModel } from '../../../models';
import { getClusterHealth } from '../../independent-mode/utils';
import { OCS_INDEPENDENT_CR_NAME, CEPH_STORAGE_NAMESPACE } from '../../../constants';

const clusterResource: FirehoseResource = {
  kind: referenceForModel(OCSServiceModel),
  name: OCS_INDEPENDENT_CR_NAME,
  namespaced: true,
  namespace: CEPH_STORAGE_NAMESPACE,
  isList: false,
  prop: 'ocs',
};

const StatusCard = withDashboardResources((props) => {
  const { watchK8sResource, stopWatchK8sResource, resources } = props;

  React.useEffect(() => {
    watchK8sResource(clusterResource);
    return () => {
      stopWatchK8sResource(clusterResource);
    };
  }, [watchK8sResource, stopWatchK8sResource]);

  const cluster = resources?.ocs as FirehoseResult<K8sResourceKind>;
  const data = cluster?.data;
  const loaded = cluster?.loaded;
  const error = cluster?.loadError;

  const status = getClusterHealth(data, loaded, error);

  return (
    <DashboardCard gradient>
      <DashboardCardHeader>
        <DashboardCardTitle>Status</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <HealthBody>
          <Gallery className="co-overview-status__health" gutter="md">
            <GalleryItem>
              <HealthItem title="OCS Cluster" state={status} />
            </GalleryItem>
          </Gallery>
        </HealthBody>
      </DashboardCardBody>
    </DashboardCard>
  );
});

export default StatusCard;
