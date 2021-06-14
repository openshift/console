import * as React from 'react';
import { NodeKind } from '@console/internal/module/k8s';
import NodeDetailsConditions from './NodeDetailsConditions';
import NodeDetailsImages from './NodeDetailsImages';
import NodeDetailsOverview from './NodeDetailsOverview';

type NodeDetailsProps = {
  obj: NodeKind;
};

const NodeDetails: React.FC<NodeDetailsProps> = ({ obj: node }) => (
  <>
    <NodeDetailsOverview node={node} />
    <NodeDetailsConditions node={node} />
    <NodeDetailsImages node={node} />
  </>
);

export default NodeDetails;
