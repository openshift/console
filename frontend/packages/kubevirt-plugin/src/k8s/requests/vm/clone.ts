import { k8sCreate, K8sResourceKind } from '@console/internal/module/k8s';
import { stopVM } from './actions';
import { VMKind } from '../../../types/vm';
import { VirtualMachineModel } from '../../../models';
import { CloneTo, VMClone } from '../../objects/vm/vm/vm-clone';
import { isVMRunning } from '../../../selectors/vm';

type CloneFrom = {
  vm: VMKind;
  persistentVolumeClaims: K8sResourceKind[];
  dataVolumes: K8sResourceKind[];
};

export const cloneVM = async (
  { vm, persistentVolumeClaims, dataVolumes }: CloneFrom,
  cloneTo: CloneTo,
) => {
  if (isVMRunning(vm)) {
    await stopVM(vm);
  }

  const vmClone = new VMClone(vm, cloneTo)
    .withClonedPVCs(persistentVolumeClaims)
    .withClonedDataVolumes(dataVolumes)
    .build();

  return k8sCreate(VirtualMachineModel, vmClone);
};
