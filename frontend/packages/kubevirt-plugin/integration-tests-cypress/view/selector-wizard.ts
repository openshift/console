export const create = '[data-test-id="item-create"]';
export const vmWizard = '[data-test-id="vm-wizard"]';
export const next = 'button[data-test-id="wizard-next"]';
export const cancelBtn = 'button[id="create-vm-wizard-cancel-btn"]';
export const customizeBtn = 'button[data-test-id="wizard-customize"]';

export const wizardNav = '.pf-c-wizard__nav-list';
export const templateTitle = '.catalog-tile-pf-title';

export const imageSourceDropdown = 'button[id="image-source-type-dropdown"]';
export const selectMenu = '.pf-c-select__menu';
export const sourceURL = 'input[id="provision-source-url"]';
export const sourceRegistry = 'input[id="provision-source-container"]';
export const cdrom = 'input[id="cdrom"]';

// pvc selectors
export const pvcSize = '#request-size-input';
export const clonePVCNSDropdown = 'button[id="clone-pvc-ns"]';
export const pvcNSDropdown = 'button[id="pvc-ns-dropdown"]';
export const projectNS = (project: string) => `a[id="${project}-Project-link"]`;
export const clonePVCDropDown = '.pf-c-dropdown__toggle-text';
export const pvcDropdown = 'button[id="pvc-name-dropdown"]';
export const pvcName = (pvc: string) => `a[id="${pvc}-PersistentVolumeClaim-link"]`;

// review page
export const projectDropdown = 'button[id="project-dropdown"]';
export const vmName = 'input[id="vm-name"]';
export const flavorSelect = 'button[id="vm-flavor-select"]';
export const sshCheckbox = 'input[id="ssh-service-checkbox"]';
export const startOnCreation = 'input[id="start-vm"]';

export const successList = 'button[data-test="success-list"]';

// customize wizard
export const flavorDropdown = 'button[id="flavor-dropdown]';
export const selectItem = '.pf-c-select__menu-item';
export const nextBtn = 'button[id="create-vm-wizard-submit-btn"]';
export const selectPXENIC = 'select[id="pxe-bootsource"]';
export const cloudInit = 'button[id="cloud"]';
export const ssh = 'button[id="ssh"]';
export const formView = 'input[name="form-checkbox"]';
export const yamlEditor = '..monaco-scrollable-element';
export const yamlView = 'input[name="yaml-checkbox"]';
export const username = 'input[id="cloudint-user"]';
export const password = 'input[id="cloudint-password"]';
export const hostname = 'input[id="cloudint-hostname"]';
export const sshKeys = (index: number) => `input[id="cloudint-ssh_authorized_keys-key-${index}"]`;
export const addSSHKey = 'button[id="cloudint-ssh_authorized_keys-add"]';
