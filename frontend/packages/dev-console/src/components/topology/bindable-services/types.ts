import { K8sResourceCommon } from '@console/internal/module/k8s';

export type BindableServiceGVK = {
  group: string;
  version: string;
  kind: string;
};

export type BindableServicesKind = K8sResourceCommon & {
  status: BindableServiceGVK[];
};
