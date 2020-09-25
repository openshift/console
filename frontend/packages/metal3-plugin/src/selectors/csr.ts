import * as _ from 'lodash';
import { Base64 } from 'js-base64';
import { CertificationRequest } from 'pkijs';
import { fromBER } from 'asn1js';
import { stringToArrayBuffer, fromBase64 } from 'pvutils';
import { NodeKind } from '@console/internal/module/k8s';

import { CertificateSigningRequestKind } from '../types';
import { CSRBundle } from '../components/types';

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

export const getNodeClientCSRs = (csrs: CertificateSigningRequestKind[] = []): CSRBundle[] => {
  const nodeCSRs = getNodeCSRs(
    csrs,
    'system:serviceaccount:openshift-machine-config-operator:node-bootstrapper',
  )
    .filter(isCSRPending)
    .map((csr) => {
      const request = Base64.decode(csr.spec.request);
      const req = request.replace(/(-----(BEGIN|END) CERTIFICATE REQUEST-----|\n)/g, '');
      const asn1 = fromBER(stringToArrayBuffer(fromBase64(req)));
      const pkcs10 = new CertificationRequest({ schema: asn1.result });
      // '2.5.4.3' is commonName code
      const commonName = pkcs10.subject.typesAndValues.find(({ type }) => type === '2.5.4.3');
      return {
        metadata: {
          name: commonName.value.valueBlock.value.replace('system:node:', ''),
        },
        csr,
        status: { status: 'Discovered' },
      };
    });

  const groupped = _.groupBy<CSRBundle>(nodeCSRs, (csr) => csr.metadata.name);

  return Object.keys(groupped).map((key) => {
    const { csr, status } = groupped[key][0];
    return {
      metadata: { name: key },
      status,
      csr,
    };
  });
};

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
