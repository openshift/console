import * as _ from 'lodash';
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

export const getVmiTemplateLabels = (vmi: VMIKind): { [key: string]: string } =>
  (_.get(vmi, 'vmi.spec.template.metadata') && vmi.spec.template.metadata.labels) || {};

export const isVMIRunning = (vmi: VMIKind) => vmi && vmi.status && vmi.status.phase === 'Running';

export const getVMIInterfaces = (vmi: VMIKind) =>
  (vmi && vmi.status && vmi.status.interfaces) || [];

export const getVMINodeName = (vmi: VMIKind) => vmi && vmi.status && vmi.status.nodeName;
