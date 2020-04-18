import { K8sResourceCondition, K8sResourceKind } from '@console/internal/module/k8s';

type Source = {
  id: string;
};

type Target = {
  name?: string;
};

export type NetworkMapping = {
  source: Source; // NIC ID
  target?: Target;
  type: string;
};

export type StorageMapping = {
  source: Source; // Storage Domain ID
  target: Target;
};

export type DiskMapping = {
  source: Source; // Disk ID
  target: Target;
};

export type VMImportOvirtSource = {
  vm: {
    id?: string;
    name?: string;
    cluster?: {
      name?: string;
      id?: string;
    };
  };
  mappings: {
    networkMappings?: NetworkMapping[];
    storageMappings?: StorageMapping[];
    diskMappings?: DiskMapping[];
  };
};

export type VMImportKind = {
  spec: {
    targetVmName?: string;
    startVm?: boolean;
    providerCredentialsSecret: {
      name: string;
      namespace?: string;
    };
    resourceMapping: {
      name: string;
      namespace?: string;
    };
    source: {
      ovirt: VMImportOvirtSource;
    };
  };
  status?: {
    targetVmName: string;
    dataVolumes: string[];
    conditions: K8sResourceCondition[];
  };
} & K8sResourceKind;
