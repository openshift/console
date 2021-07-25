import * as React from 'react';
import * as _ from 'lodash';
import { K8sResourceKind, ConfigMapKind, SecretKind } from '@console/internal/module/k8s/types';
import { k8sCreate, k8sPatch } from '@console/internal/module/k8s/resource';
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
import { StorageClassClusterAction } from '../../utils/kms-encryption';
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

export const createKmsResources = (kms: KMSConfig, update = false, previousData?: any) => {
  let tokenSecret: SecretKind;
  if (kms.token) {
    tokenSecret = {
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
  }

  const resources: Promise<K8sResourceKind>[] = [];

  const parsedAddress = parseURL(kms.address.value);

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
    VAULT_TOKEN_NAME: KMSSecretName,
    VAULT_CACERT_FILE: kms.caCertFile,
    VAULT_CLIENT_CERT_FILE: kms.clientCertFile,
    VAULT_CLIENT_KEY_FILE: kms.clientKeyFile,
  };

  const csiConfigObj: ConfigMapKind = {
    apiVersion: ConfigMapModel.apiVersion,
    kind: ConfigMapModel.kind,
    data: {
      [`1-${kms.name.value}`]: JSON.stringify(csiConfigData),
    },
    metadata: {
      name: KMSConfigMapCSIName,
      namespace: CEPH_STORAGE_NAMESPACE,
    },
  };

  if (kms.caCert) {
    resources.push(k8sCreate(SecretModel, kms.caCert, { ns: CEPH_STORAGE_NAMESPACE }));
  }

  if (kms.clientCert) {
    resources.push(k8sCreate(SecretModel, kms.clientCert, { ns: CEPH_STORAGE_NAMESPACE }));
  }

  if (kms.clientKey) {
    resources.push(k8sCreate(SecretModel, kms.clientKey, { ns: CEPH_STORAGE_NAMESPACE }));
  }

  if (update) {
    const patchValue = Object.keys(previousData).length + 1;
    const cmPatch = [
      {
        op: 'replace',
        path: `/data/${patchValue}-${kms.name.value}`,
        value: JSON.stringify(csiConfigData),
      },
    ];
    resources.push(k8sPatch(ConfigMapModel, csiConfigObj, cmPatch));
  } else {
    resources.push(k8sCreate(SecretModel, tokenSecret, { ns: CEPH_STORAGE_NAMESPACE }));
    resources.push(k8sCreate(ConfigMapModel, configMapObj, { ns: CEPH_STORAGE_NAMESPACE }));
    resources.push(k8sCreate(ConfigMapModel, csiConfigObj, { ns: CEPH_STORAGE_NAMESPACE }));
  }

  return resources;
};

export type EncryptionDispatch = React.Dispatch<
  Action | InternalClusterAction | StorageClassClusterAction | CreateStorageSystemAction
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
