import * as React from 'react';
import * as _ from 'lodash';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { ALERTS_KEY } from '@console/internal/actions/dashboards';
import AlertsBody from '@console/shared/src/components/dashboard/status-card/AlertsBody';
import { getAlerts } from '@console/shared/src/components/dashboard/status-card/utils';
import { Alert, PrometheusRulesResponse } from '@console/internal/components/monitoring';
import DashboardCardActions from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardActions';
import AlertFilter from '@console/shared/src/components/dashboard/status-card/AlertFilter';
import {
  SelectedFilters,
  useFilters,
} from '@console/shared/src/components/dashboard/status-card/use-filter-hook';
import { getBareMetalHostStatus } from '../../../status/host-status';
import {
  HOST_SUCCESS_STATES,
  HOST_ERROR_STATES,
  HOST_PROGRESS_STATES,
  HOST_HARDWARE_ERROR_STATES,
} from '../../../constants';
import { BareMetalHostKind } from '../../../types';
import { BareMetalHostDashboardContext } from './BareMetalHostDashboardContext';

const getHostHealthState = (obj: BareMetalHostKind): HostHealthState => {
  const { status, title } = getBareMetalHostStatus(obj);
  let state: HealthState = HealthState.UNKNOWN;

  if (HOST_SUCCESS_STATES.includes(status)) {
    state = HealthState.OK;
  }

  if (HOST_ERROR_STATES.includes(status)) {
    state = HealthState.ERROR;
  }

  if (HOST_PROGRESS_STATES.includes(status)) {
    state = HealthState.PROGRESS;
  }

  return {
    title,
    state,
  };
};

const getHostHardwareHealthState = (obj): HostHealthState => {
  const { status, title } = getBareMetalHostStatus(obj);

  return HOST_HARDWARE_ERROR_STATES.includes(status)
    ? {
        state: HealthState.ERROR,
        title,
      }
    : {
        title: '',
        state: HealthState.OK,
      };
};

const filterAlerts = (alerts: Alert[]): Alert[] =>
  alerts.filter((alert) => _.get(alert, 'labels.hwalert'));

const BareMetalAlerts = withDashboardResources<DashboardItemProps & BareMetalAlertsProps>(
  ({ watchAlerts, stopWatchAlerts, alertsResults, selectedFilters, resetFilters }) => {
    React.useEffect(() => {
      watchAlerts();
      return () => stopWatchAlerts();
    }, [watchAlerts, stopWatchAlerts]);

    const alertsResponse = alertsResults.getIn([ALERTS_KEY, 'data']) as PrometheusRulesResponse;
    const alertsResponseError = alertsResults.getIn([ALERTS_KEY, 'loadError']);
    const alerts = filterAlerts(getAlerts(alertsResponse));

    return (
      <AlertsBody
        isLoading={!alertsResponse}
        error={alertsResponseError}
        emptyMessage="No alerts or messages"
        alerts={alerts}
        selectedFilters={selectedFilters}
        resetFilters={resetFilters}
      />
    );
  },
);

const HealthCard: React.FC = () => {
  const { obj } = React.useContext(BareMetalHostDashboardContext);
  const [filters, selectedFilters, resetFilters, toggleFilter] = useFilters();

  const health = getHostHealthState(obj);
  const hwHealth = getHostHardwareHealthState(obj);

  return (
    <DashboardCard gradient>
      <DashboardCardHeader compact>
        <DashboardCardTitle>Status</DashboardCardTitle>
        <DashboardCardActions>
          <AlertFilter
            filters={filters}
            selectedFilters={selectedFilters}
            toggleFilter={toggleFilter}
          />
        </DashboardCardActions>
      </DashboardCardHeader>
      <DashboardCardBody>
        <HealthBody>
          <Gallery className="co-overview-status__health" gutter="md">
            <GalleryItem>
              <HealthItem title="Status" state={health.state} details={health.title} />
            </GalleryItem>
            <GalleryItem>
              <HealthItem title="Hardware" state={hwHealth.state} details={hwHealth.title} />
            </GalleryItem>
          </Gallery>
        </HealthBody>
        <BareMetalAlerts selectedFilters={selectedFilters} resetFilters={resetFilters} />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default HealthCard;

type HostHealthState = {
  state: HealthState;
  title: string;
};

type BareMetalAlertsProps = {
  selectedFilters: SelectedFilters;
  resetFilters: () => void;
};
