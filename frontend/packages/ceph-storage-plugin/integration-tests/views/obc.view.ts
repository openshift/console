import { $, browser, ExpectedConditions as until } from 'protractor';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import * as sideNavView from '@console/internal-integration-tests/views/sidenav.view';
import { click } from '@console/shared/src/test-utils/utils';
import { CLAIM_STATUS } from '../utils/consts';
import { namespaceDropdown, ObcType, selectItemFromDropdown } from '../utils/helpers';

// create obc
export const inputOBCName = $('#obc-name');
export const storageClassDropdown = $('div.co-storage-class-dropdown div button');
export const bucketClassDropdown = $('div.nb-create-obc__bc-dropdown div button');
export const createButton = $('[type=submit]');

// obc details
export const obcSecret = $('[data-test-id=obc-secret]');
export const obcStatus = $('[data-test-id=obc-status]');
export const obcObjectBucket = $('[data-test-id=object-bucket]');
export const actionsButton = $('[data-test-id=actions-menu-button]');
export const deleteObc = $('[data-test-action="Delete Object Bucket Claim"]');

export const goToObjectBucketClaims = async () => {
  await sideNavView.clickNavLink(['Storage', 'Object Bucket Claims']);
  await crudView.isLoaded();
};

export const createNewObjectBucketClaim = async (obc: ObcType, waitForBinding: boolean) => {
  await goToObjectBucketClaims();
  await selectItemFromDropdown(obc.namespace, namespaceDropdown);
  await click(crudView.createYAMLButton);
  await browser.wait(
    until.textToBePresentInElement($('.co-m-pane__heading'), 'Create Object Bucket Claim'),
  );
  await browser.wait(until.and(crudView.untilNoLoadersPresent));
  await inputOBCName.sendKeys(obc.name);
  await selectItemFromDropdown(obc.storageClass, storageClassDropdown);
  await selectItemFromDropdown(obc.bucketClass, bucketClassDropdown);
  await click(createButton);
  if (waitForBinding === true)
    await browser.wait(until.textToBePresentInElement(obcStatus, CLAIM_STATUS.BOUND));
};

export const deleteObjectBucketClaim = async (name: string, namespace: string) => {
  await goToObjectBucketClaims();
  await selectItemFromDropdown(namespace, namespaceDropdown);
  await crudView.resourceRowsPresent();
  await crudView.filterForName(name);
  await crudView.isLoaded();
  await crudView.deleteRow('ObjectBucketClaim')(name);
};
