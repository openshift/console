import { Node } from '@patternfly/react-topology';
import { OdcNodeModel, TopologyDataObject } from '@console/topology/src/topology-types';
import { VMIKind } from '../kubevirt-dependencies/types/vmi';
import { VMStatusBundle } from '../kubevirt-dependencies/utils/statuses/vm/types';

export interface VMNodeData {
  kind: string;
  vmi: VMIKind;
  vmStatusBundle: VMStatusBundle;
  osImage: string;
}

export type VMNode = Node<OdcNodeModel, TopologyDataObject<VMNodeData>>;
