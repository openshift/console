import * as _ from 'lodash';
import { K8sResourceKind, ConfigMapKind, SecretKind } from '@console/internal/module/k8s/types';
import { k8sCreate, k8sPatch } from '@console/internal/module/k8s';
import { ConfigMapModel, SecretModel } from '@console/internal/models';
import { EncryptionDispatch, KMSConfigMap, KMSConfig } from './providers';
import {
  CEPH_STORAGE_NAMESPACE,
  MODES,
  KMSConfigMapName,
  KMSSecretName,
  KMSConfigMapCSIName,
} from '../../constants';
import {
  VaultConfigMap,
  IbmKmsConfigMap,
  ProviderNames,
  KmsImplementations,
  VaultConfig,
  IbmKmsConfig,
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
    name: KMSConfigMapCSIName,
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
    name: KMSConfigMapName,
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
    VAULT_TOKEN_NAME: kms.token.value ? KMSSecretName : '',
    VAULT_CACERT_FILE: kms.caCertFile,
    VAULT_CLIENT_CERT_FILE: kms.clientCertFile,
    VAULT_CLIENT_KEY_FILE: kms.clientKeyFile,
  };
  const csiConfigObj: ConfigMapKind = generateCsiKmsConfigMap(kms.name.value, csiConfigData);

  if (!kms.token.value) {
    // not required, while setting up storage cluster.
    // required, while creating new storage class.
    csiKmsResources.push(...createAdvancedVaultResources(kms));
  }
  if (update) {
    const cmPatch = [generateConfigMapPatch(kms.name.value, csiConfigData)];
    csiKmsResources.push(k8sPatch(ConfigMapModel, csiConfigObj, cmPatch));
  } else {
    csiKmsResources.push(k8sCreate(ConfigMapModel, csiConfigObj));
  }
};

const createCsiIbmKmsResources = (
  kms: IbmKmsConfig,
  csiKmsResources: Promise<K8sResourceKind>[],
  update: boolean,
  secretName = '',
) => {
  let keySecret: SecretKind;
  if (!secretName) {
    // not required, while setting up storage cluster.
    // required, while creating new storage class.
    keySecret = generateIbmKmsSecret(kms);
    csiKmsResources.push(k8sCreate(SecretModel, keySecret));
  }
  // (ToDo: Sanjal) incorrect keys, change once confirmed
  const csiConfigData: IbmKmsConfigMap = {
    KMS_PROVIDER: KmsImplementations.IBM_KEY_PROTECT,
    KMS_SERVICE_NAME: kms.name.value,
    IBM_SERVICE_INSTANCE_ID: kms.instanceId.value,
    IBM_KMS_KEY: secretName || keySecret.metadata.name,
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
  const tokenSecret: SecretKind = {
    apiVersion: SecretModel.apiVersion,
    kind: SecretModel.kind,
    metadata: {
      name: KMSSecretName,
      namespace: CEPH_STORAGE_NAMESPACE,
    },
    stringData: {
      token: kms.token.value,
    },
  };
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
) => {
  const keySecret: SecretKind = generateIbmKmsSecret(kms);
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

  return keySecret.metadata.name;
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
      createCsiIbmKmsResources(kms as IbmKmsConfig, csiKmsResources, update);
      break;
    }
    default:
  }

  return csiKmsResources;
};

export const createClusterKmsResources = (kms: KMSConfig, provider = ProviderNames.VAULT) => {
  const clusterKmsResources: Promise<K8sResourceKind>[] = [];
  switch (provider) {
    case ProviderNames.VAULT: {
      createClusterVaultResources(kms as VaultConfig, clusterKmsResources);
      createCsiVaultResources(kms as VaultConfig, clusterKmsResources, false);
      break;
    }
    case ProviderNames.IBMROKS: {
      const secretName = createClusterIbmKmsResources(kms as IbmKmsConfig, clusterKmsResources);
      createCsiIbmKmsResources(kms as IbmKmsConfig, clusterKmsResources, false, secretName);
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
