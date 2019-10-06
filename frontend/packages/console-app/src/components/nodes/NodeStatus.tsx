import * as React from 'react';
import { Status, isNodeUnschedulable } from '@console/shared';
import { NodeKind } from '@console/internal/module/k8s';
import { nodeStatus } from '../../status/node';

type NodeStatusProps = {
  node: NodeKind;
};

const NodeStatus: React.FC<NodeStatusProps> = ({ node }) => (
  <>
    <Status status={nodeStatus(node)} />
    {isNodeUnschedulable(node) && <small className="text-muted">Scheduling Disabled</small>}
  </>
);
export default NodeStatus;
