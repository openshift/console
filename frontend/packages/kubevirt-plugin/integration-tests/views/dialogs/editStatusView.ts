import { $, by } from 'protractor';

export const unpauseVMDialog = $('[aria-label="Edit pause state"]');
export const unpauseButton = unpauseVMDialog.element(by.buttonText('Unpause'));
