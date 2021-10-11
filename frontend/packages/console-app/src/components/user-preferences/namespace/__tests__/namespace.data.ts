import { K8sResourceKind } from '@console/internal/module/k8s';

export const mockNamespaces: K8sResourceKind[] = [
  { metadata: { name: 'ns-0' } },
  { metadata: { name: 'ns-1' } },
  { metadata: { name: 'ns-2' } },
  { metadata: { name: 'ns-3' } },
  { metadata: { name: 'ns-4' } },
];
