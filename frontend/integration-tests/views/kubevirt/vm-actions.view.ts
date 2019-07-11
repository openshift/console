import { $, $$, browser, ExpectedConditions as until, by, element } from 'protractor';
import { click } from '../../tests/kubevirt/utils/utils';

export const resourceRows = $$('.co-resource-list__item');
export const rowForName = (name: string) => resourceRows.filter((row) => row.$$('.co-m-resource-icon + a').first().getText().then(text => text === name)).first();

export const detailViewVmStatus = $('#details-column-1 .kubevirt-vm-status__link');
export const listViewVmStatus = (name: string) => rowForName(name).$('.kubevirt-vm-status__link');

const listViewKebabDropdown = '.co-kebab__button';
const listViewKebabDropdownMenu = '.co-kebab__dropdown';
export const detailViewDropdown = '#action-dropdown';
export const detailViewDropdownMenu = '.dropdown-menu-right';

export const confirmAction = () => browser.wait(until.presenceOf($('button[type=submit]')))
  .then(() => $('button[type=submit]').click())
  .then(() => browser.wait(until.not(until.presenceOf($('.co-overlay')))));

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
    if (action === 'Migrate') {
      await click(element(by.buttonText('Migrate')));
    } else {
      // TODO: WA for BZ(1719227), remove when resolved
      await confirmAction();
      await browser.wait(until.not(until.presenceOf($('.co-overlay'))));
    }
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
  await $('ul.dropdown-menu-right').$$('li').each(async(elem) => {
    elem.getText().then((text) => {
      options.push(text);
    });
  });

  await browser.wait(until.elementToBeClickable(getActionsDropdown())).then(() => getActionsDropdown().click());
  return options;
}
