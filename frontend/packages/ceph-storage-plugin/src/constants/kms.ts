import { VaultConfig, HpcsConfig, ProviderNames, KMSConfig } from '../types';

export const KMSMaxFileUploadSize = 4000000;
export const KMSConfigMapName = 'ocs-kms-connection-details';
export const KMSConfigMapCSIName = 'csi-kms-connection-details';
export const KMSSecretName = 'ocs-kms-token';

export const VaultEmptyState: VaultConfig = Object.seal({
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

export const HpcsEmptyState: HpcsConfig = Object.seal({
  name: {
    value: '',
    valid: true,
  },
  instanceId: {
    value: '',
    valid: true,
  },
  apiKey: {
    value: '',
    valid: true,
  },
  rootKey: {
    value: '',
    valid: true,
  },
  baseUrl: '',
  tokenUrl: '',
  hasHandled: true,
});

export const KMSEmptyState: KMSConfig = Object.seal({
  [ProviderNames.VAULT]: VaultEmptyState,
  [ProviderNames.HPCS]: HpcsEmptyState,
  kmsProvider: ProviderNames.VAULT,
});
