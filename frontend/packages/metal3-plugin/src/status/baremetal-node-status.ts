import { nodeStatus } from '@console/app/src/status/node';
import type { NodeKind, K8sResourceKind } from '@console/internal/module/k8s';
import type { StatusProps } from '../components/types';
import type { CertificateSigningRequestKind } from '../types';
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
