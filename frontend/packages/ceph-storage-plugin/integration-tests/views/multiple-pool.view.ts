import * as sideNavView from '@console/internal-integration-tests/views/sidenav.view';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import { click } from '@console/shared/src/test-utils/utils';
import { $, ExpectedConditions as until, browser } from 'protractor';
import { SECOND } from '../utils/consts';
import { sendKeys } from '../utils/helpers';
import { poolData } from '../mocks/storage-pool';

export const poolMessage = {
  PROGRESS:
    'The creation of an OCS storage cluster is still in progress or have failed, please try again after the storage cluster is ready to use.',
  POOL_START: 'Pool "foo" creation in progress',
  POOL_TIMEOUT:
    'Pool "foo" creation timed out. Please check if ocs-operator and rook operator are running',
  POOL_DUPLICATED: 'Pool "foo" already exists',
  POOL_CREATED: 'Pool "foo" was successfully created',
};

export enum POOL_STATUS {
  READY = 'Ready',
}

export const inputProvisioner = $('button[id=storage-class-provisioner]');
export const provisionerDropdown = $('#storage-class-provisioner');
export const selectInput = $('[data-test-id=dropdown-text-filter]');
export const createPoolDropdown = $('button[class=pf-c-dropdown__menu-item]');
export const poolModal = $('modal-content');
export const allowExpand = $('div[class=checkbox]');
export const poolDropdownButton = $('button[id=pool-dropdown-id]');

export const cancelButton = $('button[data-test-id=modal-cancel-action]');
export const createButton = $('button[data-test=confirm-action]');
export const finishButton = $('button[id=confirm-action]');
export const replicaDropdown = $('button[id=replica-dropdown]');
export const poolName = $('input[name=newPoolName]');
export const replicaSelect = $('button[data-test-id="2"]');
export const poolForm = $('label[for=pool-name]');
export const modalPresence = $('div[class=modal-content]');
export const poolStatusCheck = $('div[class=pf-c-empty-state__body]');
export const dropdownPoolName = $('div[class=pf-c-dropdown__menu-item-main]');
export const poolDescription = $('div[class=pf-c-dropdown__menu-item-description]');

export const goToStorageClassView = async () => {
  await sideNavView.clickNavLink(['Storage', 'Storage Classes']);
  await crudView.isLoaded();
};

export const selectItemFromDropdown = async (item: string) => {
  await click(provisionerDropdown);
  await selectInput.sendKeys(item);
  await click($(`a[id="${item}-link"]`));
};

export const prepareStorageClassForm = async (provisioner: string) => {
  await goToStorageClassView();
  await click(crudView.createYAMLButton);
  await browser.wait(
    until.textToBePresentInElement($('.co-m-pane__heading'), 'Create Storage Class'),
  );
  await browser.wait(until.and(crudView.untilNoLoadersPresent));
  await selectItemFromDropdown(provisioner);
  await browser.sleep(2 * SECOND);
};

export const showProvisioner = async (provisioner: string) => {
  await selectItemFromDropdown(provisioner);
  await browser.sleep(2 * SECOND);
};

export const openPoolDropdown = async () => {
  await click(poolDropdownButton);
  await browser.sleep(2 * SECOND);
};

export const createPool = async () => {
  await sendKeys(poolName, poolData.metadata.name);
  await click(replicaDropdown);
  await click(replicaSelect);
  await click(createButton);
};
