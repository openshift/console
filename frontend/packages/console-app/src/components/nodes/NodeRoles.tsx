import type { FC } from 'react';
import type { NodeKind } from '@console/internal/module/k8s';
import { DASH } from '@console/shared/src/constants/ui';
import { getNodeRoles } from '@console/shared/src/selectors/node';

type NodeRolesProps = {
  node?: NodeKind;
};

const NodeRoles: FC<NodeRolesProps> = ({ node }) => (
  <>{getNodeRoles(node).sort().join(', ') || DASH}</>
);

export default NodeRoles;
