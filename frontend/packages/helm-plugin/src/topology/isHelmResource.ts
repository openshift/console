import { Model } from '@patternfly/react-topology';
import { isHelmResource } from '@console/dynamic-plugin-sdk';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { OdcNodeModel } from '@console/topology/src/topology-types';

export const isHelmResourceInModel = (resource: K8sResourceKind, model: Model): boolean => {
  if (!isHelmResource(resource)) {
    return false;
  }
  return !!model.nodes.find((node) => {
    return (node as OdcNodeModel).resource?.metadata?.uid === resource?.metadata?.uid;
  });
};
