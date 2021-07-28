import * as _ from 'lodash';
import { k8sPatch, NodeKind, K8sKind } from '@console/internal/module/k8s';
import { NodeModel, NamespaceModel } from '@console/internal/models';
import { hasLabel } from '@console/shared';
import {
  NO_PROVISIONER,
  OCS_INTERNAL_CR_NAME,
  CEPH_STORAGE_NAMESPACE,
  OCS_DEVICE_SET_REPLICA,
  ATTACHED_DEVICES_ANNOTATION,
  OCS_DEVICE_SET_ARBITER_REPLICA,
  OCS_DEVICE_SET_FLEXIBLE_REPLICA,
} from '../../constants';
import { cephStorageLabel } from '../../selectors';
import {
  StorageClusterKind,
  StorageClusterResource,
  DeviceSet,
  ResourceConstraints,
} from '../../types';
import { WizardState } from '../create-storage-system/reducer';

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

export const getDeviceSetCount = (pvCount: number, replica: number): number =>
  Math.floor(pvCount / replica) || 1;

export const labelNodes = (selectedNodes: NodeKind[]): Promise<NodeKind>[] => {
  const patch = [
    {
      op: 'add',
      path: '/metadata/labels/cluster.ocs.openshift.io~1openshift-storage',
      value: '',
    },
  ];
  return _.reduce(
    selectedNodes,
    (accumulator, node) => {
      return hasLabel(node, cephStorageLabel)
        ? accumulator
        : [...accumulator, k8sPatch(NodeModel, node, patch)];
    },
    [],
  );
};

export const labelOCSNamespace = (): Promise<K8sKind> =>
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
  name?: string,
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
      name: name || OCS_INTERNAL_CR_NAME,
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
        publicNetwork
          ? {
              network: {
                provider: 'multus',
                selectors: {
                  public: publicNetwork,
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
