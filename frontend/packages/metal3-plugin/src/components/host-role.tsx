import { getMachineRole, DASH } from '@console/shared';
import { MachineKind } from '@console/internal/module/k8s';

type BaremetalHostRoleProps = {
  machine: MachineKind;
};
export const BaremetalHostRole: React.FC<BaremetalHostRoleProps> = ({ machine }) =>
  getMachineRole(machine) || DASH;
