import * as React from 'react';
import { DASH, getNodeRoles } from '@console/shared';
import { NodeKind } from '@console/internal/module/k8s';

type NodeRolesProps = {
  node?: NodeKind;
};

const NodeRoles: React.FC<NodeRolesProps> = ({ node }) => (
  <>
    {getNodeRoles(node)
      .sort()
      .join(', ') || DASH}
  </>
);

export default NodeRoles;
