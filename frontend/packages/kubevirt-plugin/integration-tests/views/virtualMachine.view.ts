import { $, $$, browser, ExpectedConditions as until } from 'protractor';
import { resourceTitle } from '@console/internal-integration-tests/views/crud.view';
import { resolveTimeout } from '@console/shared/src/test-utils/utils';
import {
  VM_BOOTUP_TIMEOUT_SECS,
  VM_STOP_TIMEOUT_SECS,
  PAGE_LOAD_TIMEOUT_SECS,
  VM_ACTIONS_TIMEOUT_SECS,
  UNEXPECTED_ACTION_ERROR,
  VM_ACTIONS,
} from '../tests/utils/consts';
import { nameInput as cloneDialogNameInput } from './cloneDialog.view';

export const statusIcon = (status) => $(`.kubevirt-status__icon.${status}`);
export const statusLink = $('a.kubevirt-status__link');

export const statusIcons = {
  starting: 'pficon-in-progress',
  migrating: 'pficon-in-progress',
  running: 'pficon-ok',
  off: 'pficon-off',
  error: 'pficon-error-circle-o',
};

export const consoleSelectorDropdownId = '#console-type-selector';
export const consoleNetworkInterfaceDropdownId = '#nic-dropdown';

const manualConnectionValues = $$('.manual-connection-pf-value');
export const rdpIpAddress = manualConnectionValues.first();
export const rdpPort = manualConnectionValues.last();

export const overviewIpAddresses = (name: string, namespace: string) =>
  $(`#${namespace}-${name}-ip-addresses`);

// VM detail view
export const vmDetailItemId = (namespace, vmName, itemName) =>
  `#${namespace}-${vmName}-${itemName}`;

export const vmDetailName = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'name'));
export const vmDetailDesc = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'description'));
export const vmDetailOS = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'os'));
export const vmDetailIP = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'ip-addresses'));
export const vmDetailWorkloadProfile = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'workload-profile'));
export const vmDetailTemplate = (namespace, vmName) =>
  $(`${vmDetailItemId(namespace, vmName, 'template')} > a`);
export const vmDetailNamespace = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'namespace'));
export const vmDetailPod = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'pod'));
export const vmDetailNode = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'node'));
export const vmDetailCd = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'cdrom'));
export const vmDetailCdEditButton = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'cdrom-edit'));
export const vmDetailFlavor = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'flavor'));
export const vmDetailFlavorEditButton = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'flavor-edit'));
export const vmDetailFlavorDropdownId = (namespace, vmName) =>
  vmDetailItemId(namespace, vmName, 'flavor-dropdown');
export const vmDetailFlavorDropdown = (namespace, vmName) =>
  $(vmDetailFlavorDropdownId(namespace, vmName));
export const vmDetailFlavorDesc = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'flavor-description'));
export const vmDetailFlavorCPU = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'flavor-cpu'));
export const vmDetailFlavorMemory = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'flavor-memory'));
export const vmDetailDescTextarea = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'description-textarea'));
export const vmDetailBootOrder = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'boot-order'))
    .$('.kubevirt-boot-order__list')
    .$$('li');
export const vmDetailLabelValue = async (labelKey) => {
  const filteredLabel = $$('.co-m-label').filter((elem) =>
    elem
      .$('.co-m-label__key')
      .getText()
      .then((text) => text === labelKey),
  );
  const valueElem = filteredLabel.first().$('.co-m-label__value');
  const value = await valueElem.getText();
  return value;
};

export const vmDetailService = (serviceName) => $(`[data-test-id="${serviceName}"]`);

export async function waitForStatusIcon(icon: string, timeout: number) {
  await browser.wait(until.presenceOf(statusIcon(icon)), timeout);
}

export async function waitForActionFinished(action: string, timeout?: number) {
  switch (action) {
    case VM_ACTIONS.START:
      await waitForStatusIcon(statusIcons.running, resolveTimeout(timeout, VM_BOOTUP_TIMEOUT_SECS));
      break;
    case VM_ACTIONS.RESTART:
      await browser.wait(
        until.or(
          until.presenceOf(statusIcon(statusIcons.starting)),
          until.presenceOf(statusIcon(statusIcons.error)),
        ),
        resolveTimeout(timeout, VM_BOOTUP_TIMEOUT_SECS),
      );
      await waitForStatusIcon(statusIcons.running, resolveTimeout(timeout, VM_BOOTUP_TIMEOUT_SECS));
      break;
    case VM_ACTIONS.STOP:
      await waitForStatusIcon(statusIcons.off, resolveTimeout(timeout, VM_STOP_TIMEOUT_SECS));
      break;
    case VM_ACTIONS.CLONE:
      await browser.wait(
        until.visibilityOf(cloneDialogNameInput),
        resolveTimeout(timeout, PAGE_LOAD_TIMEOUT_SECS),
      );
      break;
    case VM_ACTIONS.MIGRATE:
      await waitForStatusIcon(
        statusIcons.migrating,
        resolveTimeout(timeout, PAGE_LOAD_TIMEOUT_SECS),
      );
      await waitForStatusIcon(
        statusIcons.running,
        resolveTimeout(timeout, VM_ACTIONS_TIMEOUT_SECS),
      );
      break;
    case VM_ACTIONS.CANCEL:
      await waitForStatusIcon(statusIcons.running, resolveTimeout(timeout, PAGE_LOAD_TIMEOUT_SECS));
      break;
    case VM_ACTIONS.DELETE:
      // wait for redirect
      await browser.wait(
        until.textToBePresentInElement(resourceTitle, 'Virtual Machines'),
        resolveTimeout(timeout, PAGE_LOAD_TIMEOUT_SECS),
      );
      break;
    default:
      throw Error(UNEXPECTED_ACTION_ERROR);
  }
}
