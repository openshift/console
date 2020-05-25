import { $, by, element } from 'protractor';

export const modalTitle = $('[data-test-id="modal-title"]');
export const addAffinityBtn = element(by.buttonText('Add Affinity rule'));
export const editSubmitBtn = element(by.buttonText('Save Affinity rule'));
export const valuesSelectElement = $('.pf-c-select__toggle-typeahead');
export const createValueBtn = element(by.partialButtonText('Create'));
export const kebab = $('[data-test-id="kebab-button"]');
export const kebabDelete = $('[data-test-action="Delete"]');
export const affinityKeyInputByID = (id) => $(`#affinity-${id}-key-input`);
export const affinityValuesSelectByID = (id) => $(`#affinity-${id}-values-select`);
export const deleteBtnByID = (id) => $(`#affinity-${id}-delete-btn`);
