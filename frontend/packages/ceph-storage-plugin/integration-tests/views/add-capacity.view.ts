import { browser, ExpectedConditions as until, $ } from 'protractor';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import * as sideNavView from '@console/internal-integration-tests/views/sidenav.view';
import { click } from '@console/shared/src/test-utils/utils';
import { CAPACITY_UNIT, CAPACITY_VALUE, OCS_OP } from '../utils/consts';
import { currentSelectors } from './installFlow.view';

export const ocsOp = $(`a[data-test-operator-row='${OCS_OP}']`);

export const actionForLabel = (label: string) => $(`button[data-test-action='${label}']`);
export const confirmButton = $('#confirm-action');
export const storageClusterRow = (uid) => $(`tr[data-id='${uid}']`);

const capacityValueInput = $('input.add-capacity-modal__input--width');
const capacityUnitButton = $('button[data-test-id="dropdown-button"] .pf-c-dropdown__toggle-text');

export const verifyFields = async () => {
  await browser.wait(until.presenceOf(capacityValueInput));
  await browser.wait(until.presenceOf(capacityUnitButton));
  expect(capacityUnitButton.getText()).toEqual(CAPACITY_UNIT);
  expect(capacityValueInput.getAttribute('value')).toBe(CAPACITY_VALUE);
};

export const clickKebabAction = async (uid: string, actionLabel: string) => {
  await browser.wait(until.presenceOf(storageClusterRow(uid)));
  const kebabMenu = storageClusterRow(uid).$('button[data-test-id="kebab-button"]');
  await click(kebabMenu);
  const lbl = actionForLabel(actionLabel);
  await click(lbl);
};

export const goToInstalledOperators = async () => {
  await browser.wait(until.and(crudView.untilNoLoadersPresent));
  await sideNavView.clickNavLink(['Operators', 'Installed Operators']);
  await browser.wait(until.and(crudView.untilNoLoadersPresent));
  await click(currentSelectors.namespaceDropdown);
  await click(currentSelectors.openshiftStorageItem);
  await browser.wait(until.and(crudView.untilNoLoadersPresent));
};
