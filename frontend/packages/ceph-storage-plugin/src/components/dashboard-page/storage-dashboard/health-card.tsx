import * as React from 'react';
import * as _ from 'lodash';

import {
  AlertsBody,
  AlertItem,
  getAlerts,
} from '@console/internal/components/dashboard/health-card';
import { DashboardCard } from '@console/internal/components/dashboard/dashboard-card/card';
import { DashboardCardBody } from '@console/internal/components/dashboard/dashboard-card/card-body';
import { DashboardCardHeader } from '@console/internal/components/dashboard/dashboard-card/card-header';
import { DashboardCardTitle } from '@console/internal/components/dashboard/dashboard-card/card-title';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboards-page/with-dashboard-resources';
import { HealthBody } from '@console/internal/components/dashboard/health-card/health-body';
import { HealthItem } from '@console/internal/components/dashboard/health-card/health-item';
import { HealthState } from '@console/internal/components/dashboard/health-card/states';
import { STORAGE_HEALTH_QUERIES } from '../../../constants/queries';
import { CEPH_HEALTHY, CEPH_DEGRADED, CEPH_ERROR, CEPH_UNKNOWN } from '../../../constants';
import { filterCephAlerts } from '../../../selectors';

const CephHealthStatus = [
  {
    message: CEPH_HEALTHY,
    state: HealthState.OK,
  },
  {
    message: CEPH_DEGRADED,
    state: HealthState.WARNING,
  },
  {
    message: CEPH_ERROR,
    state: HealthState.ERROR,
  },
  {
    message: CEPH_UNKNOWN,
    state: HealthState.ERROR,
  },
];

const getCephHealthState = (ocsResponse): CephHealth => {
  if (!ocsResponse) {
    return { state: HealthState.LOADING };
  }
  const value = _.get(ocsResponse, 'data.result[0].value[1]');
  return CephHealthStatus[value] || CephHealthStatus[3];
};

const HealthCard: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
  watchAlerts,
  stopWatchAlerts,
  alertsResults,
}) => {
  React.useEffect(() => {
    watchAlerts();
    watchPrometheus(STORAGE_HEALTH_QUERIES.CEPH_STATUS_QUERY);
    return () => {
      stopWatchAlerts();
      stopWatchPrometheusQuery(STORAGE_HEALTH_QUERIES.CEPH_STATUS_QUERY);
    };
  }, [watchPrometheus, stopWatchPrometheusQuery, watchAlerts, stopWatchAlerts]);

  const queryResult = prometheusResults.getIn([STORAGE_HEALTH_QUERIES.CEPH_STATUS_QUERY, 'result']);

  const cephHealthState = getCephHealthState(queryResult);
  const alerts = filterCephAlerts(getAlerts(alertsResults));

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
        <React.Fragment>
          <DashboardCardHeader className="co-alerts-card__border">
            <DashboardCardTitle>Alerts</DashboardCardTitle>
          </DashboardCardHeader>
          <DashboardCardBody>
            <AlertsBody>
              {alerts.map((alert) => (
                <AlertItem key={alert.fingerprint} alert={alert} />
              ))}
            </AlertsBody>
          </DashboardCardBody>
        </React.Fragment>
      )}
    </DashboardCard>
  );
};

export default withDashboardResources(HealthCard);

type CephHealth = {
  state: HealthState;
  message?: string;
};
