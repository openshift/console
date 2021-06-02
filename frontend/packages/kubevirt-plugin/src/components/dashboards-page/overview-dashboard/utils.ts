import { TemplateModel } from '@console/internal/models';
import { VirtualMachineInstanceModel, VirtualMachineModel } from '../../../models';

export const diskImportKindMapping = {
  [VirtualMachineModel.kind]: VirtualMachineModel,
  [VirtualMachineInstanceModel.kind]: VirtualMachineInstanceModel,
  [TemplateModel.kind]: TemplateModel,
};
