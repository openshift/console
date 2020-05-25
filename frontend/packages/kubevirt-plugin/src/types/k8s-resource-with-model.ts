import { K8sKind, K8sResourceCommon } from '@console/internal/module/k8s';

export type K8sResourceWithModel = {
  model: K8sKind;
  resource: K8sResourceCommon;
};
