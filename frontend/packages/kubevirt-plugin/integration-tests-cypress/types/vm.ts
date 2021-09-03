import { ProvisionSource } from '../utils/const/provisionSource';

export type Disk = {
  name?: string;
  size?: string;
  storageClass?: string;
  interface?: string;
  drive?: string;
  advanced?: {
    volumeMode?: string;
    accessMode?: string;
  };
  source?: ProvisionSource;
  bootable?: boolean;
  preallocation?: boolean;
  autoDetach?: boolean;
  provisionSource?: ProvisionSource;
  pvcName?: string;
  pvcNS?: string;
  description?: string;
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
  yamlView?: boolean;
  userName?: string;
  password?: string;
  hostname?: string;
  customScript?: string;
  sshKeys?: string[];
};

export type Template = {
  name?: string;
  dvName?: string;
  metadataName?: string;
  os?: string;
  supportLevel?: string;
};

export type VirtualMachineData = {
  name?: string;
  description?: string;
  namespace?: string;
  template?: Template;
  templateProvider?: string;
  templateSupport?: boolean;
  templateNamespace?: string;
  flavor?: string;
  os?: string;
  pvcName?: string;
  pvcNS?: string;
  pvcSize?: string;
  provisionSource?: ProvisionSource;
  networkInterfaces?: Network[];
  disks?: Disk[];
  cloudInit?: CloudInitConfig;
  cdrom?: boolean;
  sshEnable?: boolean;
  startOnCreation?: boolean;
  sourceAvailable?: boolean;
};
