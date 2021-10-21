import * as _ from 'lodash';
import { V1Network, V1NetworkInterface, VMIKind } from '../../types';
import { V1Disk, V1GPU, V1HostDevice, V1Volume } from '../../types/api';

export const getVMIDisks = (vmi: VMIKind, defaultValue: V1Disk[] = []): V1Disk[] =>
  vmi && vmi.spec && vmi.spec.domain && vmi.spec.domain.devices && vmi.spec.domain.devices.disks
    ? vmi.spec.domain.devices.disks
    : defaultValue;

export const getVMINetworks = (vmi: VMIKind, defaultValue: V1Network[] = []): V1Network[] =>
  vmi && vmi.spec && vmi.spec.networks ? vmi.spec.networks : defaultValue;

export const getVMIVolumes = (vmi: VMIKind, defaultValue: V1Volume[] = []): V1Volume[] =>
  vmi && vmi.spec && vmi.spec.volumes ? vmi.spec.volumes : defaultValue;

export const getVMIInterfaces = (
  vmi: VMIKind,
  defaultValue: V1NetworkInterface[] = [],
): V1NetworkInterface[] =>
  _.has(vmi, 'spec.domain.devices.interfaces') ? vmi.spec.domain.devices.interfaces : defaultValue;

export const getVMIGPUDevices = (vmi: VMIKind, defaultValue: V1GPU[] = []): V1GPU[] =>
  vmi && vmi.spec && vmi.spec.domain && vmi.spec.domain.devices && vmi.spec.domain.devices.gpus
    ? vmi.spec.domain.devices.gpus
    : defaultValue;

export const getVMIHostDevices = (
  vmi: VMIKind,
  defaultValue: V1HostDevice[] = [],
): V1HostDevice[] =>
  vmi &&
  vmi.spec &&
  vmi.spec.domain &&
  vmi.spec.domain.devices &&
  vmi.spec.domain.devices.hostDevices
    ? vmi.spec.domain.devices.hostDevices
    : defaultValue;

export const getVMIConditionsByType = (
  vmi: VMIKind,
  condType: string,
): VMIKind['status']['conditions'] => {
  const conditions = vmi && vmi.status && vmi.status.conditions;
  return (conditions || []).filter((cond) => cond.type === condType);
};

export const isVMIRunning = (vmi: VMIKind) => vmi && vmi.status && vmi.status.phase === 'Running';

export const getVMIAvailableStatusInterfaces = (vmi: VMIKind) =>
  (vmi && vmi.status && vmi.status.interfaces) || [];

export const getVMINodeName = (vmi: VMIKind) => vmi && vmi.status && vmi.status.nodeName;

export const isVMIPaused = (vmi: VMIKind): boolean =>
  getVMIConditionsByType(vmi, 'Paused').length > 0;

export const getVMINodeSelector = (vmi: VMIKind) => vmi?.spec?.nodeSelector;

export const getVMITolerations = (vmi: VMIKind) => vmi?.spec?.tolerations;

export const getVMIAffinity = (vmi: VMIKind) => vmi?.spec?.affinity;
