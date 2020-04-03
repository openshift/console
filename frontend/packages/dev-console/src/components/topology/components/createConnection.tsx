import { Node } from '@console/topology';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { createTopologyResourceConnection } from '../topology-utils';

export const createConnection = (
  sourceNode: Node,
  targetNode: Node,
  replaceTargetNode: Node = null,
  serviceBindingFlag: boolean = false,
): Promise<K8sResourceKind[] | K8sResourceKind> => {
  return createTopologyResourceConnection(
    sourceNode.getData(),
    targetNode.getData(),
    replaceTargetNode ? replaceTargetNode.getData() : null,
    serviceBindingFlag,
  );
};
