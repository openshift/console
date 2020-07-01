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
import AlertsBody from '@console/shared/src/components/dashboard/status-card/AlertsBody';
import AlertItem from '@console/shared/src/components/dashboard/status-card/AlertItem';
import { Alert } from '@console/internal/components/monitoring/types';
import { alertURL } from '@console/internal/components/monitoring/utils';
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

const HealthCard: React.FC<HealthCardProps> = ({
  watchAlerts,
  stopWatchAlerts,
  notificationAlerts,
}) => {
  const { obj } = React.useContext(BareMetalHostDashboardContext);

  React.useEffect(() => {
    watchAlerts();
    return () => stopWatchAlerts();
  }, [watchAlerts, stopWatchAlerts]);

  const health = getHostHealthState(obj);
  const hwHealth = getHostHardwareHealthState(obj);

  const { data, loaded, loadError } = notificationAlerts || {};
  const alerts = React.useMemo(() => filterAlerts(data), [data]);

  return (
    <DashboardCard gradient>
      <DashboardCardHeader>
        <DashboardCardTitle>Status</DashboardCardTitle>
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
        <AlertsBody error={!_.isEmpty(loadError)}>
          {loaded && alerts.length !== 0
            ? alerts.map((alert) => (
                <AlertItem key={alertURL(alert, alert.rule.id)} alert={alert} />
              ))
            : null}
        </AlertsBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(HealthCard);

type HostHealthState = {
  state: HealthState;
  title: string;
};

type HealthCardProps = DashboardItemProps & {
  obj: BareMetalHostKind;
};
