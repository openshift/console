import { Node } from '@patternfly/react-topology';
import { OdcNodeModel, TopologyDataObject } from '@console/topology/src/topology-types';
import { VMStatusBundle } from '../statuses/vm/types';
import { VMIKind } from '../types/vm';

export interface VMNodeData {
  kind: string;
  vmi: VMIKind;
  vmStatusBundle: VMStatusBundle;
  osImage: string;
}

export type VMNode = Node<OdcNodeModel, TopologyDataObject<VMNodeData>>;
