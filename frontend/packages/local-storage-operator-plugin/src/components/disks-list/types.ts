import { K8sResourceCommon } from '@console/internal/module/k8s';
import { DiskMechanicalProperties } from '../local-volume-set/types';

export enum DiskStates {
  Available = 'Available',
  NotAvailable = 'NotAvailable',
  Unknown = 'Unknown',
}

export type DiskMetadata = {
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
  property: keyof typeof DiskMechanicalProperties;
};

export type LocalVolumeDiscoveryResultKind = K8sResourceCommon & {
  spec: {
    nodeName: string;
  };
  status: {
    discoveredDevices: DiskMetadata[];
  };
};
