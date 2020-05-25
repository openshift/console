import { $ } from 'protractor';

export const modalTitle = $('[data-test-id="modal-title"]');
export const addLabelBtn = $('#vm-labels-list-add-btn');
export const labelKeyInputByID = (id) => $(`#label-${id}-key-input`);
export const labelValueInputByID = (id) => $(`#label-${id}-value-input`);
export const deleteBtnByID = (id) => $(`#label-${id}-delete-btn`);
