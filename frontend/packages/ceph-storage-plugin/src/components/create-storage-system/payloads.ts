import {
  apiVersionForModel,
  k8sCreate,
  k8sPatchByName,
  K8sResourceKind,
  k8sKill,
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
  OCS_INTERNAL_CR_NAME,
} from '../../constants';
import { OCSServiceModel, StorageSystemModel } from '../../models';
import { getOCSRequestData } from '../ocs-install/ocs-request-data';
import { capacityAndNodesValidate } from '../../utils/create-storage-system';
import { ValidationType } from '../../utils/common-ocs-install-el';
import { cephStorageLabel } from '../../selectors';
import { StorageSystemKind } from '../../types';
import { createAdvancedKmsResources } from '../kms-config/utils';

export const killStorageSystem = async (subSystemName: string, subSystemKind: string) => {
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
  k8sKill(StorageSystemModel, payload);
};

export const createStorageSystem = async (subSystemName: string, subSystemKind: string) => {
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
  try {
    await Promise.all([k8sCreate(SecretModel, tokenSecret), ...createAdvancedKmsResources(kms)]);
  } catch (err) {
    throw err;
  }
};

export const createMCGStorageCluster = async (enableKms: boolean) => {
  const storageClusterPayload: K8sResourceKind = {
    apiVersion: apiVersionForModel(OCSServiceModel),
    kind: OCSServiceModel.kind,
    metadata: { name: OCS_INTERNAL_CR_NAME, namespace: CEPH_STORAGE_NAMESPACE },
    spec: {
      multiCloudGateway: {
        reconcileStrategy: 'standalone',
      },
      encryption: {
        enable: enableKms,
        kms: { enable: enableKms },
      },
    },
  };
  return k8sCreate(OCSServiceModel, storageClusterPayload);
};

export const createStorageCluster = async (state: WizardState) => {
  const { storageClass, capacityAndNodes, securityAndNetwork, nodes } = state;
  const { capacity, enableArbiter, arbiterLocation, pvCount } = capacityAndNodes;
  const { encryption, publicNetwork, clusterNetwork, kms } = securityAndNetwork;

  const isNoProvisioner = storageClass?.provisioner === NO_PROVISIONER;

  const storage = (isNoProvisioner ? defaultRequestSize.BAREMETAL : capacity) as string;

  const validations = capacityAndNodesValidate(nodes, enableArbiter, isNoProvisioner);

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
  try {
    await Promise.all(requests);
  } catch (err) {
    throw err;
  }
};

export const createExternalSubSystem = async (subSystemPayloads: Payload[]) => {
  try {
    await Promise.all(
      subSystemPayloads.map(async (payload) =>
        k8sCreate(payload.model as K8sKind, payload.payload),
      ),
    );
  } catch (err) {
    throw err;
  }
};
