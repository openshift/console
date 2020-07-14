import { $, $$ } from 'protractor';

export const addLabelBtn = $('#vm-labels-list-add-btn');
export const emptyKeyInputs = (key) => $$(`input[placeholder='${key}'][value='']`);
export const keyInputByKey = (key, value) => $(`input[placeholder='${key}'][value='${value}']`);
export const keyInputByID = (name, id) => $(`#${name}-${id}-key-input`);
export const valueInputByID = (name, id) => $(`#${name}-${id}-value-input`);
export const deleteBtnByID = (name, id) => $(`#${name}-${id}-delete-btn`);
