import { $, $$, browser, ExpectedConditions as until } from 'protractor';

export const createYAMLButton = $('#yaml-create');

/**
 * Returns a promise that resolves after the loading spinner is not present.
 */
export const isLoaded = () => browser.wait(until.presenceOf($('.loading-box__loaded')), 10000).then(() => browser.sleep(500));

export const resourceRows = $$('.co-resource-list__item');
export const resourceRowNamesAndNs = $$('.co-m-resource-icon + a');
export const rowForName = (name: string) => resourceRows.filter((row) => row.$$('.co-m-resource-icon + a').first().getText().then(text => text === name)).first();
export const labelsForRow = (name: string) => rowForName(name).$$('.co-m-label');
export const gearOptions = {
  nodeSelector: 'Modify Node Selector',
  labels: 'Modify Labels',
  annotations: 'Modify Annotations',
  edit: 'Edit',
  delete: 'Delete',
};

/**
 * Deletes a row from a list. Does not wait until the row is no longer visible.
 */
export const deleteRow = (kind: string) => (name: string) => rowForName(name).$$('.co-m-cog').first().click()
  .then(() => browser.wait(until.visibilityOf(rowForName(name).$('.co-m-cog__dropdown'))))
  .then(() => rowForName(name).$('.co-m-cog__dropdown').$$('a').filter(link => link.getText().then(text => text.startsWith('Delete'))).first().click())
  .then(async() => {
    switch (kind) {
      case 'Namespace':
        await browser.wait(until.presenceOf($('input[placeholder="Enter name"]')));
        await $('input[placeholder="Enter name"]').sendKeys(name);
        break;
      default:
        await browser.wait(until.presenceOf($('#confirm-delete')));
        break;
    }

    await $('#confirm-delete').click();

    const cogIsDisabled = until.presenceOf(rowForName(name).$('.co-m-cog--disabled'));
    const listIsEmpty = until.textToBePresentInElement($('.cos-status-box > .text-center'), 'No ');
    const rowIsGone = until.not(until.presenceOf(rowForName(name).$('.co-m-cog')));
    return browser.wait(until.or(cogIsDisabled, until.or(listIsEmpty, rowIsGone)));

  });

export const selectOptionFromGear = (name: string, gearOptionStartsWith: string) =>
  rowForName(name).$$('.co-m-cog').first().click()
    .then(() => browser.wait(until.visibilityOf(rowForName(name).$('.co-m-cog__dropdown'))))
    .then(() => $('.co-m-cog__dropdown').$$('a').filter(link => link.getText()
      .then(text => text.startsWith(gearOptionStartsWith))).first().click()
    );

export const rowFilters = $$('.row-filter--box');
export const rowFilterFor = (name: string) => rowFilters.filter(element => element.getText().then(text => text.includes(name))).first();
export const activeRowFilters = $$('.row-filter--box__active');

export const statusMessageTitle = $('.cos-status-box__title');
export const statusMessageDetail = $('.cos-status-box__detail');

const actionsButton = $('.co-m-nav-title .btn--actions');
export const actionsDropdown = actionsButton.$('button');
export const actionsDropdownMenu = actionsButton.$$('.dropdown-menu').first();

export const resourceTitle = $('#resource-title');

export const saveChangesBtn = $('#save-changes');
export const nameFilter = $('.form-control.text-filter');
export const messageLbl = $('.cos-status-box');
export const modalAnnotationsLink = $('.co-m-modal-link');
