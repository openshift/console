import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { StatusItem } from '@console/shared/src/components/dashboard/status-card/AlertItem';
import AlertsBody from '@console/shared/src/components/dashboard/status-card/AlertsBody';
import { BlueInfoCircleIcon } from '@console/shared/src/components/status';

import { getVMIConditionsByType } from '../../../selectors/vmi';
import { VMIKind } from '../../../types';

// Based on: https://github.com/kubevirt/kubevirt/blob/f71e9c9615a6c36178169d66814586a93ba515b5/staging/src/kubevirt.io/client-go/api/v1/types.go#L337
const VMI_CONDITION_AGENT_CONNECTED = 'AgentConnected';
const VMI_CONDITION_AGENT_VERSION_NOT_SUPPORTED = 'AgentVersionNotSupported';

export const isGuestAgentInstalled = (vmi: VMIKind) => {
  // the condition type is unique
  const conditions = getVMIConditionsByType(vmi, VMI_CONDITION_AGENT_CONNECTED);
  return conditions && conditions.length > 0 && conditions[0].status === 'True';
};

export const isGuestAgentVersionSupported = (vmi: VMIKind) => {
  // the condition type is unique
  const conditions = getVMIConditionsByType(vmi, VMI_CONDITION_AGENT_VERSION_NOT_SUPPORTED);
  return !(conditions && conditions.length > 0 && conditions[0].status === 'True');
};

export const VMAlerts: React.FC<VMAlertsProps> = ({ vmi }) => {
  const { t } = useTranslation();
  const guestAgentNotSupported = vmi?.status && !isGuestAgentVersionSupported(vmi);
  const guestAgentNotInstalled =
    vmi?.status && !isGuestAgentInstalled(vmi) && isGuestAgentVersionSupported(vmi);

  return (
    <AlertsBody>
      {guestAgentNotInstalled && (
        <StatusItem
          Icon={BlueInfoCircleIcon}
          message={t(
            'kubevirt-plugin~A guest agent was not found for this VM. Either the guest agent was not installed or the VM has not finished booting. When a guest agent is not installed, some management features are unavailable and the metrics might be inaccurate.',
          )}
        />
      )}
      {guestAgentNotSupported && (
        <StatusItem
          Icon={BlueInfoCircleIcon}
          message={t(
            'kubevirt-plugin~This VM has an unsupported version of the guest agent. When an unsupported version of a guest agent is installed, some management features are unavailable and the metrics might be inaccurate. Check with your system administrator for supported guest agent versions.',
          )}
        />
      )}
    </AlertsBody>
  );
};

type VMAlertsProps = {
  vmi?: VMIKind;
};
