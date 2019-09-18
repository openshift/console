export const DASH = '-';
export const { STORAGE_CLASS = 'nfs-sc' } = process.env;

// TIMEOUTS
const SEC = 1000;
export const CLONE_VM_TIMEOUT_SECS = 300 * SEC;
export const CLONED_VM_BOOTUP_TIMEOUT_SECS = 150 * SEC;
export const PAGE_LOAD_TIMEOUT_SECS = 15 * SEC;
export const TEMPLATE_ACTIONS_TIMEOUT_SECS = 90 * SEC;
export const VM_ACTIONS_TIMEOUT_SECS = 250 * SEC;
export const VM_BOOTUP_TIMEOUT_SECS = 200 * SEC;
export const VM_MIGRATION_TIMEOUT_SECS = 190 * SEC;
export const VM_STOP_TIMEOUT_SECS = 10 * SEC;
export const VM_IP_ASSIGNMENT_TIMEOUT_SECS = 180 * SEC;
export const WINDOWS_IMPORT_TIMEOUT_SECS = 150 * SEC;

export const POD_CREATION_TIMEOUT_SECS = 40 * SEC;
export const POD_TERMINATION_TIMEOUT_SECS = 30 * SEC;
export const POD_CREATE_DELETE_TIMEOUT_SECS =
  POD_CREATION_TIMEOUT_SECS + POD_TERMINATION_TIMEOUT_SECS;

export const NODE_STOP_MAINTENANCE_TIMEOUT = 40 * SEC;

// Web-UI Exceptions
export const WAIT_TIMEOUT_ERROR = 'Wait Timeout Error.';
export const WIZARD_CREATE_VM_ERROR = 'Creating VM failed';
export const WIZARD_CREATE_TEMPLATE_ERROR = 'Creating Template failed';

// Framework Exception
export const UNEXPECTED_ACTION_ERROR = 'Received unexpected action.';

// Compute Nodes
export const NODE_MAINTENANCE_STATUS = 'Under maintenance';
export const NODE_STOPPING_MAINTENANCE_STATUS = 'Stopping maintenance';
export const NODE_READY_STATUS = 'Ready';

// Wizard dialog
export const WIZARD_TABLE_FIRST_ROW = 1;

// Tab names
export const TABS = {
  OVERVIEW: 'Overview',
  YAML: 'YAML',
  CONSOLES: 'Consoles',
  EVENTS: 'Events',
  DISKS: 'Disks',
  NICS: 'Network Interfaces',
};
Object.freeze(TABS);

// Tab names
export const VMACTIONS = {
  START: 'Start',
  STOP: 'Stop',
  CLONE: 'Clone',
  RESTART: 'Restart',
  MIGRATE: 'Events',
  DELETE: 'Delete',
};
Object.freeze(VMACTIONS);

// Network tab columns in VM Wizard
export const networkWizardTabCol = {
  name: 0,
  mac: 1,
  networkDefinition: 2,
  binding: 3,
};
Object.freeze(networkWizardTabCol);

// Network tab columns in detail view
export const networkTabCol = {
  name: 0,
  model: 1,
  networkDefinition: 2,
  binding: 3,
  mac: 4,
};
Object.freeze(networkTabCol);

// Storage tab columns in VM Wizard
export const diskWizardTabCol = {
  name: 0,
  size: 1,
  storageClass: 2,
};
Object.freeze(diskWizardTabCol);

// Network tab columns in detail view
export const diskTabCol = {
  name: 0,
  size: 1,
  interface: 2,
  storageClass: 3,
};
Object.freeze(diskTabCol);
