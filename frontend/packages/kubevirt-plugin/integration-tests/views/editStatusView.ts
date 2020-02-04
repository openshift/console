import { $, by } from 'protractor';

export const unpauseVMDialog = $(`[aria-label="Edit pause state"]`);
export const saveButton = unpauseVMDialog.element(by.buttonText('Unpause'));
