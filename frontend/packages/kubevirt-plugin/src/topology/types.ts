import { OdcNodeModel, TopologyDataObject } from '@console/topology/src/topology-types';
import { Node } from '@patternfly/react-topology';
import { VMIKind } from '../types/vm';
import { VMStatusBundle } from '../statuses/vm/types';

export interface VMNodeData {
  kind: string;
  vmi: VMIKind;
  vmStatusBundle: VMStatusBundle;
  osImage: string;
}

export type VMNode = Node<OdcNodeModel, TopologyDataObject<VMNodeData>>;
