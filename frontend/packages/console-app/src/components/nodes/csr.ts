import { fromBER } from 'asn1js';
import { Base64 } from 'js-base64';
import * as _ from 'lodash';
import { CertificationRequest } from 'pkijs';
import { stringToArrayBuffer, fromBase64 } from 'pvutils';
import {
  NodeKind,
  CertificateSigningRequestKind,
  K8sResourceCommon,
  NodeCertificateSigningRequestKind,
} from '@console/internal/module/k8s';

export const isCSRResource = (obj: K8sResourceCommon): obj is CertificateSigningRequestKind =>
  obj.kind === 'CertificateSigningRequest';

const getNodeCSRs = (
  csrs: CertificateSigningRequestKind[],
  username: string,
  client: boolean,
): CertificateSigningRequestKind[] =>
  csrs
    .filter(
      (csr) =>
        csr.spec.username === username &&
        csr.spec.usages.some((u) => u === (client ? 'client auth' : 'server auth')),
    )
    .sort(
      (a, b) =>
        new Date(b.metadata.creationTimestamp).getTime() -
        new Date(a.metadata.creationTimestamp).getTime(),
    );

const isCSRPending = (csr: CertificateSigningRequestKind): boolean =>
  !csr.status?.conditions?.some((c) => ['Approved', 'Denied'].includes(c.type));

export const getNodeClientCSRs = (
  csrs: CertificateSigningRequestKind[] = [],
): NodeCertificateSigningRequestKind[] => {
  const nodeCSRs = getNodeCSRs(
    csrs,
    'system:serviceaccount:openshift-machine-config-operator:node-bootstrapper',
    true,
  )
    .map<NodeCertificateSigningRequestKind>((csr) => {
      const request = Base64.decode(csr.spec.request);
      const req = request.replace(/(-----(BEGIN|END) CERTIFICATE REQUEST-----|\n)/g, '');
      const asn1 = fromBER(stringToArrayBuffer(fromBase64(req)));
      const pkcs10 = new CertificationRequest({ schema: asn1.result });
      // '2.5.4.3' is commonName code
      const commonName = pkcs10.subject.typesAndValues.find(({ type }) => type === '2.5.4.3');
      return {
        ...csr,
        metadata: {
          ...csr.metadata,
          name: commonName.value.valueBlock.value.replace('system:node:', ''),
          originalName: csr.metadata.name,
        },
      };
    })
    .sort(
      (a, b) =>
        new Date(b.metadata.creationTimestamp).getTime() -
        new Date(a.metadata.creationTimestamp).getTime(),
    );

  const grouped = _.groupBy(nodeCSRs, (csr) => csr.metadata.name);

  return Object.keys(grouped).reduce((acc, key) => {
    const csr = grouped[key][0];
    if (isCSRPending(csr)) {
      acc.push(csr);
    }
    return acc;
  }, []);
};
export const getNodeServerCSR = (
  csrs: CertificateSigningRequestKind[] = [],
  node: NodeKind,
): CertificateSigningRequestKind => {
  const nodeCSRs = getNodeCSRs(csrs, `system:node:${node.metadata.name}`, false);
  if (!nodeCSRs.length || !isCSRPending(nodeCSRs[0])) {
    return null;
  }
  return nodeCSRs[0];
};
