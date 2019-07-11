/* eslint-disable no-unused-vars, no-undef */
import { $, $$, by, element } from 'protractor';

export const statusIcon = (status) => $(`.kubevirt-status__icon.${status}`);
export const statusLink = $('a.kubevirt-status__link');

export const statusIcons = {
  starting: 'pficon-pending',
  importError: 'pficon-error-circle-o',
  importing: 'pficon-import',
  migrating: 'pficon-migration',
  running: 'pficon-on-running',
  off: 'pficon-off',
};

export const consoleSelectorDropdownId = '#console-type-selector';
export const consoleNetworkInterfaceDropdownId = '#nic-dropdown';

const manualConnectionValues = $$('.manual-connection-pf-value');
export const rdpIpAddress = manualConnectionValues.first();
export const rdpPort = manualConnectionValues.last();

export const overviewIpAddresses = (name: string, namespace: string) => $(`#${namespace}-${name}-ip-addresses`);

// VM detail view
export const vmDetailItemId = (namespace, vmName, itemName) => `#${namespace}-${vmName}-${itemName}`;

export const vmDetailName = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'name'));
export const vmDetailDesc = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'description'));
export const vmDetailOS = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'os'));
export const vmDetailIP = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'ip-addresses'));
export const vmDetailWorkloadProfile = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'workload-profile'));
export const vmDetailTemplate = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'template'));
export const vmDetailHostname = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'hostname'));
export const vmDetailNamespace = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'namespace'));
export const vmDetailPod = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'pod'));
export const vmDetailNode = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'node'));
export const vmDetailFlavor = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'flavor'));
export const vmDetailFlavorDropdownId = (namespace, vmName) => vmDetailItemId(namespace, vmName, 'flavor-dropdown');
export const vmDetailFlavorDropdown = (namespace, vmName) => $(vmDetailFlavorDropdownId(namespace, vmName));
export const vmDetailFlavorDesc = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'flavor-description'));
export const vmDetailFlavorCPU = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'flavor-cpu'));
export const vmDetailFlavorMemory = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'flavor-memory'));
export const vmDetailDescTextarea = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'description-textarea'));
export const vmDetailBootOrder = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'boot-order')).$('.kubevirt-boot-order__list').$$('li');

export const detailViewEditBtn = element(by.buttonText('Edit'));
export const detailViewSaveBtn = element(by.buttonText('Save'));
export const detailViewCancelBtn = element(by.buttonText('Cancel'));

export const vmDetailServiceItem = (namespace, serviceName) => `[href="/k8s/ns/${namespace}/services/${serviceName}"]`;
export const vmDetailService = (namespace, serviceName) => $(vmDetailServiceItem(namespace, serviceName));
