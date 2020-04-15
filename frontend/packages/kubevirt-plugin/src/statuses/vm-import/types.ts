import { V2VVMImportStatus } from '../../constants/v2v-import/ovirt/v2v-vm-import-status';
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';

export enum VirtualMachineImportConditionType {
  Succeeded = 'Succeeded',
  Validating = 'Validating',
  MappingRulesChecking = 'MappingRulesChecking',
  Processing = 'Processing',
}

export type VMImportStatus = {
  status: V2VVMImportStatus;
  message?: string;
  detailedMessage?: string;
  progress?: number;
  vmImport?: VMImportKind;
};
