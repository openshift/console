import { FlavorConfig, Network, Disk, CloudInitConfig } from './types';
import { V1Disk } from '../../../src/types/vm/disk/V1Disk';
import { V1Volume } from '../../../src/types/vm/disk/V1Volume';
import { V1alpha1DataVolume } from '../../../src/types/vm/disk/V1alpha1DataVolume';
import { V1PersistentVolumeClaim } from '../../../src/types/vm/disk/V1PersistentVolumeClaim';
import { V1Network, V1NetworkInterface } from '../../../src/types/vm/index';
import { OperatingSystem, Workload } from '../utils/constants/wizard';
import { ProvisionSource } from '../utils/constants/enums/provisionSource';

// The following types TestNetwork and TestDisk are currently not user
export type TestNetwork = {
  network: V1Network;
  nic: V1NetworkInterface;
};

export type TestDisk = {
  disk: V1Disk;
  volume: V1Volume;
  dataVolume?: V1alpha1DataVolume;
  pvc?: V1PersistentVolumeClaim;
};

export type BaseVMBuilderData = {
  name?: string;
  description?: string;
  namespace?: string;
  template?: string;
  flavor?: FlavorConfig;
  workload?: Workload;
  os?: OperatingSystem;
  provisionSource?: ProvisionSource;
  networks?: Network[];
  disks?: Disk[];
  cloudInit?: CloudInitConfig;
};

export type VMBuilderData = BaseVMBuilderData & {
  waitForDiskImport?: boolean;
  startOnCreation?: boolean;
  template?: string;
};

export type KubevirtResourceConfig = {
  name: string;
  description?: string;
  flavorConfig: FlavorConfig;
  template?: string;
  provisionSource?: ProvisionSource;
  operatingSystem?: string;
  workloadProfile?: string;
  startOnCreation?: boolean;
  waitForDiskImport?: boolean;
  cloudInit?: CloudInitConfig;
  storageResources: Disk[];
  CDRoms?: Disk[];
  networkResources: Network[];
  bootableDevice?: string;
};

export type VMTemplateBuilderData = BaseVMBuilderData;

export type VMBuilderDataGenerationConfig = {
  flavor?: FlavorConfig[];
  workload?: Workload[];
  os?: OperatingSystem[];
};
