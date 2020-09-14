import { $, by, element } from 'protractor';

export const unpauseVMDialog = $('.pf-c-modal-box__header h1');
export const unpauseButton = element(by.buttonText('Unpause'));
