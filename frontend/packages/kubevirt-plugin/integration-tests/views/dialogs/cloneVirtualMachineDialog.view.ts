import { $, element, by } from 'protractor';

export const modalDialog = $('.ReactModal__Content');

export const warningMessage = $('[aria-label="Warning Alert"]');

export const nameHelperMessage = $('#clone-dialog-vm-name-helper');

export const nameInput = $('#clone-dialog-vm-name');
export const descriptionInput = $('#clone-dialog-vm-description');
export const namespaceSelector = $('#clone-dialog-vm-namespace');
export const startOnCreationCheckBox = $('#clone-dialog-vm-start');

export const confirmButton = $('#confirm-action');
export const cancelButton = element(by.buttonText('Cancel'));

export const errorHelper = modalDialog.$('.pf-c-form__helper-text');
