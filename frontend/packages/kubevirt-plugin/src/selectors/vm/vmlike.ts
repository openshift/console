import { K8sKind } from '@console/internal/module/k8s';
import { TemplateModel } from '@console/internal/models';
import { VMLikeEntityKind, VMKind, VMIKind } from '../../types';
import { VirtualMachineModel } from '../../models';
import { selectVM } from '../vm-template/selectors';

export const isVM = (vmLikeEntity: VMLikeEntityKind | VMIKind): vmLikeEntity is VMKind =>
  vmLikeEntity && vmLikeEntity.kind === VirtualMachineModel.kind;

export const getVMLikeModel = (vmLikeEntity: VMLikeEntityKind): K8sKind =>
  isVM(vmLikeEntity) ? VirtualMachineModel : TemplateModel;

export const asVM = (vmLikeEntity: VMLikeEntityKind): VMKind => {
  if (!vmLikeEntity) {
    return null;
  }

  return isVM(vmLikeEntity) ? vmLikeEntity : selectVM(vmLikeEntity);
};
