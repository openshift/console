import * as React from 'react';
import { SecondaryStatus } from '@console/shared';
import { BareMetalHostKind } from '../../types';
import {
  getHostPowerStatus,
  getHostProvisioningState,
  isHostScheduledForRestart,
  hasPowerManagement,
} from '../../selectors';
import { HOST_POWER_STATUS_POWERED_ON, HOST_REGISTERING_STATES } from '../../constants';

type BareMetalHostSecondaryStatusProps = {
  host: BareMetalHostKind;
};

export const HOST_SCHEDULED_FOR_RESTART = 'Restart pending';
export const HOST_NO_POWER_MGMT = 'No power management';

const BareMetalHostSecondaryStatus: React.FC<BareMetalHostSecondaryStatusProps> = ({ host }) => {
  const powerStatus = getHostPowerStatus(host);
  const provisioningState = getHostProvisioningState(host);
  const status = [];

  if (!hasPowerManagement(host)) {
    status.push(HOST_NO_POWER_MGMT);
    // don't show power status when host registration/inspection hasn't finished
  } else if (!HOST_REGISTERING_STATES.includes(provisioningState)) {
    if (isHostScheduledForRestart(host)) {
      status.push(HOST_SCHEDULED_FOR_RESTART);
    }

    // don't show power status when host is powered on
    if (powerStatus !== HOST_POWER_STATUS_POWERED_ON) {
      status.push(powerStatus);
    }
  }

  return <SecondaryStatus status={status} />;
};

export default BareMetalHostSecondaryStatus;
