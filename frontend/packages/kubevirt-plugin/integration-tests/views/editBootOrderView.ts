import { $, $$, by, browser } from 'protractor';
import { waitForCount } from '@console/shared/src/test-utils/utils';

export const bootableDevices = (namespace: string, name: string) =>
  $$(`#${namespace}-${name}-boot-order ol li`);
export const bootOrderDialog = $(`[aria-label="Virtual machine boot order"]`);
export const saveButton = bootOrderDialog.element(by.buttonText('Save'));
export const cancelButton = bootOrderDialog.element(by.buttonText('Cancel'));
export const addDeviceButton = bootOrderDialog.element(by.buttonText('Add source'));
export const addDeviceSelect = bootOrderDialog.$('#add-device-select');
export const draggablePointer = (index) =>
  bootOrderDialog.$$(`div[style="cursor: move;"]`).get(index);

export const deleteDeviceButton = (position) =>
  $(`#VMBootOrderList div:nth-child(${position}) div.pf-c-data-list__item-row`).$(
    '.pf-m-align-right',
  );

export const waitForBootDevicesCount = (vmName: string, vmNamespace: string, count: number) =>
  browser.wait(waitForCount(bootableDevices(vmNamespace, vmName), count));
