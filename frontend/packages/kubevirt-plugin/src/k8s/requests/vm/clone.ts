import {
  k8sCreate,
  K8sResourceKind,
  PersistentVolumeClaimKind,
} from '@console/internal/module/k8s';
import { VirtualMachineModel } from '../../../models';
import { isVMExpectedRunning } from '../../../selectors/vm';
import { VMIKind, VMKind } from '../../../types/vm';
import { CloneTo, VMClone } from '../../helpers/vm-clone';
import { stopVM } from './actions';

type CloneFrom = {
  vm: VMKind;
  vmi: VMIKind;
  persistentVolumeClaims: PersistentVolumeClaimKind[];
  dataVolumes: K8sResourceKind[];
};

export const cloneVM = async (
  { vm, vmi, persistentVolumeClaims, dataVolumes }: CloneFrom,
  cloneTo: CloneTo,
) => {
  if (isVMExpectedRunning(vm, vmi)) {
    await stopVM(vm);
  }

  const vmClone = new VMClone(vm, cloneTo)
    .withClonedPVCs(persistentVolumeClaims)
    .withClonedDataVolumes(dataVolumes)
    .build();

  return k8sCreate(VirtualMachineModel, vmClone);
};
