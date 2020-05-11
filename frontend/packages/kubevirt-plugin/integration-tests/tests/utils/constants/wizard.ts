export enum ProvisionConfigName {
  URL = 'URL',
  CONTAINER = 'Container',
  PXE = 'PXE',
  DISK = 'Disk',
  CLONED_DISK = 'ClonedDisk',
}

export enum OperatingSystem {
  RHEL7 = 'Red Hat Enterprise Linux 7.0 or higher',
  WINDOWS_10 = 'Microsoft Windows 10',
  VALIDATION_TEST = 'Validation Test',
}

export const OSIDLookup = {
  [OperatingSystem.WINDOWS_10]: 'win10',
};

export enum Flavor {
  TINY = 'tiny',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  CUSTOM = 'Custom',
}

export enum WorkloadProfile {
  DESKTOP = 'desktop',
  HIGH_PERFORMANCE = 'highperformance',
  SERVER = 'server',
}
