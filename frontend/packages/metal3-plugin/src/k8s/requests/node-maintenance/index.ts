import { k8sCreate, K8sKind } from '@console/internal/module/k8s';
import { buildNodeMaintenance } from '../../objects/node-maintenance';

export const startNodeMaintenance = (nodeName: string, reason: string, model: K8sKind) => {
  return k8sCreate(model, buildNodeMaintenance({ nodeName, reason, model }));
};
