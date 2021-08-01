import { VirtualMachineInstanceModel } from '../../models';
import { VMIKind } from '../../types';
import { VMGenericLikeEntityKind } from '../../types/vmLike';
import { getAffinity, getNodeSelector, getTolerations } from '../vm/selectors';
import { asVM } from '../vm/vm';
import { getVMIAffinity, getVMINodeSelector, getVMITolerations } from '../vmi';

export const getVMLikeTolerations = (vm: VMGenericLikeEntityKind) =>
  vm.kind === VirtualMachineInstanceModel.kind
    ? getVMITolerations(vm as VMIKind)
    : getTolerations(asVM(vm));

export const getVMLikeNodeSelector = (vm: VMGenericLikeEntityKind) =>
  vm.kind === VirtualMachineInstanceModel.kind
    ? getVMINodeSelector(vm as VMIKind)
    : getNodeSelector(asVM(vm));

export const getVMLikeAffinity = (vm: VMGenericLikeEntityKind) =>
  vm.kind === VirtualMachineInstanceModel.kind
    ? getVMIAffinity(vm as VMIKind)
    : getAffinity(asVM(vm));
