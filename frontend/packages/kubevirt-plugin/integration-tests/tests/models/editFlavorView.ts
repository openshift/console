import { $ } from 'protractor';

export const flavorDropdownId = '#vm-flavor-modal-flavor-dropdown';

export const modalTitle = () => $('[data-test-id="modal-title"]');
export const flavorDropdownText = () =>
  $('.kubevirt-vm-flavor-modal__dropdown .pf-c-dropdown__toggle-text');
export const saveButton = () => $('#confirm-action');
export const cpusInput = () => $('#vm-flavor-modal-cpu');
export const memoryInput = () => $('#vm-flavor-modal-memory');
