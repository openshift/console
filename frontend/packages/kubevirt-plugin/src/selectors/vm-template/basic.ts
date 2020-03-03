import { TemplateKind } from '@console/internal/module/k8s';
import { VMKind } from '../../types/vm';
import { VirtualMachineModel } from '../../models';

export const selectVM = (vmTemplate: TemplateKind): VMKind =>
  vmTemplate && vmTemplate.objects
    ? vmTemplate.objects.find((obj) => obj.kind === VirtualMachineModel.kind)
    : null;
