import { $, $$, browser, ExpectedConditions as until } from 'protractor';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import * as sideNavView from '@console/internal-integration-tests/views/sidenav.view';
import { click } from '@console/shared/src/test-utils/utils';
import { PVC_STATUS } from '../utils/consts';
import { PvcType } from '../utils/helpers';

export const selectItemFromDropdown = async (item, dropdownElement) => {
  await click(dropdownElement);
  await click($(`#${item}-link`));
};

// create pvc
export const namespaceDropdown = $$('[class="pf-c-dropdown__toggle pf-m-plain"]').get(0);
export const storageclassDropdown = $('#storageclass-dropdown');
export const inputPVCName = $('#pvc-name');
export const selectAccessMode = (accessMode) => $(`input[value=${accessMode}]`);
export const inputPVCSize = $('[name=requestSizeValue]');
export const sizeUnitsDropdown = $('[data-test-id=dropdown-button]');

// pvc details
export const pvcName = $('[data-test-id=pvc-name]');
export const pvcStatus = $('[data-test-id=pvc-status]');
export const pvcSize = $('[data-test-id=pvc-capacity]');
export const pvcAccessMode = $('[data-test-id=pvc-access-mode]');
export const pvcVolumeMode = $('[data-test-id=pvc-volume-mode]');
export const pvcStorageClass = $('[data-test-id=pvc-storageclass]');
export const pvcPersistentVolume = $('[data-test-id=persistent-volume]');
export const actionsButton = $('[data-test-id=actions-menu-button]');
export const deletePvc = $('[data-test-action="Delete Persistent Volume Claim"]');

// list of PVCs
export const nameInTable = (name) => $(`a[data-test-id=${name}]`);

export const goToPersistentVolumeClaims = async () => {
  await sideNavView.clickNavLink(['Storage', 'Persistent Volume Claims']);
  await crudView.isLoaded();
};

export const createNewPersistentVolumeClaim = async (pvc: PvcType, waitForBinding: boolean) => {
  await goToPersistentVolumeClaims();
  await selectItemFromDropdown(pvc.namespace, namespaceDropdown);
  await click(crudView.createYAMLButton);
  await browser.wait(
    until.textToBePresentInElement($('.co-m-pane__heading'), 'Create Persistent Volume Claim'),
  );
  await browser.wait(until.and(crudView.untilNoLoadersPresent));
  await selectItemFromDropdown(pvc.storageClass, storageclassDropdown);
  await inputPVCName.sendKeys(pvc.name);
  await click(selectAccessMode(pvc.accessMode));
  await inputPVCSize.sendKeys(pvc.size);
  // Units should be Mi, Gi or Ti
  await selectItemFromDropdown(pvc.sizeUnits, sizeUnitsDropdown);
  await click(crudView.saveChangesBtn);
  if (waitForBinding === true)
    await browser.wait(until.textToBePresentInElement(pvcStatus, PVC_STATUS.BOUND));
};

export const deletePersistentVolumeClaim = async (name: string, namespace: string) => {
  await goToPersistentVolumeClaims();
  await selectItemFromDropdown(namespace, namespaceDropdown);
  await crudView.resourceRowsPresent();
  await crudView.filterForName(name);
  await crudView.isLoaded();
  await crudView.deleteRow('PersistentVolumeClaim')(name);
};
