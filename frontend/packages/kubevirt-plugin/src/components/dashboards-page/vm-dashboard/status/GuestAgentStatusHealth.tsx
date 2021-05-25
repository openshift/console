import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { VMIKind } from '@console/kubevirt-plugin/src/types';
import HealthItem from '@console/shared/src/components/dashboard/status-card/HealthItem';
import { HealthState } from '@console/shared/src/components/dashboard/status-card/states';
import { OffIcon } from '@patternfly/react-icons';

import {
  isGuestAgentInstalled,
  isGuestAgentVersionSupported,
} from '../../../../utils/guest-agent-utils';

type GuestAgentProps = {
  vmi: VMIKind;
};

const GuestAgentStatusHealth: React.FC<GuestAgentProps> = ({ vmi }) => {
  const { t } = useTranslation();
  const isGAVersionSupported = isGuestAgentVersionSupported(vmi);

  const guestAgentNotSupportedMessage =
    vmi?.status &&
    !isGAVersionSupported &&
    t(
      'kubevirt-plugin~This VM has an unsupported version of the guest agent. When an unsupported version of a guest agent is installed, some management features are unavailable and the metrics might be inaccurate. Check with your system administrator for supported guest agent versions.',
    );

  const guestAgentNotInstalledMessage =
    vmi?.status &&
    !isGuestAgentInstalled(vmi) &&
    isGAVersionSupported &&
    t(
      'kubevirt-plugin~A guest agent was not found for this VM. Either the guest agent was not installed or the VM has not finished booting. When a guest agent is not installed, some management features are unavailable and the metrics might be inaccurate.',
    );

  const state = !vmi?.status
    ? HealthState.UNKNOWN
    : guestAgentNotInstalledMessage || guestAgentNotSupportedMessage
    ? HealthState.WARNING
    : HealthState.OK;

  const details =
    (guestAgentNotSupportedMessage && t('kubevirt-plugin~Unsupported version')) ||
    (guestAgentNotInstalledMessage && t('kubevirt-plugin~Guest agent is unavailable')) ||
    (!vmi?.status && t('kubevirt-plugin~Virtual machine not running')) ||
    HealthState.OK;

  return (
    <HealthItem
      title={t('kubevirt-plugin~Guest Agent')}
      state={state}
      details={details}
      icon={!vmi?.status && <OffIcon />}
      popupTitle={t('kubevirt-plugin~Guest agent status')}
    >
      {guestAgentNotInstalledMessage || guestAgentNotSupportedMessage}
    </HealthItem>
  );
};

export default GuestAgentStatusHealth;
