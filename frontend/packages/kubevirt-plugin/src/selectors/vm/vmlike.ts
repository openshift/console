import { K8sKind, TemplateKind } from '@console/internal/module/k8s';
import { TemplateModel } from '@console/internal/models';
import { VMLikeEntityKind, VMKind } from '../../types';
import { VirtualMachineModel } from '../../models';
import { selectVM } from '../vm-template/selectors';

export const isVM = (vmLikeEntity: VMLikeEntityKind): boolean =>
  vmLikeEntity && vmLikeEntity.kind === VirtualMachineModel.kind;

export const getVMLikeModel = (vmLikeEntity: VMLikeEntityKind): K8sKind =>
  isVM(vmLikeEntity) ? VirtualMachineModel : TemplateModel;

export const asVM = (vmLikeEntity: VMLikeEntityKind): VMKind => {
  if (!vmLikeEntity) {
    return null;
  }

  if (isVM(vmLikeEntity)) {
    return vmLikeEntity as VMKind;
  }
  return selectVM(vmLikeEntity as TemplateKind);
};
