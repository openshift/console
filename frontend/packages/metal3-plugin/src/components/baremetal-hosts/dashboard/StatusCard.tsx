import type { FC } from 'react';
import { useContext, useMemo } from 'react';
import {
  Gallery,
  GalleryItem,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from '@patternfly/react-core';
import { RebootingIcon } from '@patternfly/react-icons/dist/esm/icons/rebooting-icon';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import { Alert, StatusIconAndText } from '@console/dynamic-plugin-sdk';
import { alertURL } from '@console/internal/components/monitoring/utils';
import { resourcePathFromModel } from '@console/internal/components/utils';
import { BlueInfoCircleIcon } from '@console/shared';
import AlertItem, {
  StatusItem,
} from '@console/shared/src/components/dashboard/status-card/AlertItem';
import AlertsBody from '@console/shared/src/components/dashboard/status-card/AlertsBody';
import HealthBody from '@console/shared/src/components/dashboard/status-card/HealthBody';
import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { useNotificationAlerts } from '@console/shared/src/hooks/useNotificationAlerts';
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
  isDetached,
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

const PowerStatus = ({ obj }: { obj: BareMetalHostKind }) => {
  const hasPowerMgmt = hasPowerManagement(obj);
  const powerStatus = getHostPowerStatus(obj);
  const restartScheduled = isHostScheduledForRestart(obj);
  const { t } = useTranslation();
  if (isDetached(obj)) {
    return <HealthItem title={t('metal3-plugin~Detached')} state={HealthState.UNKNOWN} />;
  }
  if (!hasPowerMgmt) {
    return (
      <HealthItem
        title={t('metal3-plugin~No power management')}
        state={HealthState.NOT_AVAILABLE}
      />
    );
  }
  return (
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
  );
};

const HealthCard: FC = () => {
  const { t } = useTranslation();
  const { obj, machine, node, nodeMaintenance } = useContext(BareMetalHostDashboardContext);

  const [data, loaded, loadError] = useNotificationAlerts();

  const status = getHostStatus({ host: obj, machine, node, nodeMaintenance });

  const hwHealth = getHostHardwareHealthState(obj);

  const alerts = useMemo(() => filterAlerts(data), [data]);

  const hasPowerMgmt = hasPowerManagement(obj);
  const provisioningState = getHostProvisioningState(obj);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status</CardTitle>
      </CardHeader>
      <CardBody>
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
                <PowerStatus obj={obj} />
              </GalleryItem>
            )}
          </Gallery>
        </HealthBody>
        <AlertsBody error={!_.isEmpty(loadError)}>
          {!hasPowerMgmt && !isDetached(obj) && (
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
      </CardBody>
    </Card>
  );
};

export default HealthCard;

type HostHealthState = {
  state: HealthState;
  titleKey: string;
};
