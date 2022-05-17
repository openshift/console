import { K8sKind } from '@console/internal/module/k8s';
import { useFlag } from '@console/shared/src/hooks/flag';
import {
  NODE_MAINTENANCE_FLAG,
  NODE_MAINTENANCE_KV_ALPHA_FLAG,
  NODE_MAINTENANCE_KV_BETA_FLAG,
} from '../features';
import {
  NodeMaintenanceModel,
  NodeMaintenanceKubevirtBetaModel,
  NodeMaintenanceKubevirtAlphaModel,
} from '../models';

export const useMaintenanceCapability = (): [boolean, K8sKind] => {
  const hasNodeMaintenanceCapability = useFlag(NODE_MAINTENANCE_FLAG);
  const hasNodeMaintenanceKvAlphaCapability = useFlag(NODE_MAINTENANCE_KV_ALPHA_FLAG);
  const hasNodeMaintenanceKvBetaCapability = useFlag(NODE_MAINTENANCE_KV_BETA_FLAG);

  const available =
    hasNodeMaintenanceCapability ||
    hasNodeMaintenanceKvAlphaCapability ||
    hasNodeMaintenanceKvBetaCapability;
  let model: K8sKind;
  if (available) {
    if (hasNodeMaintenanceCapability) {
      model = NodeMaintenanceModel;
    } else if (hasNodeMaintenanceKvBetaCapability) {
      model = NodeMaintenanceKubevirtBetaModel;
    } else {
      model = NodeMaintenanceKubevirtAlphaModel;
    }
  }

  return [available, model];
};
