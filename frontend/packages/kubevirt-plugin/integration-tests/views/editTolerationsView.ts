import { $ } from 'protractor';

export const modalTitle = $('[data-test-id="modal-title"]');
export const addLabelBtn = $('#vm-labels-list-add-btn');
export const submitBtn = $('#tolerations-submit');
export const tolerationKeyInputByID = (id) => $(`#toleration-${id}-key-input`);
export const tolerationValueInputByID = (id) => $(`#toleration-${id}-value-input`);
export const deleteBtnByID = (id) => $(`#toleration-${id}-delete-btn`);
