import { getMachineRole, DASH } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';

type BaremetalHostRoleProps = {
  machine: K8sResourceKind;
};
export const BaremetalHostRole: React.FC<BaremetalHostRoleProps> = ({ machine }) =>
  getMachineRole(machine) || DASH;
