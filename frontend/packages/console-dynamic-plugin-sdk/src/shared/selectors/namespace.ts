import { K8sResourceKind } from '@console/internal/module/k8s';

export const getRequester = (obj: K8sResourceKind): string =>
  obj.metadata.annotations?.['openshift.io/requester'];
export const getDescription = (obj: K8sResourceKind): string =>
  obj.metadata.annotations?.['openshift.io/description'];
