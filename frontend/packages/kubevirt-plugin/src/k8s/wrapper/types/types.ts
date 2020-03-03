import { K8sResourceKind } from '@console/internal/module/k8s';

export interface K8sResourceKindMethods {
  getName: () => string;
  getLabels: (
    defaultValue: K8sResourceKind['metadata']['labels'],
  ) => K8sResourceKind['metadata']['labels'];
  hasLabel: (label: string) => boolean;
}
