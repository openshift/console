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
  volumeMode?: string;
};

export type DiskMapping = {
  source: Source; // Disk ID
  target: Target;
  volumeMode?: string;
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
