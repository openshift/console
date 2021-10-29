import { VaultConfig, HpcsConfig, ProviderNames, KmsImplementations, KMSConfig } from '../types';

export const KMSMaxFileUploadSize = 4000000;
export const KMSConfigMapName = 'ocs-kms-connection-details';
export const KMSConfigMapCSIName = 'csi-kms-connection-details';
export const KMSSecretName = 'ocs-kms-token';
export const KMS_PROVIDER = 'KMS_PROVIDER';

/**
 * Ceph-Csi supports multiple KMS implementations ('vaulttenantsa', 'aws-metadata' etc),
 * all of them are not supported by UI (only 'vaulttokens' and 'ibmkeyprotect' supported right now).
 * "supported" will have a list of all the UI supported implementations for a
 * particular KMS provider (AWS, Vault, IBM etc).
 */
export const UISupportedProviders = {
  [ProviderNames.VAULT]: {
    group: 'Vault',
    supported: [KmsImplementations.VAULT_TOKENS], // add 'vaulttenantsa' to the list, if supported in future
  },
  [ProviderNames.HPCS]: {
    group: 'Hyper Protect Crypto Services',
    supported: [KmsImplementations.IBM_KEY_PROTECT],
    allowedPlatforms: ['IBMCloud'],
  },
};

export const DescriptionKey = {
  [KmsImplementations.VAULT_TOKENS]: 'VAULT_ADDR',
  [KmsImplementations.IBM_KEY_PROTECT]: 'IBM_SERVICE_INSTANCE_ID',
};

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
