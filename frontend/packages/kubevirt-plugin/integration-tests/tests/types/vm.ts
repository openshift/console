import {
  V1alpha1DataVolume,
  V1Disk,
  V1PersistentVolumeClaim,
  V1Volume,
} from '../../../src/types/api';
import { V1Network, V1NetworkInterface } from '../../../src/types/vm/index';
import { ProvisionSource } from '../utils/constants/enums/provisionSource';
import { Workload } from '../utils/constants/wizard';
import { CloudInitConfig, Disk, FlavorConfig, Network } from './types';

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
  templateNamespace?: string;
  flavor?: FlavorConfig;
  workload?: Workload;
  os?: string;
  pvcName?: string;
  provisionSource?: ProvisionSource;
  networks?: Network[];
  disks?: Disk[];
  cloudInit?: CloudInitConfig;
};

export type VMBuilderData = (BaseVMBuilderData | VMTemplateBuilderData) & {
  selectTemplateName?: string;
  waitForDiskImport?: boolean;
  startOnCreation?: boolean;
  template?: string;
  pvcSize?: string;
  customize?: boolean;
  mountAsCDROM?: boolean;
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

export type VMTemplateBuilderData = BaseVMBuilderData & { provider: string };

export type VMBuilderDataGenerationConfig = {
  flavor?: FlavorConfig[];
  workload?: Workload[];
  os?: string[];
};
