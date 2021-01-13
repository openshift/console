import { element, by, $ } from 'protractor';

export const uploadCdiFormButton = element(by.partialButtonText('Data upload'));
export const uploadInput = $('input[type="file"]');
export const unitDropdown = $('button[data-test-id="dropdown-button"]');
export const uploadProgress = element.all(by.css('.pf-c-progress__measure')).first();
export const goldenOSCheckbox = $('#golden-os-switch');
export const goldenOSDropDownID = $('#golden-os-select');
export const viewStatusID = $('#cdi-upload-primary-pvc');
export const uploadStorageClass = $('#upload-form-ds-sc-select');
export const uploadAccessMode = $('#upload-form-ds-access-mode-select');
export const uploadVolumeMode = $('#upload-form-ds-volume-mode-select');

export const pvcName = (name) => $(`[data-test-id="${name}"]`);
export const pvcKebabButton = $('[data-test-id="kebab-button"]');
export const pvcDeleteButton = element(by.buttonText('Delete Persistent Volume Claim'));
export const errorUploading = $('.pf-c-empty-state__body');
export const disabled = $('.pf-c-dropdown__menu-item.pf-m-disabled');
export const typeWarnMessage = element(
  by.cssContainingText('.pf-c-alert__title', 'File type extension'),
);
