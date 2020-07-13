import { DISK_SOURCE, POD_STATUS, VM_STATUS } from './consts';
import { Flavor, OperatingSystem, WorkloadProfile } from './constants/wizard';
import { K8sKind } from '@console/internal/module/k8s';

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
  name?: string;
  size?: string;
  storageClass: string;
  interface: string;
  advanced?: {
    volumeMode?: string;
    accessMode?: string;
  };
  sourceConfig?: DiskSourceConfig;
  source?: DISK_SOURCE;
};

export type FlavorConfig = {
  flavor: Flavor;
  memory?: string;
  cpu?: string;
};

export type CloudInitConfig = {
  useCloudInit: boolean;
  useCustomScript?: boolean;
  customScript?: string;
  hostname?: string;
  sshKeys?: string[];
  password?: string;
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

export type KubevirtResourceConfig = {
  name: string;
  description?: string;
  flavorConfig: FlavorConfig;
  template?: string;
  provisionSource?: ProvisionOption;
  operatingSystem?: string;
  workloadProfile?: string;
  startOnCreation?: boolean;
  waitForDiskImport?: boolean;
  cloudInit?: CloudInitConfig;
  storageResources: StorageResource[];
  CDRoms?: StorageResource[];
  networkResources: NetworkResource[];
  bootableDevice?: string;
};

export type vmwareConfig = {
  instance?: string;
  hostname?: string;
  username?: string;
  password?: string;
  saveInstance?: boolean;
};

export type rhvConfig = {
  instance?: string;
  apiUrl?: string;
  certificate?: string;
  username?: string;
  password?: string;
  cluster?: string;
  saveInstance?: boolean;
};

export type InstanceConfig = vmwareConfig | rhvConfig;

export type VMImportConfig = {
  name: string;
  provider: string;
  instanceConfig: InstanceConfig;
  sourceVMName: string;
  description?: string;
  operatingSystem?: OperatingSystem;
  flavorConfig?: FlavorConfig;
  workloadProfile?: WorkloadProfile;
  storageResources?: StorageResource[];
  networkResources?: NetworkResource[];
  cloudInit?: CloudInitConfig;
};

export type BaseVMConfig = {
  operatingSystem: OperatingSystem;
  flavorConfig: FlavorConfig;
  workloadProfile: WorkloadProfile;
  sourceURL: string;
  sourceContainer: string;
  cloudInitScript: string;
};

export type ProvisionConfig = {
  provision: ProvisionOption;
  networkResources: NetworkResource[];
  storageResources: StorageResource[];
  CDRoms?: StorageResource[];
};

export type Status = VM_STATUS | POD_STATUS;

// Not an actual type, since VM Templates are just templates
// Used as a convenience type for VirtualMachineTemplate class
// and distinguishing it from VirtualMachine/VirtualMachineInstance
// and for UI navigation purposes
export const VirtualMachineTemplateModel: K8sKind = {
  label: 'Virtual Machine Template',
  labelPlural: 'Virtual Machine Templates',
  apiVersion: 'v1alpha3',
  apiGroup: 'kubevirt.io',
  plural: 'vmtemplates',
  abbr: '',
  namespaced: true,
  kind: 'Template',
  id: 'template',
};
