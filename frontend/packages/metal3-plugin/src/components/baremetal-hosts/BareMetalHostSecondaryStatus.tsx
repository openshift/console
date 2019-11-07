import * as React from 'react';
import { SecondaryStatus } from '@console/shared';
import { BareMetalHostKind } from '../../types';
import { getHostPowerStatus, getHostProvisioningState } from '../../selectors';
import { HOST_POWER_STATUS_POWERED_ON, HOST_REGISTERING_STATES } from '../../constants';

type BareMetalHostSecondaryStatusProps = {
  host: BareMetalHostKind;
};

const BareMetalHostSecondaryStatus: React.FC<BareMetalHostSecondaryStatusProps> = ({ host }) => {
  const powerStatus = getHostPowerStatus(host);
  const provisioningState = getHostProvisioningState(host);
  const status = [];
  // don't show power status when host is powered on
  // don't show power status when host registration/inspection hasn't finished
  if (
    !(powerStatus === HOST_POWER_STATUS_POWERED_ON) &&
    !HOST_REGISTERING_STATES.includes(provisioningState)
  ) {
    status.push(powerStatus);
  }
  return <SecondaryStatus status={status} />;
};

export default BareMetalHostSecondaryStatus;
