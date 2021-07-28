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
  addDisk = 'button[id="add-disk"]',
  source = 'button[id="disk-select-source"]',
  diskName = 'input[id="disk-name"]',
  size = 'input[id="disk-size-row-size"]',
  diskType = 'select[id="disk-type"]',
  storageClass = 'select[id="disk-storage-class"]',
  diskInterface = 'button[id="disk-select-interface"]',
  add = 'button[data-test="confirm-action"]',
}

// storageClass
export enum storageClass {
  advanced = '[data-test="advanced-section"]',
  dropdown = 'button[id="form-ds-sc-select"]',
  selectMenu = '.pf-c-select__menu',
}
