import { $, $$, browser, by, element } from 'protractor';
import { waitForNone } from '@console/internal-integration-tests/protractor.conf';
import { actionForLabel } from '@console/internal-integration-tests/views/crud.view';
import { ProvisionSource } from '../tests/utils/constants/enums/provisionSource';
import { click } from '../utils/shared-utils';

// Wizard Common
export const createItemButton = $('[data-test-id="item-create"]');
export const createWithWizardButton = $('[data-test-id="vm-wizard"]');
export const createVMTWithWizardButton = $('[data-test-id="template-wizard"]');
export const createWithYAMLButton = $('[data-test-id="vm-yaml"]');
export const createVMTWithYAMLButton = $('[data-test-id="template-yaml"]');
export const backButton = element(by.buttonText('Back'));
export const cancelButton = element(by.buttonText('Cancel'));
export const nextButton = element(by.buttonText('Next'));
export const customizeButton = $('[data-test-id="wizard-customize"]');
export const createVirtualMachineButton = element(by.partialButtonText('Create'));
export const modalCancelButton = $('.modal-content').element(by.buttonText('Cancel'));
export const stepTitle = $('.pf-c-title.pf-m-lg');
export const wizardBody = $('.pf-c-wizard__main-body');

// Template
export const templateByName = (name: string) =>
  element(by.cssContainingText('.catalog-tile-pf-title', name));

// Errors
export const footerError = $('div[aria-label="Danger Alert"]');
export const footerErrorDescroption = footerError.$('.pf-c-alert__description');
export const bootError = $('#image-source-type-dropdown-helper');
export const errorHelper = $('.pf-c-form__helper-text.pf-m-error');
export const invalidMessageContainer = $('.kubevirt-fort-row__invalid-message-container');

// Basic Settings tab
export const templateSelect = $('#template-dropdown');
export const provisionSourceSelect = $('#image-source-type-dropdown');
export const goldenImageCloneCheckbox = $$('#clone-common-base-image-checkbox').get(0);
export const provisionSourceInputs = {
  [ProvisionSource.URL.getValue()]: $('#provision-source-url'),
  [ProvisionSource.CONTAINER.getValue()]: $('#provision-source-container'),
};
export const operatingSystemSelect = $('#operating-system-dropdown');
export const flavorSelect = $('#flavor-dropdown');
export const workloadProfileSelect = $('#workload-profile-dropdown');
export const customFlavorMemoryInput = $('#resources-memory-size');
export const customFlavorCpusInput = $('#resources-cpu');

export const customFlavorMemoryHintBlock = $('#resources-memory-helper');

export const nameInput = $('#vm-name');
export const descriptionInput = $('#vm-description');
export const providerInput = $('#template-provider');
export const startVMOnCreation = $('#start-vm');

// Networking tab
export const addNICButton = $('#add-nic');
export const pxeBootSourceSelect = $('#pxe-bootsource');

// Storage tab
export const addDiskButton = $('#add-disk');
export const storageBootSourceSelect = $('#storage-bootsource');
export const storageBootsourceHelper = $('#storage-bootsource-helper');
export const diskWarning = (resourceName) =>
  $(`[data-id="${resourceName}"]`).$('.kv-validation-cell__cell--warning');

// Advanced -- Cloud-init
export const cloud = $('#cloud');
export const cloudInitFormCheckbox = $('#cloud-init-edit-mode-first-option');
export const cloudInitCustomScriptCheckbox = $('#cloud-init-edit-mode-second-option');
export const customCloudInitScriptTextArea = $('#cloudinit-custom-custom-script');
export const cloudInitAddKeyButton = $('#cloudinit-ssh_authorized_keys-add');
export const cloudInitHostname = $('#cloudinit-hostname');
export const cloudInitSSHKey = (rowNumber) => $(`#cloudinit-ssh_authorized_keys-key-${rowNumber}`);
export const cloudInitFirstOption = $('#cloud-init-edit-mode-first-option');
export const cloudInitSecondOption = $('#cloud-init-edit-mode-second-option');

// Review tab
export const nameReviewValue = $('#wizard-review-name');
export const descriptionReviewValue = $('#wizard-review-description');
export const provisionSourceTypeReviewValue = $('#wizard-review-provision_source_type');
export const osReviewValue = $('#wizard-review-operating_system');
export const flavorReviewValue = $('#wizard-review-flavor');
export const workloadProfileReviewValue = $('#wizard-review-workload_profile');
export const cloudInitReviewValue = $('#wizard-review-cloud_init');

// Result tab
export const creationSuccessResult = $('[data-test-id="kubevirt-wizard-success-result"]');
export const creationErrorResult = $('[data-test-id="kubevirt-wizard-error-result"]');

export const waitForNoLoaders = async () => {
  await browser.wait(waitForNone($$('.co-m-loader')));
};

export const clickKebabAction = async (resourceName: string, actionLabel: string) => {
  await click($(`[data-id="${resourceName}"]`).$('[data-test-id="kebab-button"]'));
  await click(actionForLabel(actionLabel));
};

export const tableRow = (name: string) => $(`tr[data-id="${name}"]`);
export const tableRowAttribute = async (name: string, columnIndex: number): Promise<string> => {
  return tableRow(name)
    .$$('td')
    .get(columnIndex)
    .getText();
};

export const uploadLink = element(by.linkText('upload a new disk image'));

// pvc dropdown button on customize wizard
export const selectPVCNS = $('#clone-pvc-ns');
export const selectPVCName = element(by.partialButtonText('Select Persistent Volume Claim'));

// wizard boot source
export const pvcNSButton = $('#pvc-ns-dropdown');
export const pvcNameButton = $('#pvc-name-dropdown');
export const pvcNS = (name: string) => $(`#${name}-Project-link`);
export const pvcName = (name: string) => $(`#${name}-PersistentVolumeClaim-link`);
export const diskAdvance = element(by.buttonText('Advanced'));
export const selectSCButton = $('#form-ds-sc-select');
export const selectAccessModeButton = $('#form-ds-access-mode-select');
export const selectVolumeModeButton = $('#form-ds-volume-mode-select');
