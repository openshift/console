import * as _ from 'lodash';
import { VirtualMachineInstanceModel } from '../models';
import { getKubevirtModelAvailableVersion } from '../models/kubevirtReferenceForModel';
import { V1Disk, V1GPU, V1HostDevice, V1Volume } from '../types/api';
import { V1Network, V1NetworkInterface } from '../types/vm';
import { VMIKind } from '../types/vmi';
import { getConsoleAPIBase } from '../utils/url';
import { getName, getNamespace } from './k8sCommon';

export const getVMIDisks = (vmi: VMIKind, defaultValue: V1Disk[] = []): V1Disk[] =>
  vmi && vmi.spec && vmi.spec.domain && vmi.spec.domain.devices && vmi.spec.domain.devices.disks
    ? vmi.spec.domain.devices.disks
    : defaultValue;

export const getVMIInterfaces = (
  vmi: VMIKind,
  defaultValue: V1NetworkInterface[] = [],
): V1NetworkInterface[] =>
  _.has(vmi, 'spec.domain.devices.interfaces') ? vmi.spec.domain.devices.interfaces : defaultValue;

export const getVMINetworks = (vmi: VMIKind, defaultValue: V1Network[] = []): V1Network[] =>
  vmi && vmi.spec && vmi.spec.networks ? vmi.spec.networks : defaultValue;

export const getVMIVolumes = (vmi: VMIKind, defaultValue: V1Volume[] = []): V1Volume[] =>
  vmi && vmi.spec && vmi.spec.volumes ? vmi.spec.volumes : defaultValue;

export const getVMINodeSelector = (vmi: VMIKind) => vmi?.spec?.nodeSelector;

export const getVMITolerations = (vmi: VMIKind) => vmi?.spec?.tolerations;

export const getVMIAffinity = (vmi: VMIKind) => vmi?.spec?.affinity;

export const getVMIGPUDevices = (vmi: VMIKind, defaultValue: V1GPU[] = []): V1GPU[] =>
  vmi?.spec?.domain?.devices?.gpus || defaultValue;

export const getVMIHostDevices = (
  vmi: VMIKind,
  defaultValue: V1HostDevice[] = [],
): V1HostDevice[] => vmi?.spec?.domain?.devices?.hostDevices || defaultValue;

export const getVMIConditionsByType = (
  vmi: VMIKind,
  condType: string,
): VMIKind['status']['conditions'] => {
  const conditions = vmi && vmi.status && vmi.status.conditions;
  return (conditions || []).filter((cond) => cond.type === condType);
};

export const isVMIPaused = (vmi: VMIKind): boolean =>
  getVMIConditionsByType(vmi, 'Paused').length > 0;

export const getVMISubresourcePath = () =>
  `${getConsoleAPIBase()}/apis/subresources.${VirtualMachineInstanceModel.apiGroup}`;

export const getVMIApiPath = (vmi: VMIKind) =>
  `${getKubevirtModelAvailableVersion(VirtualMachineInstanceModel)}/namespaces/${getNamespace(
    vmi,
  )}/${VirtualMachineInstanceModel.plural}/${getName(vmi)}`;
