import { NodeKind, K8sResourceKind } from '@console/internal/module/k8s';
import { nodeStatus } from '@console/app/src/status/node';
import { isNodeUnschedulable } from '@console/shared/src/selectors/node';
import { StatusProps } from '../components/types';
import { isHostPoweredOn, hasPowerManagement } from '../selectors';
import { BareMetalHostKind, CertificateSigningRequestKind } from '../types';
import { getNodeMaintenanceStatus } from './node-maintenance-status';

export const NODE_STATUS_SERVER_CSR = 'serverCSR';

type BareMetalNodeStatusProps = {
  node: NodeKind;
  nodeMaintenance?: K8sResourceKind;
  csr: CertificateSigningRequestKind;
};

const getCSRStatus = (csr: CertificateSigningRequestKind, node: NodeKind) =>
  csr
    ? {
        status: NODE_STATUS_SERVER_CSR,
        title: nodeStatus(node),
      }
    : null;

export const bareMetalNodeStatus = ({
  node,
  nodeMaintenance,
  csr,
}: BareMetalNodeStatusProps): StatusProps =>
  getCSRStatus(csr, node) ||
  getNodeMaintenanceStatus(nodeMaintenance) || { status: nodeStatus(node) };

type BareMetalNodeSecondaryStatusProps = {
  node: NodeKind;
  host?: BareMetalHostKind;
  nodeMaintenance?: K8sResourceKind;
};

export const baremetalNodeSecondaryStatus = ({
  node,
  host,
  nodeMaintenance,
}: BareMetalNodeSecondaryStatusProps): string[] => {
  const states = [];
  if (!nodeMaintenance && isNodeUnschedulable(node)) {
    states.push('Scheduling disabled');
  }
  // show host power status only if there is actual host associated to node
  if (host && hasPowerManagement(host) && !isHostPoweredOn(host)) {
    states.push('Host is powered off');
  }
  return states;
};
