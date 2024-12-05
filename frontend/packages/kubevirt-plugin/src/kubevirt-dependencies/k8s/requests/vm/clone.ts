import {
  k8sCreate,
  K8sResourceKind,
  PersistentVolumeClaimKind,
} from '@console/internal/module/k8s';
import { VirtualMachineModel } from '../../../models';
import { getKubevirtAvailableModel } from '../../../models/kubevirtReferenceForModel';
import { isVMExpectedRunning } from '../../../selectors/vm/selectors';
import { VMKind } from '../../../types/vm';
import { VMIKind } from '../../../types/vmi';
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
  pvcs,
) => {
  if (isVMExpectedRunning(vm, vmi)) {
    await stopVM(vm);
  }

  const vmClone = new VMClone(vm, cloneTo)
    .withClonedPVCs(persistentVolumeClaims)
    .withClonedDataVolumes(dataVolumes, pvcs)
    .build();

  return k8sCreate(getKubevirtAvailableModel(VirtualMachineModel), vmClone);
};
