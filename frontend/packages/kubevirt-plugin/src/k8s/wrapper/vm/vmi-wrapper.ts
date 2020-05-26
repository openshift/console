/* eslint-disable lines-between-class-members */
import { CPURaw, VMIKind } from '../../../types/vm';
import { K8sResourceWrapper } from '../common/k8s-resource-wrapper';
import {
  getVMIDisks,
  getVMINetworks,
  getVMIVolumes,
  getVMIInterfaces,
  getVMINodeSelector,
  getVMITolerations,
  getVMIAffinity,
} from '../../../selectors/vmi';
import { VMILikeMethods } from './types';
import { findKeySuffixValue } from '../../../selectors/utils';
import {
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_WORKLOAD_LABEL,
} from '../../../constants/vm';
import { VirtualMachineInstanceModel } from '../../../models';
import { transformDevices } from '../../../selectors/vm/devices';

export class VMIWrapper extends K8sResourceWrapper<VMIKind, VMIWrapper> implements VMILikeMethods {
  constructor(vmi?: VMIKind | VMIWrapper | any, copy = false) {
    super(VirtualMachineInstanceModel, vmi, copy);
  }

  getOperatingSystem = () => findKeySuffixValue(this.getLabels(), TEMPLATE_OS_LABEL);
  getWorkloadProfile = () => findKeySuffixValue(this.getLabels(), TEMPLATE_WORKLOAD_LABEL);
  getFlavor = () => findKeySuffixValue(this.getLabels(), TEMPLATE_FLAVOR_LABEL);

  getMemory = () => this.data?.spec?.domain?.resources?.requests?.memory;
  getCPU = (): CPURaw => this.data?.spec?.domain?.cpu;

  getNetworkInterfaces = (defaultValue = []) => getVMIInterfaces(this.data, defaultValue);

  getDisks = (defaultValue = []) => getVMIDisks(this.data, defaultValue);
  getCDROMs = () => this.getDisks().filter((device) => !!device.cdrom);

  getNetworks = (defaultValue = []) => getVMINetworks(this.data, defaultValue);

  getVolumes = (defaultValue = []) => getVMIVolumes(this.data, defaultValue);

  getLabeledDevices = () => transformDevices(this.getDisks(), this.getNetworkInterfaces());

  isDedicatedCPUPlacement = () => this.data.spec?.domain?.cpu?.dedicatedCpuPlacement || false;

  getNodeSelector = () => getVMINodeSelector(this.data);

  getTolerations = () => getVMITolerations(this.data);

  getAffinity = () => getVMIAffinity(this.data);
}
