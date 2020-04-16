import { K8sResourceKind } from '@console/internal/module/k8s';
import { Model } from '@console/topology/src/types';
import { TYPE_HELM_WORKLOAD } from './components/const';
import { getTopologyResourceObject } from '../topology-utils';

export const isHelmResource = (resource: K8sResourceKind, model: Model): boolean => {
  if (!model?.nodes?.length) {
    return false;
  }
  return !!model.nodes.find((node) => {
    if (node.type !== TYPE_HELM_WORKLOAD) {
      return false;
    }
    const nodeResource = getTopologyResourceObject(node.data);
    return nodeResource && nodeResource.metadata?.uid === resource?.metadata?.uid;
  });
};
