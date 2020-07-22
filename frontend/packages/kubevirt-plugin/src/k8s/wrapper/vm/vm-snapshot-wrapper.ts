import { K8sResourceWrapper } from '../common/k8s-resource-wrapper';
import { VMSnapshot } from '../../../types';
import { VirtualMachineModel, VirtualMachineSnapshotModel } from '../../../models';
import { K8sInitAddon } from '../common/util/k8s-mixin';
import { getVmSnapshotVmName } from '../../../selectors/snapshot/snapshot';
import { apiVersionForModel } from '@console/internal/module/k8s';

export class VMSnapshotWrapper extends K8sResourceWrapper<VMSnapshot, VMSnapshotWrapper> {
  constructor(snapshot?: VMSnapshot | VMSnapshotWrapper | any, copy = false) {
    super(VirtualMachineSnapshotModel, snapshot, copy);
  }

  init(data: K8sInitAddon & { vmName: string }) {
    super.init(data);
    if (data?.vmName) {
      this.setVm(data.vmName);
    }
    return this;
  }

  setVm = (vmName: string) => {
    this.ensurePath('spec');
    this.data.spec.source = {
      apiGroup: apiVersionForModel(VirtualMachineModel),
      kind: VirtualMachineModel.kind,
      name: vmName,
    };
    return this;
  };

  getVmName = () => getVmSnapshotVmName(this.data);
}
