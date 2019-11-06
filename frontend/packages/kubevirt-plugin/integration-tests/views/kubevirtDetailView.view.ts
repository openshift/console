import { $, browser, ExpectedConditions as until } from 'protractor';
import { resourceRows } from '@console/internal-integration-tests/views/crud.view';
import { click } from '@console/shared/src/test-utils/utils';

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

const tableContent = $('.ReactVirtualized__VirtualGrid.ReactVirtualized__List');
export const tableRows = () => tableContent.getText().then((text) => text.split('\n'));
export const tableRowForName = (name: string) =>
  resourceRows
    .filter((row) =>
      row
        .$$('td')
        .first()
        .getText()
        .then((text) => text === name),
    )
    .first();

const kebabForName = (name: string) => tableRowForName(name).$('[data-test-id=kebab-button]');
export const selectKebabOption = async (name: string, option: string) => {
  await browser.wait(until.presenceOf(kebabForName(name)));
  await click(kebabForName(name)); // open kebab dropdown
  await click($(`[data-test-action="${option}"]`));
};
