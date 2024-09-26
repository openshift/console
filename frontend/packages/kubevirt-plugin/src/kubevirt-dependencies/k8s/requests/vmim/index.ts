import { k8sKill, K8sResourceKind } from '@console/internal/module/k8s';
import { VirtualMachineInstanceMigrationModel } from '../../../models';
import { getKubevirtAvailableModel } from '../../../models/kubevirtReferenceForModel';

export const cancelMigration = async (vmim: K8sResourceKind) =>
  k8sKill(getKubevirtAvailableModel(VirtualMachineInstanceMigrationModel), vmim);
