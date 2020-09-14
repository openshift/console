import { $, $$, by, element } from 'protractor';

export const addLabelBtn = $$('#vm-labels-list-add-btn');
export const addAffinityBtn = element(by.buttonText('Add Affinity rule'));
export const editSubmitBtn = element(by.buttonText('Save Affinity rule'));
export const valuesSelectElement = $$('.pf-c-select__toggle-typeahead');
export const createValueBtn = (value) => element(by.partialButtonText(value));
export const kebab = $('[data-test-id="kebab-button"]');
export const kebabDelete = $('[data-test-action="Delete"]');
export const affinityKeyInputByID = (name, id) => $(`#affinity-${name}-${id}-key-input`);
export const affinityValuesSelectByID = (name, id) => $(`#affinity-${name}-${id}-values-select`);
export const deleteBtnByID = (name, id) => $(`#affinity-${name}-${id}-delete-btn`);
