import { k8sPatch, k8sCreate } from '@console/internal/module/k8s';
import { SecretModel } from '@console/internal/models';
import { BareMetalHostModel } from '../../models';
import { BareMetalHostKind } from '../../types';

export const powerOffHost = (host: BareMetalHostKind) =>
  k8sPatch(BareMetalHostModel, host, [{ op: 'replace', path: '/spec/online', value: false }]);

export const powerOnHost = (host: BareMetalHostKind) =>
  k8sPatch(BareMetalHostModel, host, [{ op: 'replace', path: '/spec/online', value: true }]);

export const createBareMetalHost = async (bareMetalHost, secret) => [
  await k8sCreate(SecretModel, secret),
  await k8sCreate(BareMetalHostModel, bareMetalHost),
];
