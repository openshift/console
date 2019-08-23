import { $, element, by, browser, ExpectedConditions as until } from 'protractor';
import { rowForName, resourceRowsPresent } from '../../../../integration-tests/views/crud.view';
import { click } from '../../../console-shared/src/test-utils/utils';

const dialogOverlay = $('.co-overlay');

const listViewKebabDropdown = '.pf-c-dropdown__toggle';
const listViewKebabDropdownMenu = '.pf-c-dropdown__menu';
export const detailViewDropdown = '#action-dropdown';
export const detailViewDropdownMenu = '.dropdown-menu-right';

export const confirmAction = () =>
  browser
    .wait(until.presenceOf($('button[type=submit]')))
    .then(() => $('button[type=submit]').click())
    .then(() => browser.wait(until.not(until.presenceOf(dialogOverlay))));

/**
 * Selects option button from given dropdown element.
 */
const selectDropdownItem = (getActionsDropdown, getActionsDropdownMenu) => async (
  action: string,
) => {
  await browser
    .wait(until.elementToBeClickable(getActionsDropdown()))
    .then(() => getActionsDropdown().click());
  const option = getActionsDropdownMenu()
    .$$('button')
    .filter((button) => button.getText().then((text) => text.startsWith(action)))
    .first();
  await browser.wait(until.elementToBeClickable(option)).then(() => option.click());
};

/**
 * Performs action for VM via list view kebab menu.
 */
export const listViewAction = (name) => async (action: string, confirm?: boolean) => {
  await resourceRowsPresent();
  const getActionsDropdown = () =>
    rowForName(name)
      .$$(listViewKebabDropdown)
      .first();
  const getActionsDropdownMenu = () => rowForName(name).$(listViewKebabDropdownMenu);
  await selectDropdownItem(getActionsDropdown, getActionsDropdownMenu)(action);
  if (confirm === true) {
    if (action === 'Migrate') {
      // TODO: WA for BZ(1719227), remove when resolved
      await click(element(by.buttonText('Migrate')));
      await browser.wait(until.not(until.presenceOf($('.co-overlay'))));
    } else {
      await confirmAction();
    }
  }
};
