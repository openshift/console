import { $, $$, browser, ExpectedConditions as until } from 'protractor';
import { rowForName, resourceRowsPresent } from '../../../../integration-tests/views/crud.view';
import { waitForCount } from '../../../console-shared/src/test-utils/utils';

const disabledDropdownButtons = $$('.pf-m-disabled');

const listViewKebabDropdown = '.pf-c-dropdown__toggle';
const listViewKebabDropdownMenu = '.pf-c-dropdown__menu';
export const detailViewDropdown = '[data-test-id=actions-menu-button]';
export const detailViewDropdownMenu = '[data-test-id=action-items]';

export async function confirmAction() {
  const dialogOverlay = $('.co-overlay');
  const confirmActionButton = $('#confirm-action');
  await browser.wait(
    until.and(
      until.presenceOf(confirmActionButton),
      until.elementToBeClickable(confirmActionButton),
    ),
  );
  await confirmActionButton.click();
  await browser.wait(until.not(until.presenceOf(dialogOverlay)));
}

/**
 * Selects option button from given dropdown element.
 */
const selectDropdownItem = (getActionsDropdown, getActionsDropdownMenu) => async (
  action: string,
) => {
  await browser
    .wait(until.elementToBeClickable(getActionsDropdown()))
    .then(() => getActionsDropdown().click());
  await browser.wait(waitForCount(disabledDropdownButtons, 0));
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
    await confirmAction();
  }
};

/**
 * Performs action for VM on its detail page.
 */
export const detailViewAction = async (action, confirm?) => {
  const getActionsDropdown = () => $(detailViewDropdown);
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
  await browser
    .wait(until.elementToBeClickable(getActionsDropdown()))
    .then(() => getActionsDropdown().click());

  const options = [];
  await $('ul.dropdown-menu-right')
    .$$('li')
    .each(async (elem) => {
      elem
        .getText()
        .then((text) => {
          options.push(text);
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error(error);
        });
    });

  await browser
    .wait(until.elementToBeClickable(getActionsDropdown()))
    .then(() => getActionsDropdown().click());
  return options;
}
