import { $ } from 'protractor';

export const flavorDropdown = $('#vm-flavor-modal-flavor');

export const modalTitle = () => $('[data-test-id="modal-title"]');
export const saveButton = () => $('#vm-flavor-modal-submit');
export const cpusInput = () => $('#vm-flavor-modal-cpu');
export const memoryInput = () => $('#vm-flavor-modal-memory-size');
