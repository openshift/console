import { $, $$, browser } from 'protractor';
import { waitForCount } from '@console/shared/src/test-utils/utils';

export const bootableDevices = (namespace: string, name: string) =>
  $$(`#${namespace}-${name}-boot-order ol li`);
export const addDeviceButton = $('#add-device-btm');
export const addDeviceSelect = $('#add-device-select');

export const draggablePointer = (position) =>
  $(`#VMBootOrderList div:nth-child(${position}) div.pf-c-data-list__item-row`).$(
    'div[style="cursor: move;"]',
  );

export const deleteDeviceButton = (position) =>
  $(`#VMBootOrderList div:nth-child(${position}) div.pf-c-data-list__item-row`).$(
    'div[style="cursor: pointer;"]',
  );

export const waitForBootDevicesCount = (vmName: string, vmNamespace: string, count: number) =>
  browser.wait(waitForCount(bootableDevices(vmNamespace, vmName), count));
