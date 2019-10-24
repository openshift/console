import { Base64 } from 'js-base64';
import { SecretModel } from '@console/internal/models';
import { BareMetalHostModel } from '../../models';
import { BareMetalHostKind } from '../../types';

const getSecretName = (name: string): string => `${name}-bmc-secret`;

export const buildBareMetalHostSecret = (name, namespace, username, password) => ({
  apiVersion: SecretModel.apiVersion,
  kind: SecretModel.kind,
  metadata: {
    namespace,
    name: getSecretName(name),
  },
  data: {
    username: Base64.encode(username),
    password: Base64.encode(password),
  },
  type: 'Opaque',
});

export const buildBareMetalHostObject = (
  name,
  namespace,
  BMCAddress,
  bootMACAddress,
  online = true,
  description = '',
): BareMetalHostKind => ({
  apiVersion: `${BareMetalHostModel.apiGroup}/${BareMetalHostModel.apiVersion}`,
  kind: BareMetalHostModel.kind,
  metadata: {
    name,
    namespace,
  },
  spec: {
    bmc: {
      address: BMCAddress,
      credentialsName: getSecretName(name),
    },
    bootMACAddress,
    description,
    online,
  },
});
