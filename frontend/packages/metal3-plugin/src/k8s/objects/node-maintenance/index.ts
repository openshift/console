import { apiVersionForModel } from '@console/internal/module/k8s';
import { NodeMaintenanceModel } from '../../../models';

export const buildNodeMaintenance = ({
  generateName,
  nodeName,
  reason,
}: {
  nodeName: string;
  generateName?: string;
  reason?: string;
}) => ({
  apiVersion: apiVersionForModel(NodeMaintenanceModel),
  kind: NodeMaintenanceModel.kind,
  metadata: {
    generateName: `${generateName || nodeName}-`,
  },
  spec: {
    nodeName,
    reason,
  },
});
