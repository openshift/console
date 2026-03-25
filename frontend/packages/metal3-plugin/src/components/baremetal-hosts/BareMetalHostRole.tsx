import type { FC } from 'react';
import type { MachineKind, NodeKind } from '@console/internal/module/k8s';
import { DASH, getNodeRoles, getMachineRole } from '@console/shared';

type BareMetalHostRoleProps = {
  machine?: MachineKind;
  node?: NodeKind;
};

const BareMetalHostRole: FC<BareMetalHostRoleProps> = ({ machine, node }) => (
  <>{getNodeRoles(node).sort().join(', ') || getMachineRole(machine) || DASH}</>
);

export default BareMetalHostRole;
