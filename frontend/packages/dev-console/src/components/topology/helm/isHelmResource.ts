import { Model } from '@patternfly/react-topology';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { OdcNodeModel } from '../topology-types';

export const isHelmResource = (resource: K8sResourceKind): boolean => {
  return resource?.metadata?.labels?.['app.kubernetes.io/managed-by'] === 'Helm';
};

export const isHelmResourceInModel = (resource: K8sResourceKind, model: Model): boolean => {
  if (!isHelmResource(resource)) {
    return false;
  }
  return !!model.nodes.find((node) => {
    return (node as OdcNodeModel).resource?.metadata?.uid === resource?.metadata?.uid;
  });
};
