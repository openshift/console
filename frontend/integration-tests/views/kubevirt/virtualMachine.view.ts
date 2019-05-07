/* eslint-disable no-unused-vars, no-undef */
import { $, $$, by, element, browser, ExpectedConditions as until } from 'protractor';

import { resourceRows } from '../crud.view';

export const overviewTab = 'Overview';
export const yamlTab = 'YAML';
export const consolesTab = 'Consoles';
export const EventsTab = 'Events';
export const disksTab = 'Disks';
export const nicsTab = 'Network Interfaces';

export const createNic = $('#create-nic-btn');
export const createDisk = $('#create-disk-btn');

export const nicName = $('#nic-name');
export const macAddress = $('#mac-address');
export const networkTypeDropdownId = '#network-type';
export const networkBindingId = '#binding';

export const diskName = $('#disk-name');
export const diskSize = $('#disk-size');
export const diskStorageClassDropdownId = '#disk-storage-class';

export const cancelBtn = $('button.kubevirt-cancel-accept-buttons.btn-default');
export const applyBtn = $('button.kubevirt-cancel-accept-buttons.btn-primary');

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

export const rowForName = (name: string) => resourceRows
  .filter((row) => row.$$('div').first().getText()
    .then(text => text === name)).first();
export const kebabForName = (name: string) => rowForName(name).$('button.co-kebab__button');
export const selectKebabOption = async(name: string, option: string) => {
  await browser.wait(until.presenceOf(kebabForName(name)));
  // open kebab dropdown
  await kebabForName(name).click();
  // select given option from opened dropdown
  await rowForName(name).$('.co-kebab__dropdown').$$('a')
    .filter(link => link.getText()
      .then(text => text.startsWith(option))).first().click();
};

// VM detail view
export const vmDetailItemId = (namespace, vmName, itemName) => `#${namespace}-${vmName}-${itemName}`;

export const vmDetailName = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'name'));
export const vmDetailDesc = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'description'));
export const vmDetailOS = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'os'));
export const vmDetailIP = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'ip-addresses'));
export const vmDetailWorkloadProfile = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'workload-profile'));
export const vmDetailTemplate = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'template'));
export const vmDetailHostname = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'fqdn'));
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
