import {
  OdcNodeModel,
  TopologyDataObject,
} from '@console/dev-console/src/components/topology/topology-types';
import { Node } from '@patternfly/react-topology';
import { VMIKind } from '../types/vm';
import { VMStatusBundle } from '../statuses/vm/types';

export interface VMNodeData {
  url: string;
  kind: string;
  vmi: VMIKind;
  vmStatusBundle: VMStatusBundle;
  osImage: string;
}

export type VMNode = Node<OdcNodeModel, TopologyDataObject<VMNodeData>>;
