import { $, browser, ExpectedConditions as until } from 'protractor';
import { resourceRows } from '../../../../integration-tests/views/crud.view';

export const createNic = $('#create-nic-btn');
export const createDisk = $('#create-disk-btn');

export const nicName = $('#nic-name');
export const macAddress = $('#nic-mac-address');
export const networkTypeDropdownId = '#nic-network-type';
export const networkBindingId = '#nic-binding';

export const diskName = $('#disk-name');
export const diskSize = $('#disk-size');
export const diskStorageClassDropdownId = '#disk-storage-class';

export const cancelBtn = $('button.kubevirt-cancel-accept-buttons.btn-default');
export const applyBtn = $('button.kubevirt-cancel-accept-buttons.btn-primary');

// Used to determine presence of a new row by looking for confirmation buttons
export const newResourceRow = $('.kubevirt-vm-create-device-row__confirmation-buttons');

export const rowForName = (name: string) =>
  resourceRows
    .filter((row) =>
      row
        .$$('div')
        .first()
        .getText()
        .then((text) => text === name),
    )
    .first();

const kebabForName = (name: string) => rowForName(name).$('button.co-kebab__button');
export const selectKebabOption = async (name: string, option: string) => {
  await browser.wait(until.presenceOf(kebabForName(name)));
  // open kebab dropdown
  await kebabForName(name).click();
  // select given option from opened dropdown
  await rowForName(name)
    .$('.co-kebab__dropdown')
    .$$('a')
    .filter((link) => link.getText().then((text) => text.startsWith(option)))
    .first()
    .click();
};
