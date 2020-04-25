import { $ } from 'protractor';

export const modalTitle = $('[data-test-id="modal-title"]');
export const addAffinityBtn = $('#add-affinity-btn');
export const submitBtn = $('#affinity-submit');
export const editSubmitBtn = $('#affinity-edit-submit');
export const valuesSelectElement = $('.pf-c-select__toggle-typeahead');
export const createValueBtn = $('#affinity-value-0');
export const kebab = $('[data-test-id="kebab-button"]');
export const kebabDelete = $('[data-test-action="Delete"]');
export const affinityKeyInputByID = (id) => $(`#affinity-${id}-key-input`);
export const affinityValuesSelectByID = (id) => $(`#affinity-${id}-values-select`);
export const deleteBtnByID = (id) => $(`#affinity-${id}-delete-btn`);
