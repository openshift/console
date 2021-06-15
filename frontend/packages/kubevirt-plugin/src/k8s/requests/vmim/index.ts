import { k8sKill, K8sResourceKind } from '@console/internal/module/k8s';
import { getKubevirtAvailableModel } from '../../../models/kvReferenceForModel';
import { VirtualMachineInstanceMigrationModel } from '../../../models';

export const cancelMigration = async (vmim: K8sResourceKind) =>
  k8sKill(getKubevirtAvailableModel(VirtualMachineInstanceMigrationModel), vmim);
