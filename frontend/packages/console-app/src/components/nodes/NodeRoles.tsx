import * as React from 'react';
import { NodeKind } from '@console/internal/module/k8s';
import { DASH } from '@console/shared/src/constants/ui';
import { getNodeRoles } from '@console/shared/src/selectors/node';

type NodeRolesProps = {
  node?: NodeKind;
};

const NodeRoles: React.FC<NodeRolesProps> = ({ node }) => (
  <>{getNodeRoles(node).sort().join(', ') || DASH}</>
);

export default NodeRoles;
