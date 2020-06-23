import { $, $$ } from 'protractor';

export const addLabelBtn = $('#vm-labels-list-add-btn');
export const emptyKeyInputs = $$("input[placeholder='key'][value='']");
export const keyInputByKey = (key) => $(`input[placeholder='key'][value='${key}']`);
export const labelKeyInputByID = (id) => $(`#label-${id}-key-input`);
export const labelValueInputByID = (id) => $(`#label-${id}-value-input`);
export const deleteBtnByID = (id) => $(`#label-${id}-delete-btn`);
