import { K8sResourceCommon } from '@console/dynamic-plugin-sdk';
import { VirtualMachineInstanceModel, VirtualMachineModel } from '../models';
import { VMKind } from '../types/vm';
import { VMIKind } from '../types/vmi';

export const isVM = (entity: K8sResourceCommon): entity is VMKind =>
  entity?.kind === VirtualMachineModel.kind;

export const isVMI = (entity: K8sResourceCommon): entity is VMIKind =>
  entity?.kind === VirtualMachineInstanceModel.kind;
