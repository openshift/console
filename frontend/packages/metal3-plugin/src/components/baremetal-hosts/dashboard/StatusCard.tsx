import * as React from 'react';
import { Gallery, GalleryItem } from '@patternfly/react-core';
import { RebootingIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { Alert } from '@console/internal/components/monitoring/types';
import { alertURL } from '@console/internal/components/monitoring/utils';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { BlueInfoCircleIcon, StatusIconAndText } from '@console/shared';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import AlertItem, {
  StatusItem,
} from '@console/shared/src/components/dashboard/status-card/AlertItem';
import AlertsBody from '@console/shared/src/components/dashboard/status-card/AlertsBody';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import {
  HOST_STATUS_DESCRIPTION_KEYS,
  HOST_HARDWARE_ERROR_STATES,
  HOST_STATUS_UNMANAGED,
  HOST_REGISTERING_STATES,
} from '../../../constants';
import { BareMetalHostModel } from '../../../models';
import {
  getHostPowerStatus,
  getHostProvisioningState,
  hasPowerManagement,
  isHostScheduledForRestart,
} from '../../../selectors';
import { getBareMetalHostStatus, getHostStatus } from '../../../status/host-status';
import { BareMetalHostKind } from '../../../types';
import BareMetalHostPowerStatusIcon from '../BareMetalHostPowerStatusIcon';
import BareMetalHostStatus from '../BareMetalHostStatus';
import { BareMetalHostDashboardContext } from './BareMetalHostDashboardContext';

import './status.scss';

const getHostHardwareHealthState = (obj): HostHealthState => {
  const { status, titleKey } = getBareMetalHostStatus(obj);

  return HOST_HARDWARE_ERROR_STATES.includes(status)
    ? {
        state: HealthState.ERROR,
        titleKey,
      }
    : {
        titleKey: '',
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
  const { t } = useTranslation();
  const { obj, machine, node, nodeMaintenance } = React.useContext(BareMetalHostDashboardContext);

  React.useEffect(() => {
    watchAlerts();
    return () => stopWatchAlerts();
  }, [watchAlerts, stopWatchAlerts]);

  const status = getHostStatus({ host: obj, machine, node, nodeMaintenance });

  const hwHealth = getHostHardwareHealthState(obj);

  const { data, loaded, loadError } = notificationAlerts || {};
  const alerts = React.useMemo(() => filterAlerts(data), [data]);

  const hasPowerMgmt = hasPowerManagement(obj);
  const provisioningState = getHostProvisioningState(obj);
  const powerStatus = getHostPowerStatus(obj);
  const restartScheduled = isHostScheduledForRestart(obj);

  return (
    <DashboardCard gradient>
      <DashboardCardHeader>
        <DashboardCardTitle>Status</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <HealthBody>
          <Gallery className="co-overview-status__health" hasGutter>
            <GalleryItem className="bmh-health__status-item">
              <BareMetalHostStatus
                {...status}
                nodeMaintenance={nodeMaintenance}
                host={obj}
                className="bmh-health__status"
              />
            </GalleryItem>
            <GalleryItem>
              <HealthItem
                title={t('metal3-plugin~Hardware')}
                state={hwHealth.state}
                details={t(hwHealth.titleKey)}
              />
            </GalleryItem>
            {!HOST_REGISTERING_STATES.includes(provisioningState) && (
              <GalleryItem>
                {!hasPowerMgmt ? (
                  <HealthItem
                    title={t('metal3-plugin~No power management')}
                    state={HealthState.NOT_AVAILABLE}
                  />
                ) : (
                  <StatusIconAndText
                    title={restartScheduled ? t('metal3-plugin~Restart pending') : powerStatus}
                    icon={
                      restartScheduled ? (
                        <RebootingIcon />
                      ) : (
                        <BareMetalHostPowerStatusIcon powerStatus={powerStatus} />
                      )
                    }
                    className="bmh-health__status"
                  />
                )}
              </GalleryItem>
            )}
          </Gallery>
        </HealthBody>
        <AlertsBody error={!_.isEmpty(loadError)}>
          {!hasPowerMgmt && (
            <StatusItem
              Icon={BlueInfoCircleIcon}
              message={t(HOST_STATUS_DESCRIPTION_KEYS[HOST_STATUS_UNMANAGED])}
            >
              <Link
                to={`${resourcePathFromModel(
                  BareMetalHostModel,
                  obj.metadata.name,
                  obj.metadata.namespace,
                )}/edit?powerMgmt`}
              >
                Add credentials
              </Link>
            </StatusItem>
          )}
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
  titleKey: string;
};

type HealthCardProps = DashboardItemProps & {
  obj: BareMetalHostKind;
};
