import { VMGenericLikeEntityKind } from '../../types/vmLike';
import { VirtualMachineInstanceModel } from '../../models';
import { VMIKind } from '../../types';
import { asVM } from '../vm/vmlike';
import { getVMINodeSelector, getVMITolerations } from '../vmi';
import { getNodeSelector, getTolerations } from '../vm/selectors';

export const getVMLikeTolerations = (vm: VMGenericLikeEntityKind) =>
  vm.kind === VirtualMachineInstanceModel.kind
    ? getVMITolerations(vm as VMIKind)
    : getTolerations(asVM(vm));

export const getVMLikeNodeSelector = (vm: VMGenericLikeEntityKind) =>
  vm.kind === VirtualMachineInstanceModel.kind
    ? getVMINodeSelector(vm as VMIKind)
    : getNodeSelector(asVM(vm));
