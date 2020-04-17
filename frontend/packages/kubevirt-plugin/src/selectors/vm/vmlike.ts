import { K8sKind, K8sResourceCommon, TemplateKind } from '@console/internal/module/k8s';
import { TemplateModel } from '@console/internal/models';
import { VMKind, VMIKind } from '../../types/vm';
import { VMGenericLikeEntityKind } from '../../types/vmLike';
import { VirtualMachineModel, VirtualMachineInstanceModel } from '../../models';
import { selectVM } from '../vm-template/basic';

// TODO move these to ../check-type.ts
export const isVM = (entity: K8sResourceCommon): entity is VMKind =>
  (entity as any)?.kind === VirtualMachineModel.kind;

export const isTemplate = (entity: K8sResourceCommon): entity is TemplateKind =>
  (entity as any)?.kind === TemplateModel.kind;

export const isVMI = (entity: K8sResourceCommon): entity is VMIKind =>
  entity && entity.kind === VirtualMachineInstanceModel.kind;

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
