import * as React from 'react';
import AlertsBody from '@console/shared/src/components/dashboard/status-card/AlertsBody';
import { StatusItem } from '@console/shared/src/components/dashboard/status-card/AlertItem';
import { BlueInfoCircleIcon } from '@console/shared/src/components/status';
import { VMIKind } from '../../../types';
import { getVMIConditionsByType } from '../../../selectors/vmi';

// Based on: https://github.com/kubevirt/kubevirt/blob/f71e9c9615a6c36178169d66814586a93ba515b5/staging/src/kubevirt.io/client-go/api/v1/types.go#L337
const VMI_CONDITION_AGENT_CONNECTED = 'AgentConnected';

const isGuestAgentInstalled = (vmi: VMIKind) => {
  // the condition type is unique
  const conditions = getVMIConditionsByType(vmi, VMI_CONDITION_AGENT_CONNECTED);
  return conditions && conditions.length > 0 && conditions[0].status === 'True';
};

export const VMAlerts: React.FC<VMAlertsProps> = ({ vmi }) => (
  <AlertsBody>
    {vmi && vmi.status && !isGuestAgentInstalled(vmi) && (
      <StatusItem
        Icon={BlueInfoCircleIcon}
        message="This VM does not have guest agent installed. Some metrics and management features will not be available."
      />
    )}
  </AlertsBody>
);

type VMAlertsProps = {
  vmi?: VMIKind;
};
