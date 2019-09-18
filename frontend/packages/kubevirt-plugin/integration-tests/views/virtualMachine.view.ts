import { $, $$, browser, ExpectedConditions as until } from 'protractor';
import { resolveTimeout } from '../../../console-shared/src/test-utils/utils';
import {
  VM_BOOTUP_TIMEOUT_SECS,
  VM_STOP_TIMEOUT_SECS,
  PAGE_LOAD_TIMEOUT_SECS,
  VM_ACTIONS_TIMEOUT_SECS,
  UNEXPECTED_ACTION_ERROR,
} from '../tests/utils/consts';
import { resourceTitle } from '../../../../integration-tests/views/crud.view';
import { nameInput } from './wizard.view';

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
export const vmDetailFlavor = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'flavor'));
export const vmDetailBootOrder = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'boot-order'))
    .$('.kubevirt-boot-order__list')
    .$$('li');

export const vmDetailService = (serviceName) => $(`[data-test-id="${serviceName}"]`);

export async function waitForStatusIcon(icon: string, timeout: number) {
  await browser.wait(until.presenceOf(statusIcon(icon)), timeout);
}

export async function waitForActionFinished(action: string, timeout?: number) {
  switch (action) {
    case 'Start':
      await waitForStatusIcon(statusIcons.running, resolveTimeout(timeout, VM_BOOTUP_TIMEOUT_SECS));
      break;
    case 'Restart':
      await browser.wait(
        until.or(
          until.presenceOf(statusIcon(statusIcons.starting)),
          until.presenceOf(statusIcon(statusIcons.error)),
        ),
        resolveTimeout(timeout, VM_BOOTUP_TIMEOUT_SECS),
      );
      await waitForStatusIcon(statusIcons.running, resolveTimeout(timeout, VM_BOOTUP_TIMEOUT_SECS));
      break;
    case 'Stop':
      await waitForStatusIcon(statusIcons.off, resolveTimeout(timeout, VM_STOP_TIMEOUT_SECS));
      break;
    case 'Clone':
      await browser.wait(
        until.presenceOf(nameInput),
        resolveTimeout(timeout, PAGE_LOAD_TIMEOUT_SECS),
      );
      await browser.sleep(500); // Wait until the fade in effect is finished, otherwise we may misclick
      break;
    case 'Migrate':
      await waitForStatusIcon(
        statusIcons.migrating,
        resolveTimeout(timeout, PAGE_LOAD_TIMEOUT_SECS),
      );
      await waitForStatusIcon(
        statusIcons.running,
        resolveTimeout(timeout, VM_ACTIONS_TIMEOUT_SECS),
      );
      break;
    case 'Cancel':
      await waitForStatusIcon(statusIcons.running, resolveTimeout(timeout, PAGE_LOAD_TIMEOUT_SECS));
      break;
    case 'Delete':
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
