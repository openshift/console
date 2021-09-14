export enum detailsTab {
  // general fields
  vmName = '[data-test-selector="details-item-value__Name"]',
  vmNS = '[data-test-selector="details-item-label__Namespace"]',
  vmLabels = '[data-test="label-list"]',
  vmDesc = '[data-test-id="details-Description"]',
  vmOS = '[data-test-id="details-Operating System"]',
  vmTemplate = '[data-test-id="details-Template"]',
  vmOwner = '[data-test-selector="details-item-value__Owner"]',
  vmStatus = '[data-test="status-text"]',
  vmPrintableStatus = '[data-test="vm-printable-status-text"]',
  vmPod = '[data-test-id="details-Pod"]',
  vmBootOrder = '[data-test-id="details-Boot Order"]',
  vmIP = '[data-test-id="details-IP Address"]',
  vmHostname = '[data-test-id="details-Hostname"]',
  vmTimezone = '[data-test-id="details-Time Zone"]',
  vmNode = '[data-test-id="details-Node"]',
  vmWorkProfile = '[data-test-id="details-Workload Profile"]',
}

export enum actionButtons {
  actionDropdownButton = 'actions-menu-button',
  confirmButton = '[data-test="confirm-action"]',
  cancelButton = '[data-test-id="modal-cancel-action"]',
  confirmCloneButton = 'button[id="confirm-action"]',
  kebabButton = 'kebab-button',
}

// modal
export const modalTitle = '[data-test-id="modal-title"]';
export const modalConfirm = '[data-test="confirm-action"]';
export const modalCancel = '[data-test-id="modal-cancel-action"]';
export const startOnClone = 'input[id="clone-dialog-vm-start"]';

// alert
export const alertTitle = '.pf-c-alert__title';
export const errorAlert = '.pf-c-alert.pf-m-inline.pf-m-danger.co-alert.co-alert--scrollable';
export const warningAlert = '.pf-c-alert.pf-m-inline.pf-m-warning';

// nic modal
export enum nicDialog {
  addNIC = 'button[id="add-nic"]',
  model = 'button[id="nic-select-model"]',
  nicName = 'input[id="nic-name"]',
  NAD = 'select[id="nic-network"]',
  nicType = 'button[id="nic-select-type"]',
  add = 'button[data-test="confirm-action"]',
}

// disk modal
export enum diskDialog {
  source = 'button[id="disk-select-source"]',
  diskName = 'input[id="disk-name"]',
  size = 'input[id="disk-size-row-size"]',
  diskType = 'select[id="disk-type"]',
  storageClass = '[data-test="storage-class-dropdown"]',
  diskInterface = 'button[id="disk-select-interface"]',
  add = 'button[data-test="confirm-action"]',
  diskURL = 'input[id="disk-url"]',
  diskContainer = 'input[id="disk-container"]',
  diskPVC = 'select[id="disk-pvc"]',
  autoDetach = 'input[id="disk-auto-detach"]',
}

// storageClass
export enum storageClass {
  advanced = '[data-test="advanced-section"]',
  dropdown = '[data-test="storage-class-dropdown"]',
  selectMenu = '.co-resource-item__resource-name',
}

// yaml page
export const createYAMLButton = 'button[data-test="save-changes"]';

// multiple IP pop-up
export const ipPopOverContent = '.pf-c-popover__content';

// template list
export const nameFilter = 'input[data-test="name-filter-input"]';
// export const starIcon = '.pf-c-button.pf-m-plain.kv-pin-remove-btn';
export const unStarIcon = '.pf-c-button.pf-m-plain.kv-pin-btn';
export const supportLevel = '[data-test-id="details-Support"]';
export const supportLevelTag = '[data-test="template-support"]';

// VM's disks tab
export enum disksTab {
  addDiskBtn = 'button[id="add-disk"]',
  deleteDiskBtn = 'button[data-test-action="Delete"]',
  currVMStatusLbl = 'span[data-test="resource-status"]',
}
