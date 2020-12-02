import * as React from 'react';
import * as _ from 'lodash';
import { K8sResourceKind, ConfigMapKind, SecretKind } from '@console/internal/module/k8s/types';
import { k8sCreate } from '@console/internal/module/k8s/resource';
import { ConfigMapModel, SecretModel } from '@console/internal/models';
import { CEPH_STORAGE_NAMESPACE, MODES, KMSConfigMapName, KMSSecretName } from '../../constants';
import { Action } from '../ocs-install/attached-devices/create-sc/state';
import { InternalClusterAction } from '../ocs-install/internal-mode/reducer';
import { KMSConfig, KMSConfigMap } from '../ocs-install/types';

export const parseURL = (url: string) => {
  try {
    return new URL(url);
  } catch (e) {
    return null;
  }
};

export const createKmsResources = (kms: KMSConfig) => {
  const tokenSecret: SecretKind = {
    apiVersion: SecretModel.apiVersion,
    kind: SecretModel.kind,
    metadata: {
      name: KMSSecretName,
      namespace: CEPH_STORAGE_NAMESPACE,
    },
    stringData: {
      data: kms.token.value,
    },
  };
  const resources: Promise<K8sResourceKind>[] = [];

  const parsedAddress = parseURL(kms.address.value);

  const configData: KMSConfigMap = {
    KMS_PROVIDER: 'vault',
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

  if (kms.caCert) {
    resources.push(k8sCreate(SecretModel, kms.caCert, CEPH_STORAGE_NAMESPACE));
  }

  if (kms.clientCert) {
    resources.push(k8sCreate(SecretModel, kms.clientCert, CEPH_STORAGE_NAMESPACE));
  }

  if (kms.clientKey) {
    resources.push(k8sCreate(SecretModel, kms.clientKey, CEPH_STORAGE_NAMESPACE));
  }

  resources.push(k8sCreate(SecretModel, tokenSecret, CEPH_STORAGE_NAMESPACE));
  resources.push(k8sCreate(ConfigMapModel, configMapObj, CEPH_STORAGE_NAMESPACE));
  return resources;
};

export const setEncryptionDispatch = (
  keyType: any,
  mode: string,
  dispatch: React.Dispatch<Action | InternalClusterAction>,
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
