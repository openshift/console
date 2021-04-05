import { V2VVMImportStatus } from '../../constants/v2v-import/ovirt/v2v-vm-import-status';
import { StatusBundle } from '../../types/status-bundle';
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';

export enum VirtualMachineImportConditionType {
  Succeeded = 'Succeeded',
  Valid = 'Valid',
  MappingRulesVerified = 'MappingRulesVerified',
  Processing = 'Processing',
}

export interface VMImportStatusBundle extends StatusBundle<V2VVMImportStatus> {
  vmImport?: VMImportKind;
}
