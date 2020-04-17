import { K8sResourceCommon } from '@console/internal/module/k8s';
import { VMImportKind } from '../types/vm-import/ovirt/vm-import';
import { VirtualMachineImportModel } from '../models';

export const isVMImport = (entity: K8sResourceCommon): entity is VMImportKind =>
  (entity as any)?.kind === VirtualMachineImportModel.kind;
