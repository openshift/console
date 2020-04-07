import { VMGenericLikeEntityKind } from '../../types/vmLike';
import { VirtualMachineInstanceModel } from '../../models';
import { VMIKind } from '../../types';
import { asVM } from '../vm/vmlike';
import { getVMINodeSelector, getVMITolerations, getVMIAffinity } from '../vmi';
import { getNodeSelector, getTolerations, getAffinity } from '../vm/selectors';

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
