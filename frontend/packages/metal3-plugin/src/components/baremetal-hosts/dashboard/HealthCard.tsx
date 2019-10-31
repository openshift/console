import * as React from 'react';
import * as _ from 'lodash';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import HealthBody from '@console/shared/src/components/dashboard/health-card/HealthBody';
import HealthItem from '@console/shared/src/components/dashboard/health-card/HealthItem';
import { HealthState } from '@console/shared/src/components/dashboard/health-card/states';
import { ALERTS_KEY } from '@console/internal/actions/dashboards';
import AlertsBody from '@console/shared/src/components/dashboard/health-card/AlertsBody';
import AlertItem from '@console/shared/src/components/dashboard/health-card/AlertItem';
import { getAlerts } from '@console/shared/src/components/dashboard/health-card/utils';
import { Alert, PrometheusRulesResponse, alertURL } from '@console/internal/components/monitoring';
import {
  HOST_STATUS_OK,
  HOST_HEALTH_OK,
  HOST_STATUS_ERROR,
  HOST_HEALTH_ERROR,
  HOST_HEALTH_LOADING,
} from '../../../constants';
import { getHostOperationalStatus } from '../../../selectors';
import { BareMetalHostKind } from '../../../types';
import { BareMetalHostDashboardContext } from './BareMetalHostDashboardContext';

const getHostHealthState = (obj): HostHealthState => {
  const status = getHostOperationalStatus(obj);

  switch (status) {
    case HOST_STATUS_OK:
      return {
        state: HealthState.OK,
        message: HOST_HEALTH_OK,
      };
    case HOST_STATUS_ERROR:
      return {
        state: HealthState.ERROR,
        message: HOST_HEALTH_ERROR,
      };
    default:
      return {
        state: HealthState.LOADING,
        message: HOST_HEALTH_LOADING,
      };
  }
};

const filterAlerts = (alerts: Alert[]): Alert[] =>
  alerts.filter((alert) => _.get(alert, 'labels.hwalert'));

const HealthCard: React.FC<HealthCardProps> = ({ watchAlerts, stopWatchAlerts, alertsResults }) => {
  const { obj } = React.useContext(BareMetalHostDashboardContext);

  React.useEffect(() => {
    watchAlerts();
    return () => stopWatchAlerts();
  }, [watchAlerts, stopWatchAlerts]);

  const health = getHostHealthState(obj);

  const alertsResponse = alertsResults.getIn([ALERTS_KEY, 'data']) as PrometheusRulesResponse;
  const alerts = filterAlerts(getAlerts(alertsResponse));

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Health</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <HealthBody>
          <HealthItem state={health.state} message={health.message} />
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

type HostHealthState = {
  state: HealthState;
  message: string;
};

type HealthCardProps = DashboardItemProps & {
  obj: BareMetalHostKind;
};
