import { VirtualMachineModel, VirtualMachineSnapshotModel } from '../../../models';
import { getVmSnapshotVmName } from '../../../selectors/snapshot/snapshot';
import { VMSnapshot } from '../../../types';
import { K8sResourceWrapper } from '../common/k8s-resource-wrapper';
import { K8sInitAddon } from '../common/util/k8s-mixin';

export class VMSnapshotWrapper extends K8sResourceWrapper<VMSnapshot, VMSnapshotWrapper> {
  constructor(snapshot?: VMSnapshot | VMSnapshotWrapper | any, copy = false) {
    super(VirtualMachineSnapshotModel, snapshot, copy);
  }

  init(data: K8sInitAddon & { vmName: string; description?: string }) {
    super.init(data);
    if (data?.vmName) {
      this.setVm(data.vmName);
    }
    if (data?.description) {
      this.addAnotation('description', data.description);
    }
    return this;
  }

  setVm = (vmName: string) => {
    this.ensurePath('spec');
    this.data.spec.source = {
      apiGroup: VirtualMachineModel.apiGroup,
      kind: VirtualMachineModel.kind,
      name: vmName,
    };
    return this;
  };

  getVmName = () => getVmSnapshotVmName(this.data);
}
