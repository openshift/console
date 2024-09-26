import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s/types';

export interface K8sResourceKindMethods {
  getModel: () => K8sKind;
  getName: () => string;
  getCreationTimestamp: () => string;
  getLabels: (
    defaultValue: K8sResourceKind['metadata']['labels'],
  ) => K8sResourceKind['metadata']['labels'];
  hasLabel: (label: string) => boolean;
}
