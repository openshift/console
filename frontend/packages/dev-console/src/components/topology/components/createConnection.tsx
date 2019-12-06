import { Node } from '@console/topology';
import { createTopologyResourceConnection } from '../topology-utils';

export const createConnection = (
  sourceNode: Node,
  targetNode: Node,
  replaceTargetNode: Node = null,
  serviceBindingFlag: boolean,
): Promise<any> => {
  return createTopologyResourceConnection(
    sourceNode.getData(),
    targetNode.getData(),
    replaceTargetNode ? replaceTargetNode.getData() : null,
    serviceBindingFlag,
  );
};
