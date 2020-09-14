import { K8sResourceCommon } from '@console/internal/module/k8s';

export enum DiskStates {
  Available = 'Available',
  NotAvailable = 'NotAvailable',
  Unknown = 'Unknown',
}

export type LocalVolumeDiscoveryResultKind = K8sResourceCommon & {
  spec: {
    nodeName: string;
  };
  status: {
    discoveredDevices: {
      deviceID: string;
      fstype: string;
      model: string;
      path: string;
      serial: string;
      size: number;
      status: {
        state: keyof typeof DiskStates;
      };
      type: string;
      vendor: string;
    };
  };
};

export type DiskMetadata = LocalVolumeDiscoveryResultKind['status']['discoveredDevices'];
