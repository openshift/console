import { $, $$, browser, ExpectedConditions as until } from 'protractor';
import { rowForName, confirmAction } from '../crud.view';

export const detailViewVmStatus = $('#details-column-1 .kubevirt-vm-status__link');
export const listViewVmStatus = (name: string) => rowForName(name).$('.kubevirt-vm-status__link');

const listViewKebabDropdown = '.co-kebab__button';
const listViewKebabDropdownMenu = '.co-kebab__dropdown';
export const detailViewDropdown = '.co-m-nav-title  button';
export const detailViewDropdownMenu = '.dropdown-menu-right';

/**
 * Selects option link from given dropdown element.
 */
const selectDropdownItem = (getActionsDropdown, getActionsDropdownMenu) => async(action) => {
  await browser.wait(until.elementToBeClickable(getActionsDropdown())).then(() => getActionsDropdown().click());
  const option = getActionsDropdownMenu().$$('a').filter(link => link.getText().then(text => text.startsWith(action))).first();
  await browser.wait(until.elementToBeClickable(option)).then(() => option.click());
};

/**
 * Performs action for VM via list view kebab menu.
 */
export const listViewAction = (name) => async(action) => {
  const getActionsDropdown = () => rowForName(name).$$(listViewKebabDropdown).first();
  const getActionsDropdownMenu = () => rowForName(name).$(listViewKebabDropdownMenu);
  await selectDropdownItem(getActionsDropdown, getActionsDropdownMenu)(action);
  await confirmAction();
  await browser.wait(until.not(until.presenceOf(rowForName(name).$(listViewKebabDropdownMenu))));
};

/**
 * Performs action for VM on its detail page.
 */
export const detailViewAction = async(action, confirm?) => {
  const getActionsDropdown = () => $$(detailViewDropdown).first();
  const getActionsDropdownMenu = () => $(detailViewDropdownMenu);
  await selectDropdownItem(getActionsDropdown, getActionsDropdownMenu)(action);
  await browser.wait(until.not(until.presenceOf($(detailViewDropdownMenu))));
  if (confirm === true) {
    await confirmAction();
  }
};

/**
 * Returns available options from Action.
 * Temporary method that should be superseded by more general getDropdownOptions method in utils.ts
 * once https://github.com/openshift/console/issues/1492 is resolved
 */
export async function getDetailActionDropdownOptions(): Promise<string[]> {
  const getActionsDropdown = () => $$(detailViewDropdown).first();
  await browser.wait(until.elementToBeClickable(getActionsDropdown())).then(() => getActionsDropdown().click());

  const options = [];
  await $('ul.dropdown-menu-right').$$('li').each(async(element) => {
    element.getText().then((text) => {
      options.push(text);
    });
  });

  await browser.wait(until.elementToBeClickable(getActionsDropdown())).then(() => getActionsDropdown().click());
  return options;
}
