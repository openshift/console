import {
  apiVersionForModel,
  k8sCreate,
  k8sGet,
  k8sPatchByName,
  K8sResourceKind,
  k8sPatch,
} from '@console/internal/module/k8s';
import { CustomResourceDefinitionModel, NodeModel, SecretModel, NamespaceModel } from '@console/internal/models';
import { K8sModel } from '@console/dynamic-plugin-sdk';
import { WizardNodeState, WizardState } from './reducer';
import { Payload } from './external-storage/types';
import {
  CEPH_STORAGE_NAMESPACE,
  defaultRequestSize,
  KMSSecretName,
  NO_PROVISIONER,
  OCS_INTERNAL_CR_NAME,
  OCS_DEVICE_SET_REPLICA,
  ATTACHED_DEVICES_ANNOTATION,
  OCS_DEVICE_SET_ARBITER_REPLICA,
  OCS_DEVICE_SET_FLEXIBLE_REPLICA,
} from '../../constants';
import { OCSServiceModel, StorageSystemModel } from '../../models';
import { capacityAndNodesValidate } from '../../utils/create-storage-system';
import { ValidationType } from '../../utils/common-ocs-install-el';
import { cephStorageLabel } from '../../selectors';
import {
  StorageSystemKind,
  StorageClusterKind,
  StorageClusterResource,
  ResourceConstraints,
  DeviceSet,
} from '../../types';
import { getDeviceSetCount } from '../../utils/install';
import { createAdvancedKmsResources } from '../kms-config/utils';

const MIN_SPEC_RESOURCES: StorageClusterResource = {
  mds: {
    limits: {
      cpu: '3',
      memory: '8Gi',
    },
    requests: {
      cpu: '1',
      memory: '8Gi',
    },
  },
  rgw: {
    limits: {
      cpu: '2',
      memory: '4Gi',
    },
    requests: {
      cpu: '1',
      memory: '4Gi',
    },
  },
};

const MIN_DEVICESET_RESOURCES: ResourceConstraints = {
  limits: {
    cpu: '2',
    memory: '5Gi',
  },
  requests: {
    cpu: '1',
    memory: '5Gi',
  },
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

export const createDeviceSet = (
  scName: string,
  osdSize: string,
  portable: boolean,
  replica: number,
  count: number,
  resources?: ResourceConstraints,
): DeviceSet => ({
  name: `ocs-deviceset-${scName}`,
  count,
  portable,
  replica,
  resources: resources ?? {},
  placement: {},
  dataPVCTemplate: {
    spec: {
      storageClassName: scName,
      accessModes: ['ReadWriteOnce'],
      volumeMode: 'Block',
      resources: {
        requests: {
          storage: osdSize,
        },
      },
    },
  },
});

export const getOCSRequestData = (
  storageClass: WizardState['storageClass'],
  storage: string,
  encrypted: boolean,
  isMinimal: boolean,
  flexibleScaling = false,
  publicNetwork?: string,
  clusterNetwork?: string,
  kmsEnable?: boolean,
  selectedArbiterZone?: string,
  stretchClusterChecked?: boolean,
  availablePvsCount?: number,
): StorageClusterKind => {
  const scName: string = storageClass.name;
  const isNoProvisioner: boolean = storageClass?.provisioner === NO_PROVISIONER;
  const isPortable: boolean = flexibleScaling ? false : !isNoProvisioner;
  const deviceSetReplica: number = stretchClusterChecked
    ? OCS_DEVICE_SET_ARBITER_REPLICA
    : flexibleScaling
    ? OCS_DEVICE_SET_FLEXIBLE_REPLICA
    : OCS_DEVICE_SET_REPLICA;
  const deviceSetCount = getDeviceSetCount(availablePvsCount, deviceSetReplica);

  const requestData: StorageClusterKind = {
    apiVersion: 'ocs.openshift.io/v1',
    kind: 'StorageCluster',
    metadata: {
      name: OCS_INTERNAL_CR_NAME,
      namespace: CEPH_STORAGE_NAMESPACE,
    },
    spec: {
      manageNodes: false,
      resources: isMinimal ? MIN_SPEC_RESOURCES : {},
      flexibleScaling,
      encryption: {
        enable: encrypted,
        kms: Object.assign(kmsEnable ? { enable: true } : {}),
      },
      arbiter: {
        enable: stretchClusterChecked,
      },
      nodeTopologies: {
        arbiterLocation: selectedArbiterZone,
      },
      storageDeviceSets: [
        createDeviceSet(
          scName,
          storage,
          isPortable,
          deviceSetReplica,
          deviceSetCount,
          isMinimal ? MIN_DEVICESET_RESOURCES : {},
        ),
      ],
      ...Object.assign(
        publicNetwork || clusterNetwork
          ? {
              network: {
                provider: 'multus',
                selectors: {
                  ...Object.assign(publicNetwork ? { public: publicNetwork } : {}),
                  ...Object.assign(clusterNetwork ? { cluster: clusterNetwork } : {}),
                },
              },
            }
          : {},
      ),
    },
  };

  if (isNoProvisioner) {
    requestData.spec.monDataDirHostPath = '/var/lib/rook';
    requestData.metadata = {
      ...requestData.metadata,
      annotations: {
        [ATTACHED_DEVICES_ANNOTATION]: 'true',
      },
    };
  }
  return requestData;
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
  const requests: Promise<K8sModel>[] = [];
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

export const labelOCSNamespace = (): Promise<K8sModel> =>
  k8sPatch(
    NamespaceModel,
    {
      metadata: {
        name: CEPH_STORAGE_NAMESPACE,
      },
    },
    [
      {
        op: 'add',
        path: '/metadata/labels',
        value: { 'openshift.io/cluster-monitoring': 'true' },
      },
    ],
  );

export const createExternalSubSystem = async (subSystemPayloads: Payload[]) => {
  try {
    await Promise.all(
      subSystemPayloads.map(async (payload) =>
        k8sCreate(payload.model as K8sModel, payload.payload),
      ),
    );
  } catch (err) {
    throw err;
  }
};

/**
 * The crd status field should be available to proceed with CR creation.
 */
const isCRDAvailable = (crd: K8sResourceKind, plural: string) =>
  crd?.status?.acceptedNames?.plural === plural;

export const waitforCRD = async (model, maxAttempts = 30) => {
  const crdName = [model.plural, model.apiGroup].join('.');
  const POLLING_INTERVAL = 5000;
  let attempts = 0;
  /**
   * This will poll the CRD for an interval of 5s.
   * This times out after 150s.
   */
  const pollCRD = async (resolve, reject) => {
    try {
      attempts++;
      const crd = await k8sGet(CustomResourceDefinitionModel, crdName);
      return isCRDAvailable(crd, model.plural)
        ? resolve()
        : setTimeout(pollCRD, POLLING_INTERVAL, resolve, reject);
    } catch (err) {
      if (err?.response?.status === 404) {
        if (attempts === maxAttempts)
          return reject(new Error(`CustomResourceDefintion '${crdName}' not found.`));
        return setTimeout(pollCRD, POLLING_INTERVAL, resolve, reject);
      }
      return reject(err);
    }
  };

  return new Promise(pollCRD);
};
