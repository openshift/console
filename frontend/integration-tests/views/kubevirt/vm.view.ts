import { $ } from 'protractor';

// Basic Settings tab
export const createWithWizardLink = $('#wizard-link');
export const createWithYAMLLink = $('#yaml-link');

export const nameInput = $('.wizard-pf-row .form-group:nth-child(1) input');

export const namespaceButton = $('#namespace-dropdown');
export const namespaceMenu = $('#namespace-dropdown + ul');

export const provisionSourceButton = $('#image-source-type-dropdown');
export const provisionSourceMenu = $('#image-source-type-dropdown + ul');

export const provisionSourceURL = $('#provision-source-url');
export const provisionSourceContainerImage = $('#provision-source-container');

export const templateButton = $('#template-dropdown');
export const templateMenu = $('#template-dropdown + ul');

export const operatingSystemButton = $('#operating-system-dropdown');
export const operatingSystemMenu = $('#operating-system-dropdown + ul');

export const flavorButton = $('#flavor-dropdown');
export const flavorSourceMenu = $('#flavor-dropdown + ul');

export const workloadProfileButton = $('#workload-profile-dropdown');
export const workloadProfileMenu = $('#workload-profile-dropdown + ul');

export const startVMOnCreation = $('#start-vm');
export const useCloudInit = $('#use-cloud-init');

// Networking tab
export const createNIC = $('#create-network-btn');

export const pxeNICButton = $('#pxe-nic-dropdown');
export const pxeNICMenu = $('#pxe-nic-dropdown + ul');

export const networkDefinitionButton = $('#network-edit-2-row');
export const networkDefinitionMenu = $('#network-edit-2-row + ul');

// Storage tab
export const attachStorage = $('#attach-storage-btn');
export const storageButton = $('#name-attach-edit-1-row');
export const storageMenu = $('#name-attach-edit-1-row + ul');

// Wizard Common
export const wizardContent = $('.wizard-pf-contents');
export const wizardHeader = $('.modal-header');
export const provisionResult = $('.wizard-pf-body h3');
export const nextButton = $('.wizard-pf-footer > button:last-child');
export const applyButton = $('.inline-edit-buttons > button:first-child');
export const cancelButton = $('.inline-edit-buttons > button:last-child');

// VMs List view
export const firstRowVMStatus = $('div.co-m-row:first-child > div:first-child > div:nth-child(3)');
