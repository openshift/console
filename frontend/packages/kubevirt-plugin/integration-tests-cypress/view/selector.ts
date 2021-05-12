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
  confirmCloneButton = 'button[id="confirm-action"]',
  kebabButton = 'kebab-button',
}

// dialogs
export const modalTitle = '[data-test-id="modal-title"]';
export const startOnClone = 'input[id="clone-dialog-vm-start"]';

// alert
export const alertTitle = '.pf-c-alert__title';
