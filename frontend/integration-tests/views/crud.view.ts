import { $, $$, browser, ExpectedConditions as until } from 'protractor';

export const createYAMLButton = $('#yaml-create');
export const createItemButton = $('#item-create');
export const createYAMLLink = $('#yaml-link');

export const saveChangesBtn = $('#save-changes');
export const reloadBtn = $('#reload-object');
export const cancelBtn = $('#cancel');

/**
 * Returns a promise that resolves after the loading spinner is not present.
 */
export const isLoaded = () => browser.wait(until.presenceOf($('.loading-box__loaded')), 10000).then(() => browser.sleep(1000));
export const resourceRowsPresent = () => browser.wait(until.presenceOf($('.co-m-resource-icon + a')), 10000);

export const resourceRows = $$('.co-resource-list__item');
export const resourceRowNamesAndNs = $$('.co-m-resource-icon + a');
export const rowForName = (name: string) => resourceRows.filter((row) => row.$$('.co-m-resource-icon + a').first().getText().then(text => text === name)).first();
export const rowForOperator = (name: string) => resourceRows.filter((row) => row.$('.co-clusterserviceversion-logo__name__clusterserviceversion').getText().then(text => text === name)).first();
export const labelsForRow = (name: string) => rowForName(name).$$('.co-m-label');
export const textFilter = $('.co-m-pane__filter-bar-group--filter input');
export const gearOptions = {
  labels: 'Edit Labels',
  annotations: 'Edit Annotations',
  edit: 'Edit',
  delete: 'Delete',
};

export const filterForName = async(name: string) => {
  await browser.wait(until.presenceOf(textFilter));
  await textFilter.sendKeys(name);
};

export const editHumanizedKind = (kind) => {
  const humanizedKind = kind.split(/(?=[A-Z])/).join(' ');
  return `Edit ${humanizedKind}`;
};

/**
 * Edit row from a list.
 */
export const editRow = (kind: string) => (name: string) => rowForName(name).$$('.co-m-cog').first().click()
  .then(() => browser.wait(until.elementToBeClickable(rowForName(name).$('.co-m-cog__dropdown'))))
  .then(() => rowForName(name).$('.co-m-cog__dropdown').$$('a').filter(link => link.getText().then(text => text.startsWith(editHumanizedKind(kind)))).first().click())
  .then(async() => {
    await browser.wait(until.presenceOf(cancelBtn));
    const reloadBtnIsPresent = await reloadBtn.isPresent();
    if (reloadBtnIsPresent) {
      await reloadBtn.click();
    }
    await saveChangesBtn.click();
  });

/**
 * Deletes a row from a list. Does not wait until the row is no longer visible.
 */
export const deleteRow = (kind: string) => (name: string) => rowForName(name).$$('.co-m-cog').first().click()
  .then(() => browser.wait(until.elementToBeClickable(rowForName(name).$('.co-m-cog__dropdown'))))
  .then(() => rowForName(name).$('.co-m-cog__dropdown').$$('a').filter(link => link.getText().then(text => text.startsWith('Delete'))).first().click())
  .then(async() => {
    switch (kind) {
      case 'Namespace':
        await browser.wait(until.presenceOf($('input[placeholder="Enter name"]')));
        await $('input[placeholder="Enter name"]').sendKeys(name);
        break;
      default:
        await browser.wait(until.presenceOf($('#confirm-action')));
        break;
    }

    await $('#confirm-action').click();

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

export const nameFilter = $('.form-control.text-filter');
export const messageLbl = $('.cos-status-box');
export const modalAnnotationsLink = $('.co-m-modal-link');
