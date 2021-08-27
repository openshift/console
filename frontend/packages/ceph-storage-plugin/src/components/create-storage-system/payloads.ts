import {
  apiVersionForModel,
  k8sCreate,
  k8sPatchByName,
  K8sResourceKind,
} from '@console/internal/module/k8s';
import { NodeModel, SecretModel } from '@console/internal/models';
import { K8sKind } from 'packages/console-dynamic-plugin-sdk/src';
import { WizardNodeState, WizardState } from './reducer';
import { Payload } from './external-storage/types';
import {
  CEPH_STORAGE_NAMESPACE,
  defaultRequestSize,
  KMSSecretName,
  NO_PROVISIONER,
} from '../../constants';
import { NooBaaSystemModel, OCSServiceModel, StorageSystemModel } from '../../models';
import { getOCSRequestData } from '../ocs-install/ocs-request-data';
import { capacityAndNodesValidate } from '../../utils/create-storage-system';
import { ValidationType } from '../../utils/common-ocs-install-el';
import { cephStorageLabel } from '../../selectors';
import { KMSConfigMap, StorageSystemKind } from '../../types';
import { createAdvancedKmsResources, parseURL } from '../kms-config/utils';

export const createStorageSystem = (subSystemName: string, subSystemKind: string) => {
  const payload: StorageSystemKind = {
    apiVersion: apiVersionForModel(StorageSystemModel),
    kind: StorageSystemModel.kind,
    metadata: {
      name: `${subSystemName}-storagesystem`,
      namespace: CEPH_STORAGE_NAMESPACE,
    },
    spec: {
      name: subSystemName,
      kind: subSystemKind,
      namespace: CEPH_STORAGE_NAMESPACE,
    },
  };
  return k8sCreate(StorageSystemModel, payload);
};

export const createNoobaaKmsResources = async (kms: WizardState['securityAndNetwork']['kms']) => {
  const tokenSecret = {
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

  return Promise.all([k8sCreate(SecretModel, tokenSecret), ...createAdvancedKmsResources(kms)]);
};

export const createNoobaaResource = async (kms: WizardState['securityAndNetwork']['kms']) => {
  const noobaaPayload: K8sResourceKind = {
    apiVersion: apiVersionForModel(NooBaaSystemModel),
    kind: NooBaaSystemModel.kind,
    metadata: { name: 'noobaa', namespace: CEPH_STORAGE_NAMESPACE },
    spec: {
      dbResources: { requests: { cpu: '0.1', memory: '1Gi' } },
      dbType: 'postgres',
      coreResources: {
        requests: {
          cpu: '0.1',
          memory: '1Gi',
        },
      },
      security: {},
    },
  };
  if (kms) {
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

    noobaaPayload.spec.security = {
      kms: {
        connectionDetails: configData,
        tokenSecretName: KMSSecretName,
      },
    };
  }

  return k8sCreate(NooBaaSystemModel, noobaaPayload);
};

export const createStorageCluster = async (state: WizardState) => {
  const { storageClass, capacityAndNodes, securityAndNetwork, nodes } = state;
  const { capacity, enableArbiter, arbiterLocation, pvCount } = capacityAndNodes;
  const { encryption, publicNetwork, clusterNetwork, kms } = securityAndNetwork;

  const storage = (storageClass?.provisioner === NO_PROVISIONER
    ? defaultRequestSize.BAREMETAL
    : capacity) as string;

  const validations = capacityAndNodesValidate(nodes, enableArbiter);

  const isMinimal = validations.includes(ValidationType.MINIMAL);

  const isFlexibleScaling = validations.includes(ValidationType.ATTACHED_DEVICES_FLEXIBLE_SCALING);

  const payload = getOCSRequestData(
    storageClass,
    storage,
    encryption.clusterWide,
    isMinimal,
    isFlexibleScaling,
    publicNetwork,
    clusterNetwork,
    kms.hasHandled && encryption.advanced,
    arbiterLocation,
    enableArbiter,
    pvCount,
  );
  return k8sCreate(OCSServiceModel, payload);
};

export const labelNodes = async (nodes: WizardNodeState[]) => {
  const patch = [
    {
      op: 'add',
      path: '/metadata/labels/cluster.ocs.openshift.io~1openshift-storage',
      value: '',
    },
  ];
  const requests: Promise<K8sKind>[] = [];
  nodes.forEach((node) => {
    if (!node.labels?.[cephStorageLabel])
      requests.push(k8sPatchByName(NodeModel, node.name, null, patch));
  });
  return Promise.all(requests);
};

export const createExternalSubSystem = (subSystemPayloads: Payload[]) =>
  Promise.all(
    subSystemPayloads.map(async (payload) => k8sCreate(payload.model as K8sKind, payload.payload)),
  );
