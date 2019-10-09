import { NodeKind, K8sResourceKind } from '@console/internal/module/k8s';
import { nodeStatus } from '@console/app/src/status/node';
import { StatusProps } from '../components/types';
import { getNodeMaintenanceStatus } from './node-maintenance-status';

type BareMetalNodeStatusProps = {
  node: NodeKind;
  nodeMaintenance: K8sResourceKind;
};

export const bareMetalNodeStatus = ({
  node,
  nodeMaintenance,
}: BareMetalNodeStatusProps): StatusProps =>
  getNodeMaintenanceStatus(nodeMaintenance, node) || { status: nodeStatus(node), node };
