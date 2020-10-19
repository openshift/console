import { K8sResourceWrapper } from '../common/k8s-resource-wrapper';
import { VMRestore } from '../../../types';
import { VirtualMachineModel, VirtualMachineRestoreModel } from '../../../models';
import { K8sInitAddon } from '../common/util/k8s-mixin';
import { getVmRestoreVmName } from '../../../selectors/snapshot/snapshot';

export class VMRestoreWrapper extends K8sResourceWrapper<VMRestore, VMRestoreWrapper> {
  constructor(snapshot?: VMRestore | VMRestoreWrapper | any, copy = false) {
    super(VirtualMachineRestoreModel, snapshot, copy);
  }

  init(
    data: K8sInitAddon & {
      vmName: string;
      snapshotName: string;
      excludeVolumes?: string[];
      includeVolumes?: string[];
    },
  ) {
    super.init(data);
    if (data?.vmName) {
      this.setVm(data.vmName);
    }
    if (data?.snapshotName) {
      this.setSnapshotName(data.snapshotName);
    }
    if (data?.includeVolumes) {
      this.setIncludedVolumes(data.includeVolumes);
    }
    if (data?.excludeVolumes) {
      this.setExcludedVolumes(data.excludeVolumes);
    }
    return this;
  }

  setVm = (vmName: string) => {
    this.ensurePath('spec');
    this.data.spec.target = {
      apiGroup: VirtualMachineModel.apiGroup,
      kind: VirtualMachineModel.kind,
      name: vmName,
    };
    return this;
  };

  setSnapshotName = (snapshotName: string) => {
    this.ensurePath('spec');
    this.data.spec.virtualMachineSnapshotName = snapshotName;
    return this;
  };

  setIncludedVolumes = (volumes: string[]) => {
    this.ensurePath('spec');
    this.data.spec.includeVolumes = volumes;
    return this;
  };

  setExcludedVolumes = (volumes: string[]) => {
    this.ensurePath('spec');
    this.data.spec.excludeVolumes = volumes;
    return this;
  };

  getVmName = () => getVmRestoreVmName(this.data);
}
