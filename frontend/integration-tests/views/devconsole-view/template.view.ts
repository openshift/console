// import * as _ from 'lodash';
import { $, $$, browser, by, ExpectedConditions as until } from 'protractor';

import { appHost, testName, waitForNone } from '../../protractor.conf';
import { resourceTitle } from '../../views/crud.view';


export const reloadBtn = $('#reload-object');

//element finder with class name
export const untilLoadingBoxLoaded = until.presenceOf($('.loading-box__loaded'));
export const untilNoLoadersPresent = waitForNone($$('.co-m-loader'));

export const isLoaded = () => browser.wait(until.and(untilNoLoadersPresent, untilLoadingBoxLoaded)).then(() => browser.sleep(1000));

export const resourceRows = $$('[data-test-rows="resource-row"]');
// export const resourceRowNamesAndNs = $$('.co-m-resource-icon + a');

export const rowForName = (name: string) => resourceRows.filter((row) => row.$$('.co-m-resource-icon + a').first().getText().then(text => text === name)).first();

//element finder with data-test-id name
const actionsMenu = $('[data-test-id="details-actions"]');
export const actionsButton = actionsMenu.$('[data-test-id="actions-menu-button"]');
export const modalAnnotationsLink = $('[data-test-id=resource-summary] [data-test-id=edit-annotations]');

export const actions = Object.freeze({
  labels: 'Edit Labels',
  annotations: 'Edit Annotations',
  edit: 'Edit',
  delete: 'Delete',
});
const actionForLabel = (label: string) => $(`[data-test-action="${label}"]`);

/*************************************************************************************/
/*action functions*/
export const clickKebabAction = (resourceName: string, actionLabel: string) => {
  return rowForName(resourceName).$('[data-test-id="kebab-button"]').click()
    .then(() => browser.wait(until.elementToBeClickable(actionForLabel(actionLabel))))
    .then(() => actionForLabel(actionLabel).click());
};
/*************************************************************************************/

/*************************************************************************************/
/* filters */
export const rowFilters = $$('.row-filter__box');
export const rowFilterFor = (name: string) => rowFilters.filter(el => el.getText().then(text => text.includes(name))).first();
/*************************************************************************************/


export const visitResource = async(resource: string, name: string) => {
  await browser.get(`${appHost}/k8s/ns/${testName}/${resource}/${name}`);
};

export const function_Name = async(actionID: string) => {
  const action = actionForLabel(actionID);
  await browser.wait(until.presenceOf(actionsButton));
  await actionsButton.click();
  await browser.wait(until.elementToBeClickable(action));
  await action.click();
  expect(resourceTitle.getText()).toEqual(name);
};

// Navigates to create new resource page, creates an example resource of the specified kind,
// then navigates back to the original url.
