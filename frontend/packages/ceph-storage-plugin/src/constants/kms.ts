import { KMSConfig } from '../types';

export const KMSProviders = [
  {
    name: 'Vault',
    value: 'vault',
  },
];

export const KMSMaxFileUploadSize = 4000000;
export const KMSConfigMapName = 'ocs-kms-connection-details';
export const KMSConfigMapCSIName = 'csi-kms-connection-details';
export const KMSSecretName = 'ocs-kms-token';

export const KMSEmptyState: KMSConfig = Object.seal({
  name: {
    value: '',
    valid: true,
  },
  token: {
    value: '',
    valid: true,
  },
  address: {
    value: '',
    valid: true,
  },
  port: {
    value: '',
    valid: true,
  },
  backend: '',
  caCert: null,
  tls: '',
  clientCert: null,
  clientKey: null,
  providerNamespace: '',
  hasHandled: true,
  caCertFile: '',
  clientCertFile: '',
  clientKeyFile: '',
});
