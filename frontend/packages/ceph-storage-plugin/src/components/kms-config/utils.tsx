import * as _ from 'lodash';
import { K8sResourceKind, ConfigMapKind, SecretKind } from '@console/internal/module/k8s/types';
import { k8sCreate, k8sPatch } from '@console/internal/module/k8s';
import { ConfigMapModel, SecretModel } from '@console/internal/models';
import { EncryptionDispatch, KMSConfigMap, KMSConfig } from './providers';
import {
  CEPH_STORAGE_NAMESPACE,
  MODES,
  KMSConfigMapName,
  KMSVaultTokenSecretName,
  KMSConfigMapCSIName,
  KMSVaultCSISecretName,
} from '../../constants';
import {
  VaultConfigMap,
  HpcsConfigMap,
  ProviderNames,
  KmsImplementations,
  VaultConfig,
  HpcsConfig,
  VaultAuthMethods,
  KmsCsiConfigKeysMapping,
  VaultAuthMethodMapping,
  KmsEncryptionLevel,
} from '../../types';

export const parseURL = (url: string) => {
  try {
    return new URL(url);
  } catch (e) {
    return null;
  }
};

export const isLengthUnity = (items) => items.length === 1;

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

const convertCsiKeysToCamelCase = (csiConfigData: KMSConfigMap) => {
  // ceph-csi uses only camelcase in configMap keys.
  const res = Object.keys(csiConfigData).reduce(
    (obj, key) => Object.assign(obj, { [KmsCsiConfigKeysMapping[key]]: csiConfigData[key] }),
    {},
  );
  return res;
};

const generateCsiKmsConfigMap = (
  name: string,
  csiConfigData: KMSConfigMap,
  convertToCamelCase = true,
) => {
  return {
    apiVersion: ConfigMapModel.apiVersion,
    kind: ConfigMapModel.kind,
    data: {
      [`${name}`]: JSON.stringify(
        convertToCamelCase ? convertCsiKeysToCamelCase(csiConfigData) : csiConfigData,
      ),
    },
    metadata: {
      name: KMSConfigMapCSIName,
      namespace: CEPH_STORAGE_NAMESPACE,
    },
  };
};

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

const generateConfigMapPatch = (
  name: string,
  csiConfigData: KMSConfigMap,
  convertToCamelCase = true,
) => {
  return {
    op: 'replace',
    path: `/data/${name}`,
    value: JSON.stringify(
      convertToCamelCase ? convertCsiKeysToCamelCase(csiConfigData) : csiConfigData,
    ),
  };
};

const generateHpcsSecret = (kms: HpcsConfig) => ({
  apiVersion: SecretModel.apiVersion,
  kind: SecretModel.kind,
  metadata: {
    name: `ibm-kp-kms-${Math.random()
      .toString(36)
      .substring(7)}`,
    namespace: CEPH_STORAGE_NAMESPACE,
  },
  stringData: {
    IBM_KP_SERVICE_API_KEY: kms.apiKey.value,
    IBM_KP_CUSTOMER_ROOT_KEY: kms.rootKey.value,
  },
});

const getKmsVaultSecret = (token: string, secretName: string): SecretKind => ({
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
  let csiConfigData: VaultConfigMap = {
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
    VAULT_AUTH_METHOD: kms.authMethod,
  };

  switch (kms.authMethod) {
    case VaultAuthMethods.TOKEN:
      csiConfigData = {
        ...csiConfigData,
        VAULT_TOKEN_NAME: KMSVaultCSISecretName,
      };
      // token creation on ceph-csi deployment namespace from installation flow
      if (kms.authValue.value) {
        const tokenSecret: SecretKind = getKmsVaultSecret(
          kms.authValue.value,
          KMSVaultCSISecretName,
        );
        csiKmsResources.push(k8sCreate(SecretModel, tokenSecret));
      }
      break;
    case VaultAuthMethods.KUBERNETES:
      // encryption using tenant serviceAccount
      csiConfigData.KMS_PROVIDER = KmsImplementations.VAULT_TENANT_SA;
      csiConfigData = {
        ...csiConfigData,
        VAULT_AUTH_PATH: kms.providerAuthPath,
        VAULT_AUTH_NAMESPACE: kms.providerAuthNamespace,
      };
      break;
    default:
  }

  const csiConfigObj: ConfigMapKind = generateCsiKmsConfigMap(kms.name.value, csiConfigData);

  // skip if cluster-wide already taken care
  if (createAdvancedVaultResource) {
    csiKmsResources.push(...createAdvancedVaultResources(kms));
  }
  if (update) {
    const cmPatch = [generateConfigMapPatch(kms.name.value, csiConfigData)];
    csiKmsResources.push(k8sPatch(ConfigMapModel, csiConfigObj, cmPatch));
  } else {
    csiKmsResources.push(k8sCreate(ConfigMapModel, csiConfigObj));
  }
};

const createCsiHpcsResources = (
  kms: HpcsConfig,
  csiKmsResources: Promise<K8sResourceKind>[],
  update: boolean,
  secretName = '',
) => {
  let keySecret: SecretKind;
  if (!secretName) {
    // not required, while setting up storage cluster.
    // required, while creating new storage class.
    keySecret = generateHpcsSecret(kms);
    csiKmsResources.push(k8sCreate(SecretModel, keySecret));
  }

  const csiConfigData: HpcsConfigMap = {
    KMS_PROVIDER: KmsImplementations.IBM_KEY_PROTECT,
    KMS_SERVICE_NAME: kms.name.value,
    IBM_KP_SERVICE_INSTANCE_ID: kms.instanceId.value,
    IBM_KP_SECRET_NAME: secretName || keySecret.metadata.name,
    IBM_KP_BASE_URL: kms.baseUrl.value,
    IBM_KP_TOKEN_URL: kms.tokenUrl,
  };
  const csiConfigObj: ConfigMapKind = generateCsiKmsConfigMap(kms.name.value, csiConfigData, false);

  if (update) {
    const cmPatch = [generateConfigMapPatch(kms.name.value, csiConfigData, false)];
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
  let vaultConfigData: VaultConfigMap = {
    KMS_PROVIDER: KmsImplementations.VAULT,
    KMS_SERVICE_NAME: kms.name.value,
    VAULT_ADDR: `${`${parsedAddress.protocol}//${parsedAddress.hostname}`}:${kms.port.value}`,
    VAULT_BACKEND_PATH: kms.backend,
    VAULT_CACERT: kms.caCert?.metadata.name,
    VAULT_TLS_SERVER_NAME: kms.tls,
    VAULT_CLIENT_CERT: kms.clientCert?.metadata.name,
    VAULT_CLIENT_KEY: kms.clientKey?.metadata.name,
    VAULT_NAMESPACE: kms.providerNamespace,
    VAULT_AUTH_METHOD: kms.authMethod,
  };

  switch (kms.authMethod) {
    case VaultAuthMethods.TOKEN:
      clusterKmsResources.push(
        k8sCreate(SecretModel, getKmsVaultSecret(kms.authValue.value, KMSVaultTokenSecretName)),
      );
      break;
    case VaultAuthMethods.KUBERNETES:
      vaultConfigData = {
        ...vaultConfigData,
        VAULT_AUTH_KUBERNETES_ROLE: kms.authValue.value,
      };
      break;
    default:
  }
  const configMapObj: ConfigMapKind = generateOcsKmsConfigMap(vaultConfigData);
  clusterKmsResources.push(...createAdvancedVaultResources(kms));
  clusterKmsResources.push(k8sCreate(ConfigMapModel, configMapObj));
};

const createClusterHpcsResources = (
  kms: HpcsConfig,
  clusterKmsResources: Promise<K8sResourceKind>[],
) => {
  const keySecret: SecretKind = generateHpcsSecret(kms);

  const configData: HpcsConfigMap = {
    KMS_PROVIDER: KmsImplementations.IBM_KEY_PROTECT,
    KMS_SERVICE_NAME: kms.name.value,
    IBM_KP_SERVICE_INSTANCE_ID: kms.instanceId.value,
    IBM_KP_SECRET_NAME: keySecret.metadata.name,
    IBM_KP_BASE_URL: kms.baseUrl.value,
    IBM_KP_TOKEN_URL: kms.tokenUrl,
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
    case ProviderNames.HPCS: {
      createCsiHpcsResources(kms as HpcsConfig, csiKmsResources, update);
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
      const vaultConfig = kms as VaultConfig;
      const clusterWideSupported: boolean = VaultAuthMethodMapping[
        vaultConfig.authMethod
      ].supportedEncryptionType.includes(KmsEncryptionLevel.CLUSTER_WIDE);
      const storageClassSupported: boolean = VaultAuthMethodMapping[
        vaultConfig.authMethod
      ].supportedEncryptionType.includes(KmsEncryptionLevel.STORAGE_CLASS);
      clusterWideSupported && createClusterVaultResources(kms as VaultConfig, clusterKmsResources);
      storageClassSupported &&
        createCsiVaultResources(
          kms as VaultConfig,
          clusterKmsResources,
          false,
          !clusterWideSupported,
        );
      break;
    }
    case ProviderNames.HPCS: {
      const secretName = createClusterHpcsResources(kms as HpcsConfig, clusterKmsResources);
      createCsiHpcsResources(kms as HpcsConfig, clusterKmsResources, false, secretName);
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
    case ProviderNames.HPCS: {
      const kmsObj = kms as HpcsConfig;
      return (
        kmsObj.name?.valid &&
        kmsObj.instanceId?.valid &&
        kmsObj.apiKey?.valid &&
        kmsObj.rootKey?.valid &&
        kmsObj.baseUrl?.valid &&
        kmsObj.name?.value !== '' &&
        kmsObj.instanceId?.value !== '' &&
        kmsObj.apiKey?.value !== '' &&
        kmsObj.rootKey?.value !== '' &&
        kmsObj.baseUrl?.value !== ''
      );
    }
    default:
      return false;
  }
};
