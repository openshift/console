import * as React from 'react';
import { Status, SecondaryStatus, getNodeSecondaryStatus } from '@console/shared';
import { NodeKind } from '@console/internal/module/k8s';
import { nodeStatus } from '../../status/node';

type NodeStatusProps = {
  node: NodeKind;
};

const NodeStatus: React.FC<NodeStatusProps> = ({ node }) => (
  <>
    <Status status={nodeStatus(node)} />
    <SecondaryStatus status={getNodeSecondaryStatus(node)} />
  </>
);
export default NodeStatus;
