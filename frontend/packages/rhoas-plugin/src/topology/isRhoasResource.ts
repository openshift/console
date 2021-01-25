import { Model } from '@patternfly/react-topology';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ManagedKafkaConnectionModel } from '../models';

export const isRhoasResource = (resource: K8sResourceKind, model: Model): boolean => {
  return isRhoasResourceCheck(resource);
};

export const isRhoasResourceCheck = (resource: K8sResourceKind): boolean =>
  resource?.kind === ManagedKafkaConnectionModel.kind
