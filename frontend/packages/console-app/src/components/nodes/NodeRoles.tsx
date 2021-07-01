import * as React from 'react';
import { DASH } from '@console/dynamic-plugin-sdk';
import { NodeKind } from '@console/internal/module/k8s';
import { getNodeRoles } from '@console/shared';

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
