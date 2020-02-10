import { K8sResourceKind } from '@console/internal/module/k8s';

export const flattenResources = (resources: { [kind: string]: { data: K8sResourceKind[] } }) =>
  Object.keys(resources).reduce(
    (acc, kind) => [...acc, ...resources[kind].data.map((res) => ({ ...res, kind }))],
    [],
  );
