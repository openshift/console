import { K8sResourceCommon, TemplateKind } from '@console/internal/module/k8s';
import { TemplateModel } from '@console/internal/models';
import { VMImportKind } from '../types/vm-import/ovirt/vm-import';
import { VMIKind, VMKind } from '../types/vm';
import {
  VirtualMachineImportModel,
  VirtualMachineInstanceModel,
  VirtualMachineModel,
} from '../models';

export const isVM = (entity: K8sResourceCommon): entity is VMKind =>
  entity?.kind === VirtualMachineModel.kind;

export const isTemplate = (entity: K8sResourceCommon): entity is TemplateKind =>
  entity?.kind === TemplateModel.kind;

export const isVMI = (entity: K8sResourceCommon): entity is VMIKind =>
  entity?.kind === VirtualMachineInstanceModel.kind;

export const isVMImport = (entity: K8sResourceCommon): entity is VMImportKind =>
  entity?.kind === VirtualMachineImportModel.kind;
