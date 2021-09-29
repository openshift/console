export enum detailsTab {
  // general fields
  vmName = '[data-test-selector="details-item-value__Name"]',
  vmNS = '[data-test-selector="details-item-value__Namespace"]',
  vmLabels = '[data-test="label-list"]',
  vmDesc = '[data-test-id="details-Description"]',
  vmOS = '[data-test-id="details-Operating System"]',
  vmTemplate = '[data-test-id="details-Template"]',
  vmStatus = '[data-test="status-text"]',
  vmPod = '[data-test-id="details-Pod"]',
  vmBootOrder = '[data-test-id="details-Boot Order"]',
  vmIP = '[data-test-id="details-IP Address"]',
  vmHostname = '[data-test-id="details-Hostname"]',
  vmTimezone = '[data-test-id="details-Time Zone"]',
  vmNode = '[data-test-id="details-Node"]',

  services = '#services',
  activeUser = '#logged-in-users',

  vmEditWithPencil = '[data-test="edit-button"]',
}

export enum dashboardTab {
  detailsCardItem = '.co-details-card__item-value',
  utilsCardItem = '[data-test-id="utilization-item"]',
  inventoryCardItem = '.co-inventory-card__item',
  vmHealth = '[data-item-id="Virtual Machine-health-item"]',
  guestAgentHealth = '[data-item-id="Guest Agent-health-item"]',
  guestAgentOK = '[data-test="success-icon"]',
  eventsCardBody = '.co-activity-card__recent-accordion',
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
export const saveAndRestart = '#save-and-restart';

// alert
export const alertTitle = '.pf-c-alert__title';
export const errorAlert = '.pf-c-alert.pf-m-inline.pf-m-danger.co-alert.co-alert--scrollable';
export const pendingChangeAlert = '.pf-c-alert.pf-m-inline.pf-m-warning.kv__pending_changes-alert';
export const warningAlert = '.pf-c-alert.pf-m-inline.pf-m-warning';
export const alertDescription = '.pf-c-alert__description';

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
  diskURL = 'input[id="disk-url"]',
  diskContainer = 'input[id="disk-container"]',
  diskName = 'input[id="disk-name"]',
  size = 'input[id="disk-size-row-size"]',
  diskType = 'select[id="disk-type"]',
  storageClass = '[data-test="storage-class-dropdown"]',
  diskInterface = 'button[id="disk-select-interface"]',
  add = 'button[data-test="confirm-action"]',
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
export const createVMBtn = 'button[data-test="create-from-template"]';
export const templateLink = (name: string) => `[data-test-id="${name}"]`;

export const resourceTitle = '[data-test-id="resource-title"]';
export const resourceStatus = '[data-test="resource-status"]';
export const loadingBox = '.loading-box.loading-box__loaded';


// VM's disks tab
export enum disksTab {
  addDiskBtn = 'button[id="add-disk"]',
  deleteDiskBtn = 'button[data-test-action="Delete"]',
  currVMStatusLbl = 'span[data-test="resource-status"]',
}
