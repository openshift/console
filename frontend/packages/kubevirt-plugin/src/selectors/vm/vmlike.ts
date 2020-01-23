import { K8sKind } from '@console/internal/module/k8s';
import { TemplateModel } from '@console/internal/models';
import { VMKind, VMIKind } from '../../types/vm';
import { VMGenericLikeEntityKind } from '../../types/vmLike';
import { VirtualMachineModel, VirtualMachineInstanceModel } from '../../models';
import { selectVM } from '../vm-template/basic';

export const isVM = (vmLikeEntity: VMGenericLikeEntityKind): vmLikeEntity is VMKind =>
  vmLikeEntity && vmLikeEntity.kind === VirtualMachineModel.kind;

export const isVMI = (vmLikeEntity: VMGenericLikeEntityKind): vmLikeEntity is VMIKind =>
  vmLikeEntity && vmLikeEntity.kind === VirtualMachineInstanceModel.kind;

export const getVMLikeModel = (vmLikeEntity: VMGenericLikeEntityKind): K8sKind =>
  isVM(vmLikeEntity)
    ? VirtualMachineModel
    : isVMI(vmLikeEntity)
    ? VirtualMachineInstanceModel
    : TemplateModel;

export const asVM = (vmLikeEntity: VMGenericLikeEntityKind): VMKind => {
  if (!vmLikeEntity || isVMI(vmLikeEntity)) {
    return null;
  }

  return isVM(vmLikeEntity) ? vmLikeEntity : selectVM(vmLikeEntity);
};
