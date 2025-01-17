import { TemplateKind } from '@console/internal/module/k8s';
import { VirtualMachineModel } from '../../models';
import { VMKind } from '../../types/vm';

export const selectVM = (vmTemplate: TemplateKind): VMKind =>
  vmTemplate && vmTemplate.objects
    ? vmTemplate.objects.find((obj) => obj.kind === VirtualMachineModel.kind)
    : null;
