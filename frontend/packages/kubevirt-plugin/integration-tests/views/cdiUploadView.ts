import { element, by, $, $$ } from 'protractor';

export const uploadCdiFormButton = element(by.partialButtonText('Data upload'));
export const uploadInput = $('input[type="file"]');
export const unitDropdown = $('button[data-test-id="dropdown-button"]');
export const unitMiBButton = element(by.buttonText('MiB'));
export const uploadProgress = element.all(by.css('.pf-c-progress__measure')).first();
export const firstStorageClass = $$('li[role="option"]').first();
export const formStatus = $('.pf-c-title.pf-m-lg');
