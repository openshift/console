import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  NO_PROVISIONER,
  OCS_INTERNAL_CR_NAME,
  CEPH_STORAGE_NAMESPACE,
  OCS_DEVICE_SET_REPLICA,
  ATTACHED_DEVICES_ANNOTATION,
} from '../../constants';

export const createDeviceSet = (scName: string, osdSize: string, portable: boolean): DeviceSet => ({
  name: `ocs-deviceset-${scName}`,
  count: 1,
  portable,
  replica: OCS_DEVICE_SET_REPLICA,
  resources: {},
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
  scName: string,
  storage: string,
  encrypted?: boolean,
  provisioner?: string,
): K8sResourceKind => {
  const requestData = {
    apiVersion: 'ocs.openshift.io/v1',
    kind: 'StorageCluster',
    metadata: {
      name: OCS_INTERNAL_CR_NAME,
      namespace: CEPH_STORAGE_NAMESPACE,
    },
    spec: {
      manageNodes: false,
      encryption: {
        enable: encrypted,
      },
      storageDeviceSets: [createDeviceSet(scName, storage, true)],
    },
  } as K8sResourceKind;

  if (provisioner === NO_PROVISIONER) {
    requestData.spec.monDataDirHostPath = '/var/lib/rook';
    requestData.spec.storageDeviceSets[0].portable = false;
    requestData.metadata = {
      ...requestData.metadata,
      annotations: {
        [ATTACHED_DEVICES_ANNOTATION]: 'true',
      },
    };
  }
  return requestData;
};

export type DeviceSet = {
  name: string;
  count: number;
  replica: number;
  resources?: any;
  placement?: any;
  portable: boolean;
  encryption?: { [key: string]: any };
  dataPVCTemplate: {
    spec: {
      storageClassName: string;
      accessModes: string[];
      volumeMode: string;
      resources: {
        requests: {
          storage: string;
        };
      };
    };
  };
};
