import { $, $$, browser, ExpectedConditions as until } from 'protractor';
import { rowForName, confirmAction } from '../crud.view';

export const detailViewVMmStatus = $('#details-column-1 > dl:nth-child(1) > dd:nth-child(2)');
export const listViewVMmStatus = (name: string) => rowForName(name).$('div.co-m-row:first-child > div:first-child > div:nth-child(3)');

const listViewKebabDropdown = '.co-kebab__button';
const listViewKebabDropdownMenu = '.co-kebab__dropdown';
const detailViewDropdown = '.co-m-nav-title  button';
const detailViewDropdownMenu = '.dropdown-menu-right';

/**
 * Selects option link from given dropdown element.
 */
const selectDropdownItem = (getActionsDropdown, getActionsDropdownMenu) => async(action) => {
  await getActionsDropdown().click();
  await getActionsDropdownMenu().$$('a').filter(link => link.getText().then(text => text.startsWith(action))).first().click();
};

/**
 * Performs action for VM via list view kebab menu.
 */
export const listViewAction = (name) => async(action) => {
  const getActionsDropdown = () => rowForName(name).$$(listViewKebabDropdown).first();
  const getActionsDropdownMenu = () => rowForName(name).$(listViewKebabDropdownMenu);
  selectDropdownItem(getActionsDropdown, getActionsDropdownMenu)(action);
  await confirmAction();
  await browser.wait(until.not(until.presenceOf(rowForName(name).$(listViewKebabDropdownMenu))));
};

/**
 * Performs action for VM on its detail page.
 */
export const detailViewAction = async(action) => {
  const getActionsDropdown = () => $$(detailViewDropdown).first();
  const getActionsDropdownMenu = () => $(detailViewDropdownMenu);
  selectDropdownItem(getActionsDropdown, getActionsDropdownMenu)(action);
  await confirmAction();
  await browser.wait(until.not(until.presenceOf($(detailViewDropdownMenu))));
};

