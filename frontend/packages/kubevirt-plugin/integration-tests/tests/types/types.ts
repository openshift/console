import { DISK_SOURCE, DISK_DRIVE, VM_STATUS } from '../utils/constants/vm';
import { Flavor, OperatingSystem, Workload } from '../utils/constants/wizard';
import { K8sKind } from '@console/internal/module/k8s';
import { POD_STATUS } from '../utils/constants/pod';

export type ProvisionSource = {
  method: string;
  source?: string;
};

export type Network = {
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

export type Disk = {
  name?: string;
  size?: string;
  storageClass?: string;
  interface: string;
  drive: DISK_DRIVE;
  advanced?: {
    volumeMode?: string;
    accessMode?: string;
  };
  sourceConfig?: DiskSourceConfig;
  source?: DISK_SOURCE;
  bootable?: boolean;
};

export type FlavorConfig = {
  flavor: Flavor;
  memory?: string;
  cpu?: string;
};

export type CloudInitConfig = {
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
  workloadProfile?: Workload;
  storageResources?: Disk[];
  networkResources?: Network[];
  cloudInit?: CloudInitConfig;
  startOnCreation?: boolean;
};

export type BaseVMConfig = {
  operatingSystem: OperatingSystem;
  flavorConfig: FlavorConfig;
  workloadProfile: Workload;
  sourceURL: string;
  sourceContainer: string;
  cloudInitScript: string;
};

export type ProvisionConfig = {
  provision: ProvisionSource;
  networkResources: Network[];
  storageResources: Disk[];
  CDRoms?: Disk[];
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
