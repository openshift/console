import { $ } from 'protractor';

export const closeForm = $('#cancel');
export const formHeader = $('.co-m-pane__heading'); // TODO Find more specific selector
export const createBtn = $('#save-changes');

export const nameInput = $('#network-attachment-definition-name');
export const descriptionInput = $('#network-attachment-definition-description');
export const networkTypeDropdownId = '#network-type';
export const bridgeNameInput = $('#network-type-params-bridge-text');
export const vlanTagNumInput = $('#network-type-params-vlanTagNum-text');

export const nameErrorBlock = $('.text-secondary');
