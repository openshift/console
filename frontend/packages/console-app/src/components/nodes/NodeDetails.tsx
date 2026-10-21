import type { FC } from 'react';
import type { NodeKind } from '@console/internal/module/k8s';
import NodeDetailsConditions from './NodeDetailsConditions';
import NodeDetailsImages from './NodeDetailsImages';
import NodeDetailsOverview from './NodeDetailsOverview';

type NodeDetailsProps = {
  obj: NodeKind;
};

const NodeDetails: FC<NodeDetailsProps> = ({ obj: node }) => (
  <>
    <NodeDetailsOverview node={node} />
    <NodeDetailsConditions node={node} />
    <NodeDetailsImages node={node} />
  </>
);

export default NodeDetails;
