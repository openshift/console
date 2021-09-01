export const OS_IMAGES_NS = Cypress.env('DOWNSTREAM')
  ? 'openshift-virtualization-os-images'
  : 'kubevirt-os-images';

export const KUBEVIRT_STORAGE_CLASS_DEFAULTS = 'kubevirt-storage-class-defaults';
export const KUBEVIRT_PROJECT_NAME = 'openshift-cnv';
export const EXPECT_LOGIN_SCRIPT_PATH = './utils/expect-login.sh';

export const TEMPLATE_NAME = 'Red Hat Enterprise Linux 6.0+ VM';
export const TEMPLATE_BASE_IMAGE = 'rhel6';
export const TEMPLATE_METADATA_NAME = 'rhel6-server-small';

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

export enum DISK_SOURCE {
  AttachDisk = 'Use an existing PVC',
  AttachClonedDisk = 'Clone existing PVC',
  Blank = 'Blank',
  Container = 'Import via Registry (creates PVC)',
  EphemeralContainer = 'Container (ephemeral)',
  Url = 'Import via URL',
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

export enum OS {
  fedora = 'Fedora 32 or higher',
  win10 = 'Microsoft Windows 10',
  win2k12 = 'Microsoft Windows Server 2012 R2',
  rhel8 = 'Red Hat Enterprise Linux 8.0 or higher',
}
