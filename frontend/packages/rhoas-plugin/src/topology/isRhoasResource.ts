import { Model } from '@patternfly/react-topology';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ManagedKafkaConnectionModel } from '../models';

export const isRhoasResource = (resource: K8sResourceKind, model: Model): boolean => {
  return isRhoasResourceCheck(resource);
};

export const isRhoasResourceCheck = (resource: K8sResourceKind): boolean =>
  resource?.kind === ManagedKafkaConnectionModel.kind
// FIXME introduce proper labels to clasify groups of resources
  // resource?.metadata?.labels?.['app.kubernetes.io/managed-by'] === 'RHOAS' ||
  // resource?.metadata?.labels?.['external-service-type'] === 'RHOAS' ||

