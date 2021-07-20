import { $, $$, browser, ExpectedConditions as until } from 'protractor';
import { click } from './shared-utils';

const PAGE_LOAD_TIMEOUT_SECS = 15 * 1000;
export const resourceRows = $$('[data-test-rows="resource-row"]');

// FIXME: Avoid this helper since it can result in StaleElementReferenceErrors.
// Prefer to use a `data-test-` attribute on the row.
export const rowForName = (name: string) =>
  resourceRows
    .filter((row) =>
      row
        .$$('.co-m-resource-icon + a')
        .first()
        .getText()
        .then((text) => text === name),
    )
    .first();

const listViewKebabDropdown = '[data-test-id="kebab-button"]';
export const detailViewDropdown = '[data-test-id="actions-menu-button"]';
export const detailViewDropdownMenu = '[data-test-id="action-items"]';

export async function confirmAction() {
  const dialogOverlay = $('.co-overlay');
  const confirmActionButton = $('#confirm-action');
  await browser.wait(
    until.and(
      until.presenceOf(confirmActionButton),
      until.elementToBeClickable(confirmActionButton),
    ),
    PAGE_LOAD_TIMEOUT_SECS,
  );
  await confirmActionButton.click();
  await browser.wait(until.not(until.presenceOf(dialogOverlay)), PAGE_LOAD_TIMEOUT_SECS);
}

/**
 * Selects option button from given dropdown element.
 */
const selectDropdownItem = (getActionsDropdown) => async (action: string) => {
  await browser.wait(until.elementToBeClickable(getActionsDropdown()));
  await getActionsDropdown().click();
  await browser.wait(until.presenceOf($(detailViewDropdownMenu)));
  await click($(`[data-test-action="${action}"]`));
};

/**
 * Performs action via list view kebab menu.
 */
export const listViewAction = (name) => async (action: string, confirm?: boolean) => {
  const getActionsDropdown = () =>
    rowForName(name)
      .$$(listViewKebabDropdown)
      .first();
  await selectDropdownItem(getActionsDropdown)(action);
  if (confirm === true) {
    await confirmAction();
  }
};

/**
 * Performs action on detail page.
 */
export const detailViewAction = async (action, confirm?) => {
  const getActionsDropdown = () => $(detailViewDropdown);
  await selectDropdownItem(getActionsDropdown)(action);
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
  await $('[data-test-id="action-items"]')
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
