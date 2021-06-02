import * as React from 'react';
import { NodeKind } from '@console/internal/module/k8s';
import { DASH, getNodeRoles } from '@console/shared';

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
