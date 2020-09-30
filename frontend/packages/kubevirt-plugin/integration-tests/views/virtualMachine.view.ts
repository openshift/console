import { $, $$ } from 'protractor';

export const consoleSelectorDropdownId = '#console-type-selector';
export const consoleNetworkInterfaceDropdownId = '#nic-dropdown';

const manualConnectionValues = $$('.manual-connection-pf-value');
export const rdpIpAddress = manualConnectionValues.first();
export const rdpPort = manualConnectionValues.last();

// VM detail view
export const vmDetailItemId = (namespace, vmName, itemName) =>
  `#${namespace}-${vmName}-${itemName}`;
export const vmDetailButtonItemId = (namespace, vmName, itemName) =>
  `#${namespace}-${vmName}-${itemName}-edit`;

export const vmDetailStatus = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'vm-statuses'));
export const vmDetailName = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'name'));
export const vmDetailDesc = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'description'));
export const vmDetailOS = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'os'));
export const vmDetailIP = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'ip-addresses'));
export const vmDetailWorkloadProfile = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'workload-profile'));
export const vmDetailTemplate = (namespace, vmName) =>
  $(`${vmDetailItemId(namespace, vmName, 'template')}`);
export const vmDetailNamespace = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'namespace'));
export const vmDetailPod = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'pod'));
export const vmDetailNode = (namespace, vmName) => $(vmDetailItemId(namespace, vmName, 'node'));
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
  $(vmDetailItemId(namespace, vmName, 'boot-order')).$$('li');
export const vmDetailBootOrderEditButton = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'boot-order-edit'));
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

export const vmDetailstatusButton = (namespace, name) =>
  $(`${vmDetailItemId(namespace, name, 'vm-statuses')} > .pf-c-button.pf-m-link.pf-m-inline`);

export const vmDetailService = (serviceName) => $(`[data-test-id="${serviceName}"]`);

// Scheduling view
export const vmDetailDedicatedResources = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'dedicated-resources'));
export const vmDetailDedicatedResourcesEditButton = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'dedicated-resources-edit'));
export const vmDetailNodeSelector = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'node-selector'));
export const vmDetailNodeSelectorEditButton = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'node-selector-edit'));
export const vmDetailTolerations = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'tolerations'));
export const vmDetailTolerationsEditButton = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'tolerations-edit'));
export const vmDetailAffinity = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'affinity'));
export const vmDetailAffinityEditButton = (namespace, vmName) =>
  $(vmDetailItemId(namespace, vmName, 'affinity-edit'));
