import { K8sResourceKind, K8sResourceCommon } from '@console/internal/module/k8s';

export type WatchCephResource = {
  ceph: K8sResourceKind[];
};

export type CephClusterKind = K8sResourceCommon & {
  status: {
    storage: {
      deviceClasses: CephDeviceClass[];
    };
    phase?: string;
  };
};

type CephDeviceClass = {
  name: string;
};

export type StoragePoolKind = K8sResourceCommon & {
  spec: {
    compressionMode?: string;
    deviceClass?: string;
    replicated: {
      size: number;
    };
    parameters?: {
      compression_mode: string;
    };
  };
  status?: {
    phase?: string;
  };
};

export type OCSStorageClusterKind = K8sResourceCommon & {
  spec: {
    monDataDirHostPath?: string;
    manageNodes: boolean;
    storageDeviceSets: StorageDeviceSet[];
  };
  status?: {
    phase: string;
  };
};

type StorageDeviceSet = {
  name: string;
  count: number;
  replica: number;
  resources: {};
  placement: {};
  portable: boolean;
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
