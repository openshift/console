import { DISK_DRIVE, DISK_SOURCE, Flavor } from '../const/index';
import { ProvisionSource } from '../enums/provisionSource';

export type Disk = {
  name?: string;
  size?: string;
  storageClass?: string;
  interface?: string;
  drive?: DISK_DRIVE;
  advanced?: {
    volumeMode?: string;
    accessMode?: string;
  };
  source?: DISK_SOURCE;
  bootable?: boolean;
};

export type Network = {
  name?: string;
  model?: string;
  mac?: string;
  nad: string;
  network?: string;
  type?: string;
};

export type CloudInitConfig = {
  useCustomScript?: boolean;
  customScript?: string;
  hostname?: string;
  sshKeys?: string[];
  password?: string;
};

export type VirtualMachineData = {
  name?: string;
  description?: string;
  namespace?: string;
  template?: string;
  templateNamespace?: string;
  flavor?: Flavor;
  os?: string;
  pvcName?: string;
  pvcNS?: string;
  pvcSize?: string;
  provisionSource?: ProvisionSource;
  networks?: Network[];
  disks?: Disk[];
  cloudInit?: CloudInitConfig;
  cdrom?: boolean;
  sshEnable?: boolean;
  startOnCreation?: boolean;
  sourceAvailable?: boolean;
};
