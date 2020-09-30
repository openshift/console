import { element, by, $ } from 'protractor';

export const uploadCdiFormButton = element(by.partialButtonText('Data upload'));
export const uploadInput = $('input[type="file"]');
export const unitDropdown = $('button[data-test-id="dropdown-button"]');
export const uploadProgress = element.all(by.css('.pf-c-progress__measure')).first();
export const goldenOSCheckbox = $('#golden-os-switch');
export const goldenOSDropDownID = $('#golden-os-select');
export const viewStatusID = $('#cdi-upload-primary-pvc');
