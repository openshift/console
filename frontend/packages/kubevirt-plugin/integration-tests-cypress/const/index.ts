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

// VM Status
export enum VM_STATUS {
  Pending = 'Pending',
  Starting = 'Starting',
  Paused = 'Paused',
  Migrating = 'Migration',
  Stopping = 'Stopping',
  Running = 'Running',
  Off = 'Off',
}

export enum VM_ACTION_TIMEOUT {
  VM_BOOTUP = 180000,
  VM_IMPORT = 360000,
  VM_IMPORT_AND_BOOTUP = 540000,
}
