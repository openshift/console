import { $, $$, element, by, browser } from 'protractor';
import { waitForNone } from '@console/internal-integration-tests/protractor.conf';
import { actionForLabel } from '@console/internal-integration-tests/views/crud.view';
import { click } from '@console/shared/src/test-utils/utils';

// Wizard Common
export const createWithWizardButton = $('#wizard-link');
export const createWithYAMLButton = $('#yaml-link');
export const backButton = element(by.buttonText('Back'));
export const cancelButton = element(by.buttonText('Cancel'));
export const nextButton = element(by.buttonText('Next'));
export const createVirtualMachineButton = element(by.partialButtonText('Create Virtual Machine'));
export const modalCancelButton = $('.modal-content').element(by.buttonText('Cancel'));

// Basic Settings tab
export const templateSelect = $('#template-dropdown');
export const provisionSourceSelect = $('#image-source-type-dropdown');
const provisionSourceURL = $('#provision-source-url');
const provisionSourceContainerImage = $('#provision-source-container');
export const provisionSources = {
  URL: provisionSourceURL,
  Container: provisionSourceContainerImage,
};
export const operatingSystemSelect = $('#operating-system-dropdown');
export const flavorSelect = $('#flavor-dropdown');
export const workloadProfileSelect = $('#workload-profile-dropdown');
export const customFlavorMemoryInput = $('#resources-memory-size');
export const customFlavorCpusInput = $('#resources-cpu');

export const customFlavorMemoryHintBlock = $('#resources-memory-helper');

export const nameInput = $('#vm-name');
export const descriptionInput = $('#vm-description');
export const startVMOnCreation = $('#start-vm');

// Networking tab
export const addNICButton = $('#add-nic');
export const pxeBootSourceSelect = $('#pxe-bootsource');

// Storage tab
export const addDiskButton = $('#add-disk');
export const storageBootSourceSelect = $('#storage-bootsource');
export const diskWarning = (resourceName) =>
  $(`[data-id="${resourceName}"]`).$('.kubevirt-validation-cell__cell--warning');

// Virtual Hardware tab
export const addCDButton = $('#vm-cd-add-btn');

// Advanced -- Cloud-init
export const cloudInitFormCheckbox = $('#cloud-init-edit-mode-first-option');
export const cloudInitCustomScriptCheckbox = $('#cloud-init-edit-mode-second-option');
export const customCloudInitScriptTextArea = $('#cloudinit-custom-custom-script');
export const cloudInitAddKeyButton = $('#cloudinit-ssh_authorized_keys-add');
export const cloudInitHostname = $('#cloudinit-hostname');
export const cloudInitSSHKey = (rowNumber) => $(`#cloudinit-ssh_authorized_keys-key-${rowNumber}`);

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

export const tableRowAttribute = async (dataId: string, columnIndex: number): Promise<string> => {
  return $(`tr[data-id="${dataId}"]`)
    .$$('td')
    .get(columnIndex)
    .getText();
};
