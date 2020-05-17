import { VMIKind } from '../types/vm';
import { VMStatusBundle } from '../statuses/vm/types';
import { TopologyDataObject } from '@console/dev-console/src/components/topology/topology-types';
import { NodeModel, Node } from '@console/topology/src/types';

export interface VMNodeData {
  url: string;
  kind: string;
  vmi: VMIKind;
  vmStatusBundle: VMStatusBundle;
  osImage: string;
}

export type VMNode = Node<NodeModel, TopologyDataObject<VMNodeData>>;
