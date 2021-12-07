export enum TAB {
  Overview = 'Overview',
  Details = 'Details',
  Console = 'Console',
  Disks = 'Disks',
  Events = 'Events',
  NetworkInterfaces = 'Network Interfaces',
  Yaml = 'YAML',
  Environment = 'Environment',
  Snapshots = 'Snapshots',
}

export enum VM_ACTION {
  Cancel = 'Cancel Migration',
  Clone = 'Clone',
  Delete = 'Delete',
  EditAnnotations = 'Edit Annotations',
  EditLabels = 'Edit Labels',
  Migrate = 'Migrate',
  Restart = 'Restart',
  Start = 'Start',
  Stop = 'Stop',
  Unpause = 'Unpause',
}

export enum VMI_ACTION {
  Delete = 'Delete Virtual Machine Instance',
  EditAnnotations = 'Edit Annotations',
  EditLabels = 'Edit Labels',
}

export enum VMT_ACTION {
  Create = 'Create Virtual Machine',
  Delete = 'Delete Template',
  Edit = 'Edit VM Template',
}

export enum VM_STATUS {
  Error = 'Error',
  Pending = 'Pending',
  Importing = 'Importing',
  Other = 'Other',
  Starting = 'Starting',
  Paused = 'Paused',
  Migrating = 'Migration',
  Stopping = 'Stopping',
  Running = 'Running',
  Provisioning = 'Provisioning',
  Stopped = 'Stopped',
}

// Network
export enum NIC_MODEL {
  VirtIO = 'virtio',
  e1000e = 'e1000e',
}

export enum NIC_TYPE {
  bridge = 'Bridge',
  masquerade = 'Masquerade',
  sriov = 'SR-IOV',
}

export const networkTabCol = {
  name: 0,
  model: 1,
  network: 2,
  type: 3,
  mac: 4,
};
Object.freeze(networkTabCol);

// Storage
export enum DISK_SOURCE {
  AttachDisk = 'Use an existing PVC',
  AttachClonedDisk = 'Clone existing PVC',
  Blank = 'Blank',
  Container = 'Import via Registry (creates PVC)',
  EphemeralContainer = 'Container (ephemeral)',
  Url = 'Import via URL',
}

export enum DISK_DRIVE {
  Disk = 'Disk',
  CDROM = 'CD-ROM',
}

export const diskAccessMode = {
  ReadWriteOnce: {
    value: 'ReadWriteOnce',
    label: 'Single User (RWO)',
  },
  ReadWriteMany: {
    value: 'ReadWriteMany',
    label: 'Shared Access (RWX)',
  },
  ReadOnlyMany: {
    value: 'ReadOnlyMany',
    label: 'Read Only (ROX)',
  },
};

export enum DISK_INTERFACE {
  VirtIO = 'virtio',
  sata = 'sata',
  scsi = 'scsi',
}

export const diskVolumeMode = {
  Block: 'Block',
  Filesystem: 'Filesystem',
};

export const diskTabCol = {
  name: 0,
  source: 1,
  size: 2,
  drive: 3,
  interface: 4,
  storageClass: 5,
};
Object.freeze(diskTabCol);

export const wrongValues = ['Capitalletter', 'dashattheend-', ''];
