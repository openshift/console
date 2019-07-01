import { k8sKill, K8sResourceKind } from '@console/internal/module/k8s';
import { VirtualMachineInstanceMigrationModel } from '../../../models';

export const cancelMigration = async (vmim: K8sResourceKind) =>
  k8sKill(VirtualMachineInstanceMigrationModel, vmim);
