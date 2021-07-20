export const OS_IMAGES_NS = Cypress.env('DOWNSTREAM')
  ? 'openshift-virtualization-os-images'
  : 'kubevirt-os-images';

export const KUBEVIRT_STORAGE_CLASS_DEFAULTS = 'kubevirt-storage-class-defaults';
export const KUBEVIRT_PROJECT_NAME = 'openshift-cnv';
export const EXPECT_LOGIN_SCRIPT_PATH = './utils/expect-login.sh';

export const TEMPLATE_NAME = 'Red Hat Enterprise Linux 6.0+ VM';
export const TEMPLATE_BASE_IMAGE = 'rhel6';

export const TEST_PROVIDER = 'test-provider';
export const IMPORTING = 'Importing';
export const ADD_SOURCE = 'Add source';
export const COMMUNITY = 'Community';
export const PREPARING_FOR_CUSTOMIZATION = 'Preparing for customization';
export const READY_FOR_CUSTOMIZATION = 'Ready for customization';

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
}

export enum VMI_ACTION {
  Delete = 'Delete Virtual Machine Instance',
}

// VM Status
export enum VM_STATUS {
  Pending = 'Pending',
  Importing = 'Importing',
  Starting = 'Starting',
  Paused = 'Paused',
  Migrating = 'Migration',
  Stopping = 'Stopping',
  Running = 'Running',
  Cloning = 'Cloning',
  Off = 'Off',
}

export enum VM_ACTION_TIMEOUT {
  VM_BOOTUP = 180000,
  VM_IMPORT = 360000,
  VM_IMPORT_AND_BOOTUP = 900000,
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
