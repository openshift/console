import { $, $$, browser, ExpectedConditions as until } from 'protractor';
import * as sidenavView from '@console/internal-integration-tests/views/sidenav.view';
import {
  isLoaded,
  rowForName,
  rowFilters,
  resourceRows,
} from '@console/internal-integration-tests/views/crud.view';
import { waitForCount, click, resolveTimeout } from '@console/shared/src/test-utils/utils';
import { BMH_ACTION_TIMEOUT_DEFAULT, BMH_STATUS } from '../const';

export const resourceStatus = $('[data-test-id="resource-status"]');
export const disabledDropdownButtons = $$('.pf-m-disabled');
export const confirmPowerOffCheckbox = $('[data-test-id="confirm-power-off-checkbox"]');

export const getRowFilterLabels = (): string[] =>
  rowFilters.map(async (f) => {
    const filterText = await f.getText();
    return filterText.replace(/^\d+\s*/, '');
  });

export const getResourceNameFromRow = (resourceRow) =>
  resourceRow
    .$$('.co-resource-item__resource-name')
    .first()
    .getText();

export const navigateToListView = async () => {
  await sidenavView.clickNavLink(['Compute', 'Bare Metal Hosts']);
  await isLoaded();
};

export const confirmAction = async () => {
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
};

export const confirmPowerOffAction = async () => {
  await browser.wait(
    until.and(
      until.presenceOf(confirmPowerOffCheckbox),
      until.elementToBeClickable(confirmPowerOffCheckbox),
    ),
  );
  await confirmPowerOffCheckbox.click();
  await confirmAction();
};

export const getProvisionedWorkerRows = () => {
  return resourceRows.filter(async (hostRow) => {
    const status = await hostRow.$('[data-test-id="resource-status"]').getText();
    const role = await hostRow.$('[data-test-id="node-roles"').getText();
    return role.includes('worker') && status === BMH_STATUS.Provisioned;
  });
};

/**
 * Selects option button from given dropdown element.
 */
export const selectDropdownItem = (getActionsDropdown) => async (action: string) => {
  await browser
    .wait(until.elementToBeClickable(getActionsDropdown()))
    .then(() => getActionsDropdown().click());
  await browser.wait(until.presenceOf($('[data-test-id="action-items"]')));
  await browser.wait(waitForCount(disabledDropdownButtons, 0));
  await click($(`[data-test-action="${action}"]`));
};

/**
 * Performs action via list view kebab menu.
 */
export const listViewAction = (resourceName) => async (action: string, confirm?: boolean) => {
  const getActionsDropdown = () => rowForName(resourceName).$('[data-test-id="kebab-button"]');
  await selectDropdownItem(getActionsDropdown)(action);
  if (confirm === true) {
    await confirmAction();
  }
};

export const waitForStatus = async (hostName: string, status: string, timeout?: number) => {
  const hostStatus = rowForName(hostName).$('[data-test-id="resource-status"]');
  await browser.wait(
    until.textToBePresentInElement(hostStatus, status),
    resolveTimeout(timeout, BMH_ACTION_TIMEOUT_DEFAULT),
  );
};

export const waitForSecondaryStatus = async (
  hostName: string,
  status: string,
  timeout?: number,
) => {
  const secondaryStatus = rowForName(hostName).$('[data-test-id="secondary-status"]');
  await browser.wait(
    until.textToBePresentInElement(secondaryStatus, status),
    resolveTimeout(timeout, BMH_ACTION_TIMEOUT_DEFAULT),
  );
};

export const waitForSecondaryStatusRemoved = async (hostName: string, timeout?: number) => {
  const secondaryStatus = rowForName(hostName).$('[data-test-id="secondary-status"]');
  await browser.wait(
    until.not(until.presenceOf(secondaryStatus)),
    resolveTimeout(timeout, BMH_ACTION_TIMEOUT_DEFAULT),
  );
};
