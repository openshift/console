import * as React from 'react';
import * as _ from 'lodash';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import AlertsBody from '@console/shared/src/components/dashboard/status-card/AlertsBody';
import AlertItem from '@console/shared/src/components/dashboard/status-card/AlertItem';
import { alertURL } from '@console/internal/components/monitoring';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import { PrometheusResponse } from '@console/internal/components/graphs';
import {
  withDashboardResources,
  DashboardItemProps,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import {
  DATA_RESILIENCY_QUERY,
  STORAGE_HEALTH_QUERIES,
  StorageDashboardQuery,
} from '../../../../constants/queries';
import { filterCephAlerts } from '../../../../selectors';
import { getCephHealthState, getDataResiliencyState } from './utils';

const cephStatusQuery = STORAGE_HEALTH_QUERIES[StorageDashboardQuery.CEPH_STATUS_QUERY];
const resiliencyProgressQuery = DATA_RESILIENCY_QUERY[StorageDashboardQuery.RESILIENCY_PROGRESS];

export const CephAlerts = withDashboardResources(
  ({ watchAlerts, stopWatchAlerts, notificationAlerts }) => {
    React.useEffect(() => {
      watchAlerts();
      return () => {
        stopWatchAlerts();
      };
    }, [watchAlerts, stopWatchAlerts]);

    const { data, loaded, loadError } = notificationAlerts || {};
    const alerts = filterCephAlerts(data);

    return (
      <AlertsBody
        isLoading={!loaded}
        error={!_.isEmpty(loadError)}
        emptyMessage="No persistent storage alerts"
      >
        {alerts.length
          ? alerts.map((alert) => <AlertItem key={alertURL(alert, alert.rule.id)} alert={alert} />)
          : null}
      </AlertsBody>
    );
  },
);

export const StatusCard: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  React.useEffect(() => {
    watchPrometheus(cephStatusQuery);
    watchPrometheus(resiliencyProgressQuery);

    return () => {
      stopWatchPrometheusQuery(cephStatusQuery);
      stopWatchPrometheusQuery(resiliencyProgressQuery);
    };
  }, [watchPrometheus, stopWatchPrometheusQuery]);

  const cephStatus = prometheusResults.getIn([cephStatusQuery, 'data']) as PrometheusResponse;
  const cephStatusError = prometheusResults.getIn([cephStatusQuery, 'loadError']);
  const resiliencyProgress = prometheusResults.getIn([
    resiliencyProgressQuery,
    'data',
  ]) as PrometheusResponse;
  const resiliencyProgressError = prometheusResults.getIn([resiliencyProgressQuery, 'loadError']);

  const cephHealthState = getCephHealthState([cephStatus], [cephStatusError]);
  const dataResiliencyState = getDataResiliencyState(
    [resiliencyProgress],
    [resiliencyProgressError],
  );

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
            <GalleryItem>
              <HealthItem title="Data Resiliency" state={dataResiliencyState.state} />
            </GalleryItem>
          </Gallery>
        </HealthBody>
        <CephAlerts />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(StatusCard);
