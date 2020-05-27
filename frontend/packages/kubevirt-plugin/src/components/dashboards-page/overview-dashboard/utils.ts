import { TemplateModel } from '@console/internal/models';

import { VirtualMachineModel, VirtualMachineInstanceModel } from '../../../models';

export const diskImportKindMapping = {
  [VirtualMachineModel.kind]: VirtualMachineModel,
  [VirtualMachineInstanceModel.kind]: VirtualMachineInstanceModel,
  [TemplateModel.kind]: TemplateModel,
};
