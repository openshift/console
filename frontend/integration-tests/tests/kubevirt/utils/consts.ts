export const DASHES = '---';
export const STORAGE_CLASS = process.env.STORAGE_CLASS;

export const KUBEADMIN_IDP = 'kube:admin';
export const KUBEADMIN_USERNAME = 'kubeadmin';
export const {
  BRIDGE_HTPASSWD_IDP = 'test',
  BRIDGE_HTPASSWD_USERNAME = 'test',
  BRIDGE_HTPASSWD_PASSWORD = 'test',
  BRIDGE_KUBEADMIN_PASSWORD,
  KUBECONFIG,
} = process.env;

// TIMEOUTS
const SEC = 1000;
export const CLONE_VM_TIMEOUT = 300 * SEC;
export const CLONED_VM_BOOTUP_TIMEOUT = 150 * SEC;
export const PAGE_LOAD_TIMEOUT = 15 * SEC;
export const TEMPLATE_ACTIONS_TIMEOUT = 90 * SEC;
export const VM_ACTIONS_TIMEOUT = 180 * SEC;
export const VM_BOOTUP_TIMEOUT = 120 * SEC;
export const VM_MIGRATION_TIMEOUT = 150 * SEC;
export const VM_STOP_TIMEOUT = 10 * SEC;
export const VM_IP_ASSIGNMENT_TIMEOUT = 180 * SEC;
export const WINDOWS_IMPORT_TIMEOUT = 150 * SEC;

export const POD_CREATION_TIMEOUT = 40 * SEC;
export const POD_TERMINATION_TIMEOUT = 30 * SEC;
export const POD_CREATE_DELETE_TIMEOUT = POD_CREATION_TIMEOUT + POD_TERMINATION_TIMEOUT;

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

// Network tab columns in VM Wizard
export const networkWizardTabCol = {
  name: 0,
  mac: 1,
  networkDefinition: 2,
  binding: 3,
};

// Network tab columns in detail view
export const networkTabCol = {
  name: 0,
  model: 1,
  networkDefinition: 2,
  binding: 3,
  mac: 4,
};

// Storage tab columns in VM Wizard
export const diskWizardTabCol = {
  name: 0,
  size: 1,
  storageClass: 2,
};

// Network tab columns in detail view
export const diskTabCol = {
  name: 0,
  size: 1,
  interface: 2,
  storageClass: 3,
};
