import { $, $$, browser, by, ExpectedConditions as until } from 'protractor';

import { appHost, testName } from '../protractor.conf';

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
export const navTabs = $$('.co-m-horizontal-nav__menu-item > a');
export const navTabFor = (name: string) => navTabs.filter((tab) => tab.getText().then(text => text === name)).first();

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
export const editRow = (kind: string) => (name: string) => rowForName(name).$$('.co-kebab__button').first().click()
  .then(() => browser.wait(until.elementToBeClickable(rowForName(name).$('.co-kebab__dropdown'))))
  .then(() => rowForName(name).$('.co-kebab__dropdown').$$('a').filter(link => link.getText().then(text => text.startsWith(editHumanizedKind(kind)))).first().click())
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
export const deleteRow = (kind: string) => (name: string) => rowForName(name).$$('.co-kebab__button').first().click()
  .then(() => browser.wait(until.elementToBeClickable(rowForName(name).$('.co-kebab__dropdown'))))
  .then(() => rowForName(name).$('.co-kebab__dropdown').$$('a').filter(link => link.getText().then(text => text.startsWith('Delete'))).first().click())
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

    const kebabIsDisabled = until.presenceOf(rowForName(name).$('.co-kebab--disabled'));
    const listIsEmpty = until.textToBePresentInElement($('.cos-status-box > .text-center'), 'No ');
    const rowIsGone = until.not(until.presenceOf(rowForName(name).$('.co-kebab')));
    return browser.wait(until.or(kebabIsDisabled, until.or(listIsEmpty, rowIsGone)));

  });

export const selectOptionFromGear = (name: string, gearOptionStartsWith: string) =>
  rowForName(name).$$('.co-kebab__button').first().click()
    .then(() => browser.wait(until.visibilityOf(rowForName(name).$('.co-kebab__dropdown'))))
    .then(() => $('.co-kebab__dropdown').$$('a').filter(link => link.getText()
      .then(text => text.startsWith(gearOptionStartsWith))).first().click()
    );

export const rowFilters = $$('.row-filter__box');
export const rowFilterFor = (name: string) => rowFilters.filter(el => el.getText().then(text => text.includes(name))).first();
export const activeRowFilters = $$('.row-filter__box--active');

export const statusMessageTitle = $('.cos-status-box__title');
export const statusMessageDetail = $('.cos-status-box__detail');

const actionsButton = $('.co-m-nav-title .co-actions-menu');
export const actionsDropdown = actionsButton.$('button');
export const actionsDropdownMenu = actionsButton.$$('.dropdown-menu').first();

export const resourceTitle = $('#resource-title');

export const nameFilter = $('.form-control.text-filter');
export const messageLbl = $('.cos-status-box');
export const modalAnnotationsLink = $('.loading-box__loaded').element(by.partialLinkText('Annotation'));

export const visitResource = async(resource: string, name: string) => {
  await browser.get(`${appHost}/k8s/ns/${testName}/${resource}/${name}`);
};

export const deleteResource = async(resource: string, kind: string, name: string) => {
  await visitResource(resource, name);
  await isLoaded();
  await actionsDropdown.click();
  await browser.wait(until.presenceOf(actionsDropdownMenu), 500);
  await actionsDropdownMenu.element(by.partialLinkText('Delete ')).click();
  await browser.wait(until.presenceOf($('#confirm-action')));
  await $('#confirm-action').click();
};

export const checkResourceExists = async(resource: string, name: string) => {
  await visitResource(resource, name);
  await isLoaded();
  await browser.wait(until.presenceOf(actionsDropdown));
  expect(resourceTitle.getText()).toEqual(name);
};

export const emptyState = $('.cos-status-box').$('.text-center');

export const errorMessage = $('.alert-danger');
export const successMessage = $('.alert-success');
