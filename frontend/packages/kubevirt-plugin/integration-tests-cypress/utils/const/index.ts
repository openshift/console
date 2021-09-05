export const OS_IMAGES_NS = Cypress.env('DOWNSTREAM')
  ? 'openshift-virtualization-os-images'
  : 'kubevirt-os-images';

export const KUBEVIRT_STORAGE_CLASS_DEFAULTS = 'kubevirt-storage-class-defaults';
export const KUBEVIRT_PROJECT_NAME = 'openshift-cnv';
export const EXPECT_LOGIN_SCRIPT_PATH = './utils/expect-login.sh';

export const TEST_PROVIDER = 'test-provider';
export const IMPORTING = 'Importing';
export const ADD_SOURCE = 'Add source';
export const COMMUNITY = 'Community';
export const PREPARING_FOR_CUSTOMIZATION = 'Preparing for customization';
export const READY_FOR_CUSTOMIZATION = 'Ready for customization';
export const YAML_VM_NAME = 'vm-example';
export const STATUS_READY = 'Ready';
export const TEMPLATE_SUPPORT = 'Support by template provider';

export enum DEFAULTS_VALUES {
  NOT_AVAILABLE = 'Not available',
  GUEST_AGENT_REQUIRED = 'Guest agent required',
  VM_NOT_RUNNING = 'Virtual machine not running',
}

// VM Actions
export enum VM_ACTION {
  Cancel = 'Cancel Virtual Machine Migration',
  Clone = 'Clone Virtual Machine',
  Delete = 'Delete Virtual Machine',
  EditAnnotations = 'Edit Annotations',
  EditLabels = 'Edit Labels',
  Migrate = 'Migrate Virtual Machine',
  Restart = 'Restart Virtual Machine',
  Start = 'Start Virtual Machine',
  Stop = 'Stop Virtual Machine',
  Unpause = 'Unpause Virtual Machine',
  Pause = 'Pause Virtual Machine',
}

export enum VMI_ACTION {
  Delete = 'Delete Virtual Machine Instance',
}

export enum TEMPLATE_ACTION {
  Create = 'Create Virtual Machine',
}

// VM Status
export enum VM_STATUS {
  Pending = 'Pending',
  Importing = 'Importing',
  Starting = 'Starting',
  Provisioning = 'Provisioning',
  Paused = 'Paused',
  Migrating = 'Migration',
  Stopping = 'Stopping',
  Running = 'Running',
  Cloning = 'Cloning',
  Stopped = 'Stopped',
}

export enum VM_ACTION_TIMEOUT {
  VM_BOOTUP = 180000,
  VM_IMPORT = 360000,
  VM_IMPORT_AND_BOOTUP = 1200000,
  VM_MIGRATE = 600000,
}

export enum Flavor {
  TINY = 'Tiny',
  SMALL = 'Small',
  MEDIUM = 'Medium',
  LARGE = 'Large',
  CUSTOM = 'Custom',
}

export enum DISK_INTERFACE {
  VirtIO = 'virtio',
  sata = 'sata',
  scsi = 'scsi',
}

export enum DISK_DRIVE {
  Disk = 'Disk',
  CDROM = 'CD-ROM',
}

export const TEMPLATE = {
  RHEL6: {
    name: 'Red Hat Enterprise Linux 6.0+ VM',
    dvName: 'rhel6',
    metadataName: 'rhel6-server-small',
    os: 'Red Hat Enterprise Linux 6.0 or higher',
    supportLevel: 'Full',
  },
  RHEL7: {
    name: 'Red Hat Enterprise Linux 7.0+ VM',
    dvName: 'rhel7',
    metadataName: 'rhel7-server-small',
    os: 'Red Hat Enterprise Linux 7.0 or higher',
    supportLevel: 'Full',
  },
  RHEL8: {
    name: 'Red Hat Enterprise Linux 8.0+ VM',
    dvName: 'rhel8',
    metadataName: 'rhel8-server-small',
    os: 'Red Hat Enterprise Linux 8.0 or higher',
    supportLevel: 'Full',
  },
  RHEL9: {
    name: 'Red Hat Enterprise Linux 9.0 Alpha VM',
    dvName: 'rhel9',
    metadataName: 'rhel9-server-small',
    os: 'Red Hat Enterprise Linux 9.0 or higher',
    supportLevel: 'Limited',
  },
  FEDORA: {
    name: 'Fedora 32+ VM',
    dvName: 'fedora',
    metadataName: 'fedora-server-small',
    os: 'Fedora 32 or higher',
    supportLevel: 'Community',
  },
  CENTOS7: {
    name: 'CentOS 7.0+ VM',
    dvName: 'centos7',
    metadataName: 'centos7-server-small',
    os: 'CentOS 7 or higher',
    supportLevel: 'Community',
  },
  WIN10: {
    name: 'Microsoft Windows 10 VM',
    dvName: 'win10',
    metadataName: 'windows10-desktop-medium',
    os: 'Microsoft Windows 10',
    supportLevel: 'Full',
  },
  WIN2K12R2: {
    name: 'Microsoft Windows Server 2012 R2 VM',
    dvName: 'win2k12r2',
    metadataName: 'windows2k12r2-server-medium',
    os: 'Microsoft Windows Server 2012 R2',
    supportLevel: 'Full',
  },
  DEFAULT: {
    name: 'vm-template-example',
    dvName: 'vm-template-example',
    metadataName: 'vm-template-example',
    os: 'Red Hat Enterprise Linux 8.0 or higher',
    supportLevel: 'Full',
  },
};
