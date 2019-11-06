import { VMIKind } from '../../types';

export const getVMIDisks = (vmi: VMIKind): VMIKind['spec']['domain']['devices']['disks'] =>
  vmi && vmi.spec && vmi.spec.domain && vmi.spec.domain.devices && vmi.spec.domain.devices.disks
    ? vmi.spec.domain.devices.disks
    : [];

export const getVMINetworks = (vmi: VMIKind): VMIKind['spec']['networks'] =>
  vmi && vmi.spec && vmi.spec.networks ? vmi.spec.networks : [];

export const getVMIConditionsByType = (
  vmi: VMIKind,
  condType: string,
): VMIKind['status']['conditions'] => {
  const conditions = vmi && vmi.status && vmi.status.conditions;
  return (conditions || []).filter((cond) => cond.type === condType);
};
