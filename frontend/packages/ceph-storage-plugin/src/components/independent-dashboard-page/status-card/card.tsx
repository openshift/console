import * as React from 'react';
import { GalleryItem, Gallery } from '@patternfly/react-core';
import { withDashboardResources } from '@console/internal/components/dashboard/with-dashboard-resources';
import { PrometheusResponse } from '@console/internal/components/graphs';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import { StorageDashboardQuery, STORAGE_HEALTH_QUERIES } from '../../../constants/queries';
import { getCephHealthState } from '../../dashboard-page/storage-dashboard/status-card/utils';
import { CephAlerts } from '../../dashboard-page/storage-dashboard/status-card/status-card';

const cephStatusQuery = STORAGE_HEALTH_QUERIES[StorageDashboardQuery.CEPH_STATUS_QUERY];

const StatusCard = withDashboardResources((props) => {
  const { watchPrometheus, stopWatchPrometheusQuery, prometheusResults } = props;

  React.useEffect(() => {
    watchPrometheus(cephStatusQuery);
    return () => {
      stopWatchPrometheusQuery(cephStatusQuery);
    };
  }, [watchPrometheus, stopWatchPrometheusQuery]);

  const cephHealthData = prometheusResults.getIn([cephStatusQuery, 'data']) as PrometheusResponse;
  const cephHealthLoadError = prometheusResults.getIn([
    cephStatusQuery,
    'loadError',
  ]) as PrometheusResponse;
  const cephHealthState = getCephHealthState([cephHealthData], [cephHealthLoadError]);

  return (
    <DashboardCard gradient>
      <DashboardCardHeader>
        <DashboardCardTitle>Status</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <HealthBody>
          <Gallery className="co-overview-status__health" gutter="md">
            <GalleryItem>
              <HealthItem title="OCS Cluster" state={cephHealthState.state} />
            </GalleryItem>
          </Gallery>
        </HealthBody>
        <CephAlerts />
      </DashboardCardBody>
    </DashboardCard>
  );
});

export default StatusCard;
