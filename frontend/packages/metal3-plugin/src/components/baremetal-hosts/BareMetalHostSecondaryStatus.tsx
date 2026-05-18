import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { SecondaryStatus } from '@console/shared/src/components/status/SecondaryStatus';
import {
  HOST_POWER_STATUS_POWERED_ON,
  HOST_REGISTERING_STATES,
} from '../../constants/bare-metal-host';
import {
  getHostPowerStatus,
  getHostProvisioningState,
  isHostScheduledForRestart,
  hasPowerManagement,
  isDetached,
} from '../../selectors/baremetal-hosts';
import type { BareMetalHostKind } from '../../types/host';

type BareMetalHostSecondaryStatusProps = {
  host: BareMetalHostKind;
};

const BareMetalHostSecondaryStatus: FC<BareMetalHostSecondaryStatusProps> = ({ host }) => {
  const { t } = useTranslation();
  const powerStatus = getHostPowerStatus(host);
  const provisioningState = getHostProvisioningState(host);
  const status = [];

  if (!isDetached(host)) {
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
  }

  return <SecondaryStatus status={status} />;
};

export default BareMetalHostSecondaryStatus;
