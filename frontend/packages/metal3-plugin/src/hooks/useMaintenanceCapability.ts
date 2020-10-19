import { useFlag } from '@console/shared/src/hooks/flag';
import { K8sKind } from '@console/internal/module/k8s';
import { NODE_MAINTENANCE_FLAG, NODE_MAINTENANCE_OLD_FLAG } from '../features';
import { NodeMaintenanceModel, NodeMaintenanceOldModel } from '../models';

export const useMaintenanceCapability = (): [boolean, K8sKind] => {
  const hasNodeMaintenanceCapability = useFlag(NODE_MAINTENANCE_FLAG);
  const hasNodeMaintenanceOldCapability = useFlag(NODE_MAINTENANCE_OLD_FLAG);

  return [
    hasNodeMaintenanceCapability || hasNodeMaintenanceOldCapability,
    hasNodeMaintenanceCapability ? NodeMaintenanceModel : NodeMaintenanceOldModel,
  ];
};
