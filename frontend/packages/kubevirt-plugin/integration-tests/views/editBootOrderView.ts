import { $, $$ } from 'protractor';


export const bootOrderSummaryList = (namespace, name) => $$(`#${namespace}-${name}-boot-order ol li`);

export const modalTitle = $('.modal-title');
export const saveButton = $(`[aria-label="Virtual machine boot order"] footer button:nth-child(1)`);
export const deleteDeviceButton = (number) => $(`#VMBootOrderList li:nth-child(${number}) [style="cursor: pointer;"]`)