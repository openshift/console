export const VM_STATUS_OFF = 'VM_STATUS_OFF';
export const VM_STATUS_RUNNING = 'VM_STATUS_RUNNING';
export const VM_STATUS_STARTING = 'VM_STATUS_STARTING';
export const VM_STATUS_VMI_WAITING = 'VM_STATUS_VMI_WAITING';
export const VM_STATUS_IMPORTING = 'VM_STATUS_IMPORTING';
export const VM_STATUS_STOPPING = 'VM_STATUS_STOPPING';
export const VM_STATUS_PAUSED = 'VM_STATUS_PAUSED';

export const VM_STATUS_V2V_CONVERSION_IN_PROGRESS = 'VM_STATUS_CONVERSION_IN_PROGRESS';
export const VM_STATUS_V2V_CONVERSION_PENDING = 'VM_STATUS_CONVERSION_PENDING';
export const VM_STATUS_V2V_CONVERSION_ERROR = 'VM_STATUS_CONVERSION_FAILED';

export const VM_STATUS_V2V_VM_IMPORT_IN_PROGRESS = 'VM_STATUS_V2V_VM_IMPORT_IN_PROGRESS';
export const VM_STATUS_V2V_VM_IMPORT_ERROR = 'VM_STATUS_V2V_VM_IMPORT_ERROR';

export const VM_STATUS_POD_ERROR = 'VM_STATUS_POD_ERROR';
export const VM_STATUS_ERROR = 'VM_STATUS_ERROR';
export const VM_STATUS_IMPORT_ERROR = 'VM_STATUS_IMPORT_ERROR';
export const VM_STATUS_UNKNOWN = 'VM_STATUS_UNKNOWN';
export const VM_STATUS_MIGRATING = 'VM_STATUS_MIGRATING';
export const VM_STATUS_IMPORT_PENDING = 'VM_STATUS_IMPORT_PENDING';

export const CONVERSION_PROGRESS_ANNOTATION = 'v2vConversionProgress';
export const VM_IMPORT_PROGRESS_ANNOTATION = 'vmimport.v2v.kubevirt.io/progress';

export const VM_STATUS_FILTER_STRINGS = [
  'Pending',
  'Importing',
  'Error',
  'Starting',
  'Migrating',
  'Stopping',
  'Running',
  'Off',
  'Other',
];

export const getVMStatusSortString = (vmStatus) => {
  switch (vmStatus.status) {
    case VM_STATUS_V2V_CONVERSION_PENDING:
      return 'Pending (Import VMware)';
    case VM_STATUS_IMPORT_PENDING:
      return 'Pending (Import)';
    case VM_STATUS_V2V_VM_IMPORT_IN_PROGRESS:
      return 'Importing (Red Hat Virtualization)';
    case VM_STATUS_V2V_CONVERSION_IN_PROGRESS:
      return 'Importing (VMware)';
    case VM_STATUS_V2V_VM_IMPORT_ERROR:
      return 'Error (Import Red Hat Virtualization)';
    case VM_STATUS_V2V_CONVERSION_ERROR:
      return 'Error (Import VMware)';
    case VM_STATUS_POD_ERROR:
      return 'Error (Pod)';
    case VM_STATUS_ERROR:
      return 'Error (VM)';
    case VM_STATUS_IMPORT_ERROR:
      return 'Error (Import)';
    case VM_STATUS_IMPORTING:
      return 'Importing';
    case VM_STATUS_VMI_WAITING:
      return 'Pending';
    case VM_STATUS_STARTING:
      return 'Starting';
    case VM_STATUS_MIGRATING:
      return 'Migrating';
    case VM_STATUS_STOPPING:
      return 'Stopping';
    case VM_STATUS_RUNNING:
      return 'Running';
    case VM_STATUS_OFF:
      return 'Off';
    default:
      return 'Other';
  }
};
