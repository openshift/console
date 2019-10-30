import { K8sResourceKind } from '@console/internal/module/k8s';

export const getInfrastructurePlatform = (infrastructure: K8sResourceKind): string =>
  infrastructure && infrastructure.status ? infrastructure.status.platform : undefined;
export const getInfrastructureAPIURL = (infrastructure: K8sResourceKind): string =>
  infrastructure && infrastructure.status ? infrastructure.status.apiServerURL : undefined;
