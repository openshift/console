import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SecondaryStatus } from '@console/shared';
import { HOST_POWER_STATUS_POWERED_ON, HOST_REGISTERING_STATES } from '../../constants';
import {
  getHostPowerStatus,
  getHostProvisioningState,
  isHostScheduledForRestart,
  hasPowerManagement,
} from '../../selectors';
import { BareMetalHostKind } from '../../types';

type BareMetalHostSecondaryStatusProps = {
  host: BareMetalHostKind;
};

const BareMetalHostSecondaryStatus: React.FC<BareMetalHostSecondaryStatusProps> = ({ host }) => {
  const { t } = useTranslation();
  const powerStatus = getHostPowerStatus(host);
  const provisioningState = getHostProvisioningState(host);
  const status = [];

  if (!hasPowerManagement(host)) {
    status.push(t('metal3-plugin~No power management'));
    // don't show power status when host registration/inspection hasn't finished
  } else if (!HOST_REGISTERING_STATES.includes(provisioningState)) {
    if (isHostScheduledForRestart(host)) {
      status.push(t('metal3-plugin~Restart pending'));
    }

    // don't show power status when host is powered on
    if (powerStatus !== HOST_POWER_STATUS_POWERED_ON) {
      status.push(powerStatus);
    }
  }

  return <SecondaryStatus status={status} />;
};

export default BareMetalHostSecondaryStatus;
