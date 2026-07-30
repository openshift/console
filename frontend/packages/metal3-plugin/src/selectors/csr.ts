import type { NodeKind } from '@console/internal/module/k8s';
import type { CertificateSigningRequestKind } from '../types/host';

const getNodeCSRs = (
  csrs: CertificateSigningRequestKind[],
  username: string,
): CertificateSigningRequestKind[] =>
  csrs
    .filter((csr) => csr.spec.username === username)
    .sort(
      (a, b) =>
        new Date(b.metadata.creationTimestamp).getTime() -
        new Date(a.metadata.creationTimestamp).getTime(),
    );

const isCSRPending = (csr: CertificateSigningRequestKind): boolean =>
  !csr.status?.conditions?.some((c) => ['Approved', 'Denied'].includes(c.type));

export const getNodeServerCSR = (
  csrs: CertificateSigningRequestKind[] = [],
  node: NodeKind,
): CertificateSigningRequestKind => {
  const nodeCSRs = getNodeCSRs(csrs, `system:node:${node.metadata.name}`);
  if (!nodeCSRs.length || !isCSRPending(nodeCSRs[0])) {
    return null;
  }
  return nodeCSRs[0];
};
