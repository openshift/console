import { getName, getNamespace } from '@console/shared';
import { VirtualMachineInstanceModel } from '../../models';
import { getConsoleApiBase } from '../../utils/url';
import { VMIKind } from '../../types/vm';

export const getVMISubresourcePath = () =>
  `${getConsoleApiBase()}/apis/subresources.${VirtualMachineInstanceModel.apiGroup}`;

export const getVMIApiPath = (vmi: VMIKind) =>
  `${VirtualMachineInstanceModel.apiVersion}/namespaces/${getNamespace(vmi)}/${
    VirtualMachineInstanceModel.plural
  }/${getName(vmi)}`;

export const getVMINetworks = (vmi: VMIKind): VMIKind['spec']['networks'] =>
  vmi && vmi.spec && vmi.spec.networks ? vmi.spec.networks : [];
export const getVMIDisks = (vmi: VMIKind): VMIKind['spec']['domain']['devices']['disks'] =>
  vmi && vmi.spec && vmi.spec.domain && vmi.spec.domain.devices && vmi.spec.domain.devices.disks
    ? vmi.spec.domain.devices.disks
    : [];

export const getVMIConditionByType = (
  vmi: VMIKind,
  condType: string,
): VMIKind['status']['conditions'] => {
  const conditions = vmi && vmi.status && vmi.status.conditions;
  return (conditions || []).filter((cond) => cond.type === condType);
};
