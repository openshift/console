import { useK8sModels } from '@console/dynamic-plugin-sdk/src/lib-core';
import { getReferenceForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { K8sModel } from '@console/internal/module/k8s';
import {
  NodeMaintenanceModel,
  NodeMaintenanceKubevirtBetaModel,
  NodeMaintenanceKubevirtAlphaModel,
} from '../models';

export const useMaintenanceCapability = (): [K8sModel, boolean] => {
  const [models, loading] = useK8sModels();
  if (loading) {
    return [undefined, true];
  }
  const model =
    models[getReferenceForModel(NodeMaintenanceModel)] ||
    models[getReferenceForModel(NodeMaintenanceKubevirtBetaModel)] ||
    models[getReferenceForModel(NodeMaintenanceKubevirtAlphaModel)];

  return [model, false];
};
