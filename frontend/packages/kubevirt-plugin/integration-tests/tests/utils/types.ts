import { DISK_SOURCE } from './consts';

export type ProvisionOption = {
  method: string;
  source?: string;
};

export type NetworkResource = {
  name: string;
  model: string;
  mac: string;
  network: string;
  type: string;
};

export type DiskSourceConfig = {
  PVCName?: string;
  PVCNamespace?: string;
  URL?: string;
  container?: string;
};

export type StorageResource = {
  name: string;
  size?: string;
  storageClass: string;
  interface: string;
  sourceConfig?: DiskSourceConfig;
  source?: DISK_SOURCE;
};

export type CloudInitConfig = {
  useCloudInit: boolean;
  useCustomScript?: boolean;
  customScript?: string;
  hostname?: string;
  sshKey?: string;
};

export type NodePortService = {
  name: string;
  namespace: string;
  kind: string;
  port: string;
  targetPort: string;
  exposeName: string;
  type: string;
};

export type VMConfig = {
  name: string;
  description: string;
  template?: string;
  provisionSource?: ProvisionOption;
  operatingSystem?: string;
  flavor?: string;
  workloadProfile?: string;
  startOnCreation: boolean;
  cloudInit: CloudInitConfig;
  storageResources: StorageResource[];
  networkResources: NetworkResource[];
};

export type ProvisionConfig = {
  provision: ProvisionOption;
  networkResources: NetworkResource[];
  storageResources: StorageResource[];
};

export type VMTemplateConfig = {
  name: string;
  description: string;
  provisionSource?: ProvisionOption;
  operatingSystem?: string;
  flavor?: string;
  workloadProfile?: string;
  cloudInit?: CloudInitConfig;
  storageResources?: StorageResource[];
  networkResources?: NetworkResource[];
};
