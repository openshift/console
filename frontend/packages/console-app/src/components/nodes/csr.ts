import { fromBER } from 'asn1js';
import { Base64 } from 'js-base64';
import * as _ from 'lodash';
import { CertificationRequest } from 'pkijs';
import { stringToArrayBuffer, fromBase64 } from 'pvutils';
import {
  NodeKind,
  ObjectMetadata,
  CertificateSigningRequestKind,
} from '@console/internal/module/k8s';

export const isCSRBundle = (bundle: any): bundle is CSRBundle => 'csr' in bundle;

export type CSRBundle = {
  metadata: ObjectMetadata;
  csr: CertificateSigningRequestKind;
};

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
          creationTimestamp: csr.metadata.creationTimestamp,
        },
        csr,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.metadata.creationTimestamp).getTime() -
        new Date(a.metadata.creationTimestamp).getTime(),
    );

  const groupped = _.groupBy<CSRBundle>(nodeCSRs, (csr) => csr.metadata.name);

  return Object.keys(groupped).reduce((acc, key) => {
    const { csr } = groupped[key][0];
    if (isCSRPending(csr)) {
      acc.push({
        metadata: { ...csr.metadata, name: key },
        csr,
      });
    }
    return acc;
  }, []);
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
