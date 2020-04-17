import { K8sKind } from '@console/internal/module/k8s';
import { TemplateModel } from '@console/internal/models';
import { VMKind } from '../../types/vm';
import { VMGenericLikeEntityKind } from '../../types/vmLike';
import { VirtualMachineInstanceModel, VirtualMachineModel } from '../../models';
import { selectVM } from '../vm-template/basic';
import { isVM, isVMI } from '../check-type';

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
