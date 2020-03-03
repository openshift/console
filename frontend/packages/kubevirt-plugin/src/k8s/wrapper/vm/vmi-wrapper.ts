/* eslint-disable lines-between-class-members */
import { CPURaw, VMIKind } from '../../../types/vm';
import { K8sResourceWrapper } from '../common/k8s-resource-wrapper';
import {
  getVMIDisks,
  getVMINetworks,
  getVMIVolumes,
  getVMIInterfaces,
} from '../../../selectors/vmi';
import { VMILikeMethods } from './types';
import { transformDevices } from '../../../selectors/vm';
import { findKeySuffixValue } from '../../../selectors/utils';
import {
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_WORKLOAD_LABEL,
} from '../../../constants/vm';

export class VMIWrapper extends K8sResourceWrapper<VMIKind> implements VMILikeMethods {
  static mergeWrappers = (...vmiWrappers: VMIWrapper[]): VMIWrapper =>
    K8sResourceWrapper.defaultMergeWrappers(VMIWrapper, vmiWrappers);

  static initialize = (vm?: VMIKind, copy?: boolean) => new VMIWrapper(vm, copy && { copy });

  protected constructor(
    vm?: VMIKind,
    opts?: {
      copy?: boolean;
    },
  ) {
    super(vm, opts);
  }

  getOperatingSystem = () => findKeySuffixValue(this.getLabels(), TEMPLATE_OS_LABEL);
  getWorkloadProfile = () => findKeySuffixValue(this.getLabels(), TEMPLATE_WORKLOAD_LABEL);
  getFlavor = () => findKeySuffixValue(this.getLabels(), TEMPLATE_FLAVOR_LABEL);

  getMemory = () => this.data?.spec?.domain?.resources?.requests?.memory;
  getCPU = (): CPURaw => this.data?.spec?.domain?.cpu;

  getInterfaces = (defaultValue = []) => getVMIInterfaces(this.data, defaultValue);

  getDisks = (defaultValue = []) => getVMIDisks(this.data, defaultValue);
  getCDROMs = () => this.getDisks().filter((device) => !!device.cdrom);

  getNetworks = (defaultValue = []) => getVMINetworks(this.data, defaultValue);

  getVolumes = (defaultValue = []) => getVMIVolumes(this.data, defaultValue);

  getLabeledDevices = () => transformDevices(this.getDisks(), this.getInterfaces());

  isDedicatedCPUPlacement = () => this.data.spec?.domain?.cpu?.dedicatedCpuPlacement || false;
}
