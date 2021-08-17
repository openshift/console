import { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src';
import { TemplateModel } from '../console-internal/models';
import { TemplateKind } from '../console-internal/module/k8s';
import {
  VirtualMachineImportModel,
  VirtualMachineInstanceModel,
  VirtualMachineModel,
} from '../models';
import { VMIKind, VMKind } from '../types/vm';
import { VMImportKind } from '../types/vm-import/ovirt/vm-import';

export const isVM = (entity: K8sResourceCommon): entity is VMKind =>
  entity?.kind === VirtualMachineModel.kind;

export const isTemplate = (entity: K8sResourceCommon): entity is TemplateKind =>
  entity?.kind === TemplateModel.kind;

export const isVMI = (entity: K8sResourceCommon): entity is VMIKind =>
  entity?.kind === VirtualMachineInstanceModel.kind;

export const isVMImport = (entity: K8sResourceCommon): entity is VMImportKind =>
  entity?.kind === VirtualMachineImportModel.kind;
