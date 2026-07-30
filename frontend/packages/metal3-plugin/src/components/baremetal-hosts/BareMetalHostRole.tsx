import type { FC } from 'react';
import type { MachineKind, NodeKind } from '@console/internal/module/k8s';
import { DASH } from '@console/shared/src/constants/ui';
import { getMachineRole } from '@console/shared/src/selectors/machine';
import { getNodeRoles } from '@console/shared/src/selectors/node';

type BareMetalHostRoleProps = {
  machine?: MachineKind;
  node?: NodeKind;
};

const BareMetalHostRole: FC<BareMetalHostRoleProps> = ({ machine, node }) => (
  <>{getNodeRoles(node).sort().join(', ') || getMachineRole(machine) || DASH}</>
);

export default BareMetalHostRole;
