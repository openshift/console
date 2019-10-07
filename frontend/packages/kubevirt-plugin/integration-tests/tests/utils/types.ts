export type ProvisionOption = {
  method: string;
  source?: string;
};

export type NetworkResource = {
  name: string;
  mac: string;
  binding: string;
  networkDefinition: string;
};

export type StorageResource = {
  name: string;
  size: string;
  storageClass: string;
  attached?: boolean;
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
  namespace: string;
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
  namespace: string;
  description: string;
  provisionSource?: ProvisionOption;
  operatingSystem?: string;
  flavor?: string;
  workloadProfile?: string;
  cloudInit?: CloudInitConfig;
  storageResources?: StorageResource[];
  networkResources?: NetworkResource[];
};
