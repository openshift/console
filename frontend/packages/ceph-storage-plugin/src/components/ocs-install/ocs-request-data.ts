import * as _ from 'lodash';
import { k8sPatch, NodeKind, StorageClassResourceKind } from '@console/internal/module/k8s';
import { NodeModel } from '@console/internal/models';
import {
  NO_PROVISIONER,
  OCS_INTERNAL_CR_NAME,
  CEPH_STORAGE_NAMESPACE,
  OCS_DEVICE_SET_REPLICA,
  ATTACHED_DEVICES_ANNOTATION,
} from '../../constants';
import { hasLabel, getName } from '@console/shared';
import { cephStorageLabel } from '../../selectors';
import {
  StorageClusterKind,
  StorageClusterResource,
  DeviceSet,
  ResourceConstraints,
} from '../../types';

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

export const createDeviceSet = (
  scName: string,
  osdSize: string,
  portable: boolean,
  resources?: ResourceConstraints,
): DeviceSet => ({
  name: `ocs-deviceset-${scName}`,
  count: 1,
  portable,
  replica: OCS_DEVICE_SET_REPLICA,
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
  storageClass: StorageClassResourceKind,
  storage: string,
  encrypted: boolean,
  isMinimal: boolean,
): StorageClusterKind => {
  const scName: string = getName(storageClass);
  const isNoProvisioner: boolean = storageClass.provisioner === NO_PROVISIONER;
  const isPortable: boolean = !isNoProvisioner;

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
      encryption: {
        enable: encrypted,
      },
      storageDeviceSets: [
        createDeviceSet(scName, storage, isPortable, isMinimal ? MIN_DEVICESET_RESOURCES : {}),
      ],
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
