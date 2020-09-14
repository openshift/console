import { K8sResourceKind } from '@console/internal/module/k8s';

export const isHelmResource = (resource: K8sResourceKind): boolean => {
  return resource?.metadata?.labels?.['app.kubernetes.io/managed-by'] === 'Helm';
};
