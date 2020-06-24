import { K8sResourceKind } from '@console/internal/module/k8s';
import { Model } from '@console/topology/src/types';
import { getTopologyResourceObject } from '@console/dev-console/src/components/topology';
import { TYPE_VIRTUAL_MACHINE } from './components/const';

export const isKubevirtResource = (resource: K8sResourceKind, model: Model): boolean => {
  if (!model?.nodes?.length) {
    return false;
  }
  return !!model.nodes.find((node) => {
    if (node.type !== TYPE_VIRTUAL_MACHINE) {
      return false;
    }
    const nodeResource = getTopologyResourceObject(node.data);
    return nodeResource && nodeResource.metadata?.uid === resource?.metadata?.uid;
  });
};
