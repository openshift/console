import {
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_WORKLOAD_LABEL,
} from '../../../constants/vm';
import { VirtualMachineInstanceModel } from '../../../models';
import { transformDevices } from '../../../selectors/vm/devices';
import {
  getVMIAffinity,
  getVMIDisks,
  getVMIInterfaces,
  getVMINetworks,
  getVMINodeSelector,
  getVMITolerations,
  getVMIVolumes,
} from '../../../selectors/vmi';
/* eslint-disable lines-between-class-members */
import { CPURaw, VMIKind, VMISpec } from '../../../types';
import { V1Disk, V1Volume } from '../../../types/api';
import { findKeySuffixValue } from '../../../utils';
import { K8sResourceWrapper } from '../common/k8s-resource-wrapper';
import { VMILikeMethods } from './types';

export class VMIWrapper extends K8sResourceWrapper<VMIKind, VMIWrapper> implements VMILikeMethods {
  constructor(vmi?: VMIKind | VMIWrapper | any, copy = false) {
    super(VirtualMachineInstanceModel, vmi, copy);
  }

  getOperatingSystem = () => findKeySuffixValue(this.getLabels(), TEMPLATE_OS_LABEL);
  getWorkloadProfile = () => findKeySuffixValue(this.getLabels(), TEMPLATE_WORKLOAD_LABEL);
  getFlavor = () => findKeySuffixValue(this.getLabels(), TEMPLATE_FLAVOR_LABEL);
  getVirtualMachineInstanceSpec = (): VMISpec => this.data?.spec;
  getEvictionStrategy = (): string => this.getVirtualMachineInstanceSpec()?.evictionStrategy;
  getMemory = () => this.getVirtualMachineInstanceSpec()?.domain?.resources?.requests?.memory;
  getCPU = (): CPURaw => this.getVirtualMachineInstanceSpec()?.domain?.cpu;

  getNetworkInterfaces = (defaultValue = []) => getVMIInterfaces(this.data, defaultValue);

  getDisks = (defaultValue = []) => getVMIDisks(this.data, defaultValue);
  getCDROMs = () => this.getDisks().filter((device) => !!device.cdrom);

  getNetworks = (defaultValue = []) => getVMINetworks(this.data, defaultValue);

  getVolumes = (defaultValue = []) => getVMIVolumes(this.data, defaultValue);

  getVolumesOfDisks = (disks: V1Disk[]): V1Volume[] => {
    const diskNames = disks.map((disk) => disk?.name);
    return this.getVolumes().filter((vol) => diskNames.includes(vol.name));
  };

  getLabeledDevices = () => transformDevices(this.getDisks(), this.getNetworkInterfaces());

  isDedicatedCPUPlacement = () => this.data.spec?.domain?.cpu?.dedicatedCpuPlacement || false;

  getNodeSelector = () => getVMINodeSelector(this.data);

  getTolerations = () => getVMITolerations(this.data);

  getAffinity = () => getVMIAffinity(this.data);
}
