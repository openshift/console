import * as React from 'react';
import * as _ from 'lodash';
import AlertsBody from '@console/shared/src/components/dashboard/health-card/AlertsBody';
import AlertItem from '@console/shared/src/components/dashboard/health-card/AlertItem';
import { getAlerts } from '@console/shared/src/components/dashboard/health-card/utils';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import { FirehoseResult } from '@console/internal/components/utils';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { ALERTS_KEY } from '@console/internal/actions/dashboards';
import { PrometheusRulesResponse, alertURL } from '@console/internal/components/monitoring';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import HealthBody from '@console/shared/src/components/dashboard/health-card/HealthBody';
import HealthItem from '@console/shared/src/components/dashboard/health-card/HealthItem';
import { HealthState } from '@console/shared/src/components/dashboard/health-card/states';
import { STORAGE_HEALTH_QUERIES, StorageDashboardQuery } from '../../../../constants/queries';
import { filterCephAlerts } from '../../../../selectors';
import { cephClusterResource } from '../../../../constants/resources';
import { getCephHealthState } from './utils';

const HealthCard: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
  watchAlerts,
  stopWatchAlerts,
  alertsResults,
  resources,
  watchK8sResource,
  stopWatchK8sResource,
}) => {
  React.useEffect(() => {
    watchAlerts();
    watchK8sResource(cephClusterResource);
    watchPrometheus(STORAGE_HEALTH_QUERIES[StorageDashboardQuery.CEPH_STATUS_QUERY]);
    return () => {
      stopWatchAlerts();
      stopWatchK8sResource(cephClusterResource);
      stopWatchPrometheusQuery(STORAGE_HEALTH_QUERIES[StorageDashboardQuery.CEPH_STATUS_QUERY]);
    };
  }, [
    watchK8sResource,
    stopWatchK8sResource,
    watchPrometheus,
    stopWatchPrometheusQuery,
    watchAlerts,
    stopWatchAlerts,
  ]);

  const queryResult = prometheusResults.getIn([
    STORAGE_HEALTH_QUERIES[StorageDashboardQuery.CEPH_STATUS_QUERY],
    'data',
  ]) as PrometheusResponse;
  const queryResultError = prometheusResults.getIn([
    STORAGE_HEALTH_QUERIES[StorageDashboardQuery.CEPH_STATUS_QUERY],
    'loadError',
  ]);

  const cephCluster = _.get(resources, 'ceph') as FirehoseResult;
  const cephHealthState = getCephHealthState([queryResult], [queryResultError], cephCluster);

  const alertsResponse = alertsResults.getIn([ALERTS_KEY, 'data']) as PrometheusRulesResponse;
  const alerts = filterCephAlerts(getAlerts(alertsResponse));

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Health</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody isLoading={cephHealthState.state === HealthState.LOADING}>
        <HealthBody>
          <HealthItem state={cephHealthState.state} message={cephHealthState.message} />
        </HealthBody>
      </DashboardCardBody>
      {alerts.length > 0 && (
        <>
          <DashboardCardHeader className="co-health-card__alerts-border">
            <DashboardCardTitle>Alerts</DashboardCardTitle>
          </DashboardCardHeader>
          <DashboardCardBody>
            <AlertsBody>
              {alerts.map((alert) => (
                <AlertItem key={alertURL(alert, alert.rule.id)} alert={alert} />
              ))}
            </AlertsBody>
          </DashboardCardBody>
        </>
      )}
    </DashboardCard>
  );
};

export default withDashboardResources(HealthCard);
