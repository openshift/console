import { TemplateModel } from '@console/internal/models';
import { K8sKind } from '@console/internal/module/k8s';
import { VirtualMachineInstanceModel, VirtualMachineModel } from '../../models';
import { VMKind } from '../../types/vm';
import { VMGenericLikeEntityKind } from '../../types/vmLike';
import { isVM, isVMI } from '../check-type';
import { selectVM } from '../vm-template/basic';

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
