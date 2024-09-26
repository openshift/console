// Based on: https://github.com/kubevirt/kubevirt/blob/f71e9c9615a6c36178169d66814586a93ba515b5/staging/src/kubevirt.io/client-go/api/v1/types.go#L337
import { getVMIConditionsByType } from '../selectors/vmi';
import { VMIKind } from '../types/vmi';

const VMI_CONDITION_AGENT_CONNECTED = 'AgentConnected';

export const isGuestAgentInstalled = (vmi: VMIKind) => {
  // the condition type is unique
  const conditions = getVMIConditionsByType(vmi, VMI_CONDITION_AGENT_CONNECTED);
  return conditions && conditions.length > 0 && conditions[0].status === 'True';
};
