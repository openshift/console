import { K8sResourceKind } from '@console/internal/module/k8s';

export type BindableServiceGVK = {
  group: string;
  version: string;
  kind: string;
};

export type BindableServicesKind = {
  metadata: {
    name: string;
  };
  spec: BindableServiceGVK[];
} & K8sResourceKind;
