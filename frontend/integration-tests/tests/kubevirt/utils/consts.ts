
// TIMEOUTS
const SEC = 1000;
export const CLONE_VM_TIMEOUT = 300 * SEC;
export const PAGE_LOAD_TIMEOUT = 15 * SEC;
export const VM_ACTIONS_TIMEOUT = 120 * SEC;
export const VM_BOOTUP_TIMEOUT = 90 * SEC;
export const VM_STOP_TIMEOUT = 6 * SEC;
export const VM_IP_ASSIGNMENT_TIMEOUT = 180 * SEC;
export const WINDOWS_IMPORT_TIMEOUT = 150 * SEC;

export const POD_CREATION_TIMEOUT = 40 * SEC;
export const POD_TERMINATION_TIMEOUT = 30 * SEC;
export const POD_CREATE_DELETE_TIMEOUT = POD_CREATION_TIMEOUT + POD_TERMINATION_TIMEOUT;

export const NODE_STOP_MAINTENANCE_TIMEOUT = 40 * SEC;

// Exceptions
export const WAIT_TIMEOUT_ERROR = 'Wait Timeout Error.';

// Compute Nodes
export const NODE_MAINTENANCE_STATUS = 'Under maintenance';
export const NODE_STOPPING_MAINTENANCE_STATUS = 'Stopping maintenance';
export const NODE_READY_STATUS = 'Ready';
