export enum ProvisionSource {
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
  TINY = 'Tiny',
  SMALL = 'Small',
  MEDIUM = 'Medium',
  LARGE = 'Large',
  CUSTOM = 'Custom',
}

export enum Workload {
  DESKTOP = 'desktop',
  HIGH_PERFORMANCE = 'highperformance',
  SERVER = 'server',
}

export enum Provider {
  RHV = 'Red Hat Virtualisation (RHV)',
  VMware = 'VMware',
}
