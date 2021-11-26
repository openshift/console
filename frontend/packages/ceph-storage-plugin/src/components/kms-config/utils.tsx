import * as _ from 'lodash';
import { K8sResourceKind, ConfigMapKind, SecretKind } from '@console/internal/module/k8s/types';
import { k8sCreate, k8sPatch } from '@console/internal/module/k8s';
import { ConfigMapModel, SecretModel } from '@console/internal/models';
import { EncryptionDispatch, KMSConfigMap, KMSConfig } from './providers';
import {
  CEPH_STORAGE_NAMESPACE,
  MODES,
  KMS_CONFIG_MAP_NAME,
  KMS_VAULT_OCS_SECRET_NAME,
  KMS_CONFIG_MAP_CSI_NAME,
  KMS_VAULT_CSI_SECRET_NAME,
} from '../../constants';
import {
  VaultConfigMap,
  IbmKmsConfigMap,
  ProviderNames,
  KmsImplementations,
  VaultConfig,
  IbmKmsConfig,
  EncryptionType,
} from '../../types';

export const parseURL = (url: string) => {
  try {
    return new URL(url);
  } catch (e) {
    return null;
  }
};

export const isLengthUnity = (allowedProviders) => allowedProviders.length === 1;

export const generateCASecret = (caCertificate: string) => ({
  apiVersion: SecretModel.apiVersion,
  kind: SecretModel.kind,
  metadata: {
    name: `ocs-kms-ca-secret-${Math.random()
      .toString(36)
      .substring(7)}`,
    namespace: CEPH_STORAGE_NAMESPACE,
  },
  stringData: {
    cert: caCertificate,
  },
});

export const generateClientSecret = (clientCertificate: string) => ({
  apiVersion: SecretModel.apiVersion,
  kind: SecretModel.kind,
  metadata: {
    name: `ocs-kms-client-cert-${Math.random()
      .toString(36)
      .substring(7)}`,
    namespace: CEPH_STORAGE_NAMESPACE,
  },
  stringData: {
    cert: clientCertificate,
  },
});

export const generateClientKeySecret = (clientKey: string) => ({
  apiVersion: SecretModel.apiVersion,
  kind: SecretModel.kind,
  metadata: {
    name: `ocs-kms-client-key-${Math.random()
      .toString(36)
      .substring(7)}`,
    namespace: CEPH_STORAGE_NAMESPACE,
  },
  stringData: {
    key: clientKey,
  },
});

const generateCsiKmsConfigMap = (name: string, csiConfigData: KMSConfigMap) => ({
  apiVersion: ConfigMapModel.apiVersion,
  kind: ConfigMapModel.kind,
  data: {
    [`${name}`]: JSON.stringify(csiConfigData),
  },
  metadata: {
    name: KMS_CONFIG_MAP_CSI_NAME,
    namespace: CEPH_STORAGE_NAMESPACE,
  },
});

const generateOcsKmsConfigMap = (configData: KMSConfigMap) => ({
  apiVersion: ConfigMapModel.apiVersion,
  kind: ConfigMapModel.kind,
  data: {
    ...configData,
  },
  metadata: {
    name: KMS_CONFIG_MAP_NAME,
    namespace: CEPH_STORAGE_NAMESPACE,
  },
});

const generateConfigMapPatch = (name: string, csiConfigData: KMSConfigMap) => {
  return {
    op: 'replace',
    path: `/data/${name}`,
    value: JSON.stringify(csiConfigData),
  };
};

const generateIbmKmsSecret = (kms: IbmKmsConfig) => ({
  apiVersion: SecretModel.apiVersion,
  kind: SecretModel.kind,
  metadata: {
    name: `ibm-kms-key-${Math.random()
      .toString(36)
      .substring(7)}`,
    namespace: CEPH_STORAGE_NAMESPACE,
  },
  stringData: {
    apiKey: kms.apiKey.value,
    rootKey: kms.rootKey.value,
  },
});

const getKmsVaultSecret = (token: string, secretName: string) => ({
  apiVersion: SecretModel.apiVersion,
  kind: SecretModel.kind,
  metadata: {
    name: secretName,
    namespace: CEPH_STORAGE_NAMESPACE,
  },
  stringData: {
    token,
  },
});

const createAdvancedVaultResources = (kms: VaultConfig) => {
  const advancedKmsResources: Promise<K8sResourceKind>[] = [];
  if (kms.caCert) advancedKmsResources.push(k8sCreate(SecretModel, kms.caCert));
  if (kms.clientCert) advancedKmsResources.push(k8sCreate(SecretModel, kms.clientCert));
  if (kms.clientKey) advancedKmsResources.push(k8sCreate(SecretModel, kms.clientKey));

  return advancedKmsResources;
};

const createCsiVaultResources = (
  kms: VaultConfig,
  csiKmsResources: Promise<K8sResourceKind>[],
  update: boolean,
  createAdvancedVaultResource: boolean = true,
) => {
  const parsedAddress = parseURL(kms.address.value);
  const csiConfigData: VaultConfigMap = {
    KMS_PROVIDER: KmsImplementations.VAULT_TOKENS,
    KMS_SERVICE_NAME: kms.name.value,
    VAULT_ADDR: `${`${parsedAddress.protocol}//${parsedAddress.hostname}`}:${kms.port.value}`,
    VAULT_BACKEND_PATH: kms.backend,
    VAULT_CACERT: kms.caCert?.metadata.name,
    VAULT_TLS_SERVER_NAME: kms.tls,
    VAULT_CLIENT_CERT: kms.clientCert?.metadata.name,
    VAULT_CLIENT_KEY: kms.clientKey?.metadata.name,
    VAULT_NAMESPACE: kms.providerNamespace,
    VAULT_CACERT_FILE: kms.caCertFile,
    VAULT_CLIENT_CERT_FILE: kms.clientCertFile,
    VAULT_CLIENT_KEY_FILE: kms.clientKeyFile,
  };
  const csiConfigObj: ConfigMapKind = generateCsiKmsConfigMap(kms.name.value, csiConfigData);

  // skip if cluster-wide already taken care
  if (createAdvancedVaultResource) {
    csiKmsResources.push(...createAdvancedVaultResources(kms));
  }
  if (update) {
    const cmPatch = [generateConfigMapPatch(kms.name.value, csiConfigData)];
    csiKmsResources.push(k8sPatch(ConfigMapModel, csiConfigObj, cmPatch));
  } else {
    // token creation on ocs cluster namespace only from installation flow
    if (kms.token.value !== null) {
      const tokenSecret: SecretKind = getKmsVaultSecret(kms.token.value, KMS_VAULT_CSI_SECRET_NAME);
      csiKmsResources.push(k8sCreate(SecretModel, tokenSecret));
    }
    csiKmsResources.push(k8sCreate(ConfigMapModel, csiConfigObj));
  }
};

const createCsiIbmKmsResources = (
  kms: IbmKmsConfig,
  csiKmsResources: Promise<K8sResourceKind>[],
  update: boolean,
  keySecret: SecretKind,
  createSecret: boolean = true,
) => {
  // skip if cluster-wide already taken care
  if (createSecret) {
    csiKmsResources.push(k8sCreate(SecretModel, keySecret));
  }
  // (ToDo: Sanjal) incorrect keys, change once confirmed
  const csiConfigData: IbmKmsConfigMap = {
    KMS_PROVIDER: KmsImplementations.IBM_KEY_PROTECT,
    KMS_SERVICE_NAME: kms.name.value,
    IBM_SERVICE_INSTANCE_ID: kms.instanceId.value,
    IBM_KMS_KEY: keySecret.metadata.name,
    IBM_BASE_URL: kms.baseUrl,
    IBM_TOKEN_URL: kms.tokenUrl,
  };
  const csiConfigObj: ConfigMapKind = generateCsiKmsConfigMap(kms.name.value, csiConfigData);

  if (update) {
    const cmPatch = [generateConfigMapPatch(kms.name.value, csiConfigData)];
    csiKmsResources.push(k8sPatch(ConfigMapModel, csiConfigObj, cmPatch));
  } else {
    csiKmsResources.push(k8sCreate(ConfigMapModel, csiConfigObj));
  }
};

const createClusterVaultResources = (
  kms: VaultConfig,
  clusterKmsResources: Promise<K8sResourceKind>[],
) => {
  const parsedAddress = parseURL(kms.address.value);
  const tokenSecret: SecretKind = getKmsVaultSecret(kms.token.value, KMS_VAULT_OCS_SECRET_NAME);
  const configData: VaultConfigMap = {
    KMS_PROVIDER: KmsImplementations.VAULT,
    KMS_SERVICE_NAME: kms.name.value,
    VAULT_ADDR: `${`${parsedAddress.protocol}//${parsedAddress.hostname}`}:${kms.port.value}`,
    VAULT_BACKEND_PATH: kms.backend,
    VAULT_CACERT: kms.caCert?.metadata.name,
    VAULT_TLS_SERVER_NAME: kms.tls,
    VAULT_CLIENT_CERT: kms.clientCert?.metadata.name,
    VAULT_CLIENT_KEY: kms.clientKey?.metadata.name,
    VAULT_NAMESPACE: kms.providerNamespace,
  };
  const configMapObj: ConfigMapKind = generateOcsKmsConfigMap(configData);

  clusterKmsResources.push(...createAdvancedVaultResources(kms));
  clusterKmsResources.push(k8sCreate(SecretModel, tokenSecret));
  clusterKmsResources.push(k8sCreate(ConfigMapModel, configMapObj));
};

const createClusterIbmKmsResources = (
  kms: IbmKmsConfig,
  clusterKmsResources: Promise<K8sResourceKind>[],
  keySecret: SecretKind,
) => {
  // (ToDo: Sanjal)incorrect keys, change once confirmed
  const configData: IbmKmsConfigMap = {
    KMS_PROVIDER: KmsImplementations.IBM_KEY_PROTECT,
    KMS_SERVICE_NAME: kms.name.value,
    IBM_SERVICE_INSTANCE_ID: kms.instanceId.value,
    IBM_KMS_KEY: keySecret.metadata.name,
    IBM_BASE_URL: kms.baseUrl,
    IBM_TOKEN_URL: kms.tokenUrl,
  };
  const configMapObj: ConfigMapKind = generateOcsKmsConfigMap(configData);

  clusterKmsResources.push(k8sCreate(SecretModel, keySecret));
  clusterKmsResources.push(k8sCreate(ConfigMapModel, configMapObj));
};

export const setEncryptionDispatch = (
  keyType: any,
  mode: string,
  dispatch: EncryptionDispatch,
  valueType?: any,
) => {
  const stateType = mode === MODES.ATTACHED_DEVICES ? _.camelCase(keyType) : keyType;

  if (valueType) {
    const stateValue =
      mode === MODES.ATTACHED_DEVICES ? { value: valueType } : { payload: valueType };
    dispatch({ type: stateType, ...stateValue });
  } else {
    dispatch({ type: stateType });
  }
};

export const getPort = (url: URL) => {
  if (url.port === '') {
    return url.protocol === 'http:' ? '80' : '443';
  }
  return url.port;
};

export const createCsiKmsResources = (
  kms: KMSConfig,
  update: boolean,
  provider = ProviderNames.VAULT,
) => {
  const csiKmsResources: Promise<K8sResourceKind>[] = [];
  switch (provider) {
    case ProviderNames.VAULT: {
      createCsiVaultResources(kms as VaultConfig, csiKmsResources, update);
      break;
    }
    case ProviderNames.IBMROKS: {
      const keySecret: SecretKind = generateIbmKmsSecret(kms as IbmKmsConfig);
      createCsiIbmKmsResources(kms as IbmKmsConfig, csiKmsResources, update, keySecret);
      break;
    }
    default:
  }

  return csiKmsResources;
};

export const createClusterKmsResources = (
  kms: KMSConfig,
  provider = ProviderNames.VAULT,
  encryption: EncryptionType,
) => {
  const clusterKmsResources: Promise<K8sResourceKind>[] = [];
  switch (provider) {
    case ProviderNames.VAULT: {
      encryption.clusterWide &&
        createClusterVaultResources(kms as VaultConfig, clusterKmsResources);
      encryption.storageClass &&
        createCsiVaultResources(
          kms as VaultConfig,
          clusterKmsResources,
          false,
          !encryption.clusterWide,
        );
      break;
    }
    case ProviderNames.IBMROKS: {
      const kmsConfig = kms as IbmKmsConfig;
      const keySecret: SecretKind = generateIbmKmsSecret(kmsConfig);
      encryption.clusterWide &&
        createClusterIbmKmsResources(kmsConfig, clusterKmsResources, keySecret);
      encryption.storageClass &&
        createCsiIbmKmsResources(
          kmsConfig,
          clusterKmsResources,
          false,
          keySecret,
          !encryption.clusterWide,
        );
      break;
    }
    default:
  }

  return [...clusterKmsResources];
};

export const kmsConfigValidation = (kms: KMSConfig, provider = ProviderNames.VAULT): boolean => {
  switch (provider) {
    case ProviderNames.VAULT: {
      const kmsObj = kms as VaultConfig;
      return (
        kmsObj.name?.valid &&
        kmsObj.address?.valid &&
        kmsObj.port?.valid &&
        kmsObj.name?.value !== '' &&
        kmsObj.address?.value !== '' &&
        kmsObj.port?.value !== ''
      );
    }
    case ProviderNames.IBMROKS: {
      const kmsObj = kms as IbmKmsConfig;
      return (
        kmsObj.name?.valid &&
        kmsObj.instanceId?.valid &&
        kmsObj.apiKey?.valid &&
        kmsObj.rootKey?.valid &&
        kmsObj.name?.value !== '' &&
        kmsObj.instanceId?.value !== '' &&
        kmsObj.apiKey?.value !== '' &&
        kmsObj.rootKey?.value !== ''
      );
    }
    default:
      return false;
  }
};
