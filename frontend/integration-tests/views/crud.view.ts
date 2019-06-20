import * as _ from 'lodash';
import { safeDump, safeLoad } from 'js-yaml';
import { $, $$, browser, by, ExpectedConditions as until } from 'protractor';

import * as yamlView from './yaml.view';
import { appHost, testName, waitForNone } from '../protractor.conf';

export const createYAMLButton = $('#yaml-create');
export const createItemButton = $('#item-create');
export const createYAMLLink = $('#yaml-link');

export const saveChangesBtn = $('#save-changes');
export const reloadBtn = $('#reload-object');
export const cancelBtn = $('#cancel');

/**
 * Returns a promise that resolves after the loading spinner is not present.
 */
export const untilLoadingBoxLoaded = until.presenceOf($('.loading-box__loaded'));
export const untilNoLoadersPresent = waitForNone($$('.co-m-loader'));
export const isLoaded = () => browser.wait(until.and(untilNoLoadersPresent, untilLoadingBoxLoaded)).then(() => browser.sleep(1000));
export const resourceRowsPresent = () => browser.wait(until.presenceOf($('.co-m-resource-icon + a')), 10000);

export const resourceRows = $$('[data-test-rows="resource-row"]');
export const resourceRowNamesAndNs = $$('.co-m-resource-icon + a');
export const rowForName = (name: string) => resourceRows.filter((row) => row.$$('.co-m-resource-icon + a').first().getText().then(text => text === name)).first();
export const rowForOperator = (name: string) => resourceRows.filter((row) => row.$('.co-clusterserviceversion-logo__name__clusterserviceversion').getText().then(text => text === name)).first();

const navMenu = $('.co-m-horizontal-nav__menu');
const isNavLoaded = () => browser.wait(until.presenceOf(navMenu));
export const navTabFor = (name: string) => navMenu.element(by.linkText(name));
export const clickTab = async(name: string) => {
  await isNavLoaded();
  await navTabFor(name).click();
};


export const labelsForRow = (name: string) => rowForName(name).$$('.co-m-label');
export const textFilter = $('.co-m-pane__filter-bar-group--filter input');
export const actions = Object.freeze({
  labels: 'Edit Labels',
  annotations: 'Edit Annotations',
  edit: 'Edit',
  delete: 'Delete',
});
const actionForLabel = (label: string) => $(`[data-test-action="${label}"]`);

export const filterForName = async(name: string) => {
  await browser.wait(until.presenceOf(textFilter));
  await textFilter.sendKeys(name);
};

const actionOnKind = (action: string, kind: string) => {
  const humanizedKind = (kind.includes('~')
    ? kind.split('~')[2]
    : kind
  ).split(/(?=[A-Z])/).join(' ');

  return `${action} ${humanizedKind}`;
};
export const editHumanizedKind = (kind: string) => actionOnKind(actions.edit, kind);
export const deleteHumanizedKind = (kind: string) => actionOnKind(actions.delete, kind);

export const clickKebabAction = (resourceName: string, actionLabel: string) => {
  return rowForName(resourceName).$('[data-test-id="kebab-button"]').click()
    .then(() => browser.wait(until.elementToBeClickable(actionForLabel(actionLabel))))
    .then(() => actionForLabel(actionLabel).click());
};

/**
 * Edit row from a list.
 */
export const editRow = (kind: string) => (name: string) => clickKebabAction(name, editHumanizedKind(kind))
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
export const deleteRow = (kind: string) => (name: string) => clickKebabAction(name, deleteHumanizedKind(kind))
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

    const kebabIsDisabled = until.not(until.elementToBeClickable(rowForName(name).$('.co-kebab__button')));
    const listIsEmpty = until.textToBePresentInElement($('.cos-status-box > .text-center'), 'No ');
    const rowIsGone = until.not(until.presenceOf(rowForName(name).$('.co-kebab')));
    return browser.wait(until.or(kebabIsDisabled, until.or(listIsEmpty, rowIsGone)));

  });

export const rowFilters = $$('.row-filter__box');
export const rowFilterFor = (name: string) => rowFilters.filter(el => el.getText().then(text => text.includes(name))).first();
export const activeRowFilters = $$('.row-filter__box--active');

export const statusMessageTitle = $('.cos-status-box__title');
export const statusMessageDetail = $('.cos-status-box__detail');

const actionsMenu = $('[data-test-id="details-actions"]');
export const actionsButton = actionsMenu.$('[data-test-id="actions-menu-button"]');
export const actionsDropdownMenu = actionsMenu.$('[data-test-id="action-items"]');

export const resourceTitle = $('#resource-title');

export const nameFilter = $('.form-control.co-text-filter');
export const messageLbl = $('.cos-status-box');
export const modalAnnotationsLink = $('[data-test-id=resource-summary] [data-test-id=edit-annotations]');

export const visitResource = async(resource: string, name: string) => {
  await browser.get(`${appHost}/k8s/ns/${testName}/${resource}/${name}`);
};

export const clickDetailsPageAction = async(actionID: string) => {
  const action = actionForLabel(actionID);
  await browser.wait(until.presenceOf(actionsButton));
  await actionsButton.click();
  await browser.wait(until.elementToBeClickable(action));
  await action.click();
};

export const deleteResource = async(resource: string, kind: string, name: string) => {
  await visitResource(resource, name);
  await isLoaded();
  clickDetailsPageAction(deleteHumanizedKind(kind));
  await browser.wait(until.presenceOf($('#confirm-action')));
  await $('#confirm-action').click();
};

// Navigates to create new resource page, creates an example resource of the specified kind,
// then navigates back to the original url.
export const createNamespacedTestResource = async(kindModel, name) => {
  const next = await browser.getCurrentUrl();
  await browser.get(`${appHost}/k8s/ns/${testName}/${kindModel.plural}/~new`);
  await yamlView.isLoaded();
  const content = await yamlView.editorContent.getText();
  const newContent = _.defaultsDeep({}, {metadata: {name, labels: {automatedTestName: testName}}}, safeLoad(content));
  await yamlView.setContent(safeDump(newContent));
  await browser.wait(until.textToBePresentInElement(yamlView.editorContent, name));
  await yamlView.saveButton.click();
  await browser.wait(until.presenceOf($(`.co-m-${kindModel.kind}`)));
  await browser.get(next);
};

export const checkResourceExists = async(resource: string, name: string) => {
  await visitResource(resource, name);
  await isLoaded();
  await browser.wait(until.presenceOf(actionsButton));
  expect(resourceTitle.getText()).toEqual(name);
};

export const emptyState = $('.cos-status-box').$('.text-center');

export const errorMessage = $('.alert-danger');
export const successMessage = $('.alert-success');
