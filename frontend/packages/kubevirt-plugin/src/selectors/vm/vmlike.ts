import { TemplateModel } from '@console/internal/models';
import { K8sKind } from '@console/internal/module/k8s';
import { VirtualMachineInstanceModel, VirtualMachineModel } from '../../models';
import { getKubevirtAvailableModel } from '../../models/kubevirtReferenceForModel';
import { VMGenericLikeEntityKind } from '../../types/vmLike';
import { isVM, isVMI } from '../check-type';

export const getVMLikeModel = (vmLikeEntity: VMGenericLikeEntityKind): K8sKind =>
  isVM(vmLikeEntity)
    ? getKubevirtAvailableModel(VirtualMachineModel)
    : isVMI(vmLikeEntity)
    ? getKubevirtAvailableModel(VirtualMachineInstanceModel)
    : TemplateModel;
