import { k8sCreate } from '@console/internal/module/k8s';
import { buildNodeMaintenance } from '../../objects/node-maintenance';
import { NodeMaintenanceModel } from '../../../models';

export const startNodeMaintenance = (nodeName: string, reason: string) => {
  return k8sCreate(NodeMaintenanceModel, buildNodeMaintenance({ nodeName, reason }));
};
