import * as React from 'react';
import * as _ from 'lodash';
import { K8sResourceKind, ConfigMapKind, SecretKind } from '@console/internal/module/k8s/types';
import { k8sCreate, k8sPatch } from '@console/internal/module/k8s';
import { ConfigMapModel, SecretModel } from '@console/internal/models';
import {
  CEPH_STORAGE_NAMESPACE,
  MODES,
  KMSConfigMapName,
  KMSSecretName,
  KMSConfigMapCSIName,
} from '../../constants';
import { Action } from '../ocs-install/attached-devices-mode/reducer';
import { InternalClusterAction } from '../ocs-install/internal-mode/reducer';
import { KMSConfig, KMSConfigMap } from '../../types';
import { CreateStorageSystemAction } from '../create-storage-system/reducer';

export const parseURL = (url: string) => {
  try {
    return new URL(url);
  } catch (e) {
    return null;
  }
};

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

export const createAdvancedKmsResources = (kms: KMSConfig) => {
  const advancedKmsResources: Promise<K8sResourceKind>[] = [];

  if (kms.caCert) advancedKmsResources.push(k8sCreate(SecretModel, kms.caCert));
  if (kms.clientCert) advancedKmsResources.push(k8sCreate(SecretModel, kms.clientCert));
  if (kms.clientKey) advancedKmsResources.push(k8sCreate(SecretModel, kms.clientKey));

  return advancedKmsResources;
};

export const createCsiKmsResources = (kms: KMSConfig, update: boolean = false) => {
  const parsedAddress = parseURL(kms.address.value);
  const csiConfigData: KMSConfigMap = {
    KMS_PROVIDER: 'vaulttokens',
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

  const csiConfigObj: ConfigMapKind = {
    apiVersion: ConfigMapModel.apiVersion,
    kind: ConfigMapModel.kind,
    data: {
      [`${kms.name.value}`]: JSON.stringify(csiConfigData),
    },
    metadata: {
      name: KMSConfigMapCSIName,
      namespace: CEPH_STORAGE_NAMESPACE,
    },
  };

  const csiKmsResources: Promise<K8sResourceKind>[] =
    /** kms.token.value === "" if we are calling this function from StorageClass KMS flow.
     * Hence, we need to createAdvancedKmsResources, else it is already created if calling from OCS wizard flow.
     */
    kms.token.value ? [] : createAdvancedKmsResources(kms);

  if (update) {
    const cmPatch = [
      {
        op: 'replace',
        path: `/data/${kms.name.value}`,
        value: JSON.stringify(csiConfigData),
      },
    ];
    csiKmsResources.push(k8sPatch(ConfigMapModel, csiConfigObj, cmPatch));
  } else {
    csiKmsResources.push(k8sCreate(ConfigMapModel, csiConfigObj));
  }

  return csiKmsResources;
};

export const createClusterKmsResources = (kms: KMSConfig) => {
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

  const configData: KMSConfigMap = {
    KMS_PROVIDER: 'vault',
    KMS_SERVICE_NAME: kms.name.value,
    VAULT_ADDR: `${`${parsedAddress.protocol}//${parsedAddress.hostname}`}:${kms.port.value}`,
    VAULT_BACKEND_PATH: kms.backend,
    VAULT_CACERT: kms.caCert?.metadata.name,
    VAULT_TLS_SERVER_NAME: kms.tls,
    VAULT_CLIENT_CERT: kms.clientCert?.metadata.name,
    VAULT_CLIENT_KEY: kms.clientKey?.metadata.name,
    VAULT_NAMESPACE: kms.providerNamespace,
  };

  const configMapObj: ConfigMapKind = {
    apiVersion: ConfigMapModel.apiVersion,
    kind: ConfigMapModel.kind,
    data: {
      ...configData,
    },
    metadata: {
      name: KMSConfigMapName,
      namespace: CEPH_STORAGE_NAMESPACE,
    },
  };

  const clusterKmsResources: Promise<K8sResourceKind>[] = createAdvancedKmsResources(kms);
  clusterKmsResources.push(k8sCreate(SecretModel, tokenSecret));
  clusterKmsResources.push(k8sCreate(ConfigMapModel, configMapObj));

  return [...clusterKmsResources, ...createCsiKmsResources(kms)];
};

export type EncryptionDispatch = React.Dispatch<
  Action | InternalClusterAction | CreateStorageSystemAction
>;

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

export const scKmsConfigValidation = (kms: KMSConfig): boolean =>
  kms.name?.valid &&
  kms.address?.valid &&
  kms.port?.valid &&
  kms.name.value !== '' &&
  kms.address.value !== '' &&
  kms.port.value !== '';

export const kmsConfigValidation = (kms: KMSConfig): boolean =>
  kms.token?.valid && kms.token.value !== '' && scKmsConfigValidation(kms);
