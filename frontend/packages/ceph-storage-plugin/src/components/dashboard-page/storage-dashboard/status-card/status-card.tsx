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
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { DATA_RESILIENCY_QUERY, StorageDashboardQuery } from '../../../../constants/queries';
import { cephClusterResource } from '../../../../constants/resources';
import { filterCephAlerts } from '../../../../selectors';
import { getCephHealthState, getDataResiliencyState } from './utils';

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
      <AlertsBody error={!_.isEmpty(loadError)}>
        {loaded &&
          alerts.length &&
          alerts.map((alert) => <AlertItem key={alertURL(alert, alert.rule.id)} alert={alert} />)}
      </AlertsBody>
    );
  },
);

export const StatusCard: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  const [data, loaded, loadError] = useK8sWatchResource<K8sResourceKind[]>(cephClusterResource);

  React.useEffect(() => {
    watchPrometheus(resiliencyProgressQuery);

    return () => {
      stopWatchPrometheusQuery(resiliencyProgressQuery);
    };
  }, [watchPrometheus, stopWatchPrometheusQuery]);

  const resiliencyProgress = prometheusResults.getIn([
    resiliencyProgressQuery,
    'data',
  ]) as PrometheusResponse;
  const resiliencyProgressError = prometheusResults.getIn([resiliencyProgressQuery, 'loadError']);

  const cephHealthState = getCephHealthState({ ceph: { data, loaded, loadError } });
  const dataResiliencyState = getDataResiliencyState([
    { response: resiliencyProgress, error: resiliencyProgressError },
  ]);

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
