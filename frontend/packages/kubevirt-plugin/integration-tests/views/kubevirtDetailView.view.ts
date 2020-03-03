import { $, browser, ExpectedConditions as until, element, by } from 'protractor';
import { resourceRows } from '@console/internal-integration-tests/views/crud.view';
import { click } from '@console/shared/src/test-utils/utils';

export const createNICButton = $('#create-nic-btn');
export const createDiskButton = $('#create-disk-btn');

export const modalSubmitButton = $('.modal-content .pf-m-primary');
export const cancelButton = element(by.buttonText('Cancel'));
export const applyButton = element(by.buttonText('Add'));
export const saveButton = element(by.buttonText('Save'));

// Used to determine presence of a new row by looking for confirmation buttons
export const newResourceRow = $('.kubevirt-vm-create-device-row__confirmation-buttons');

const tableContent = $('.ReactVirtualized__VirtualGrid.ReactVirtualized__List');
export const tableRows = () =>
  tableContent.getAttribute('innerText').then((text) => text.split('\n'));
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
