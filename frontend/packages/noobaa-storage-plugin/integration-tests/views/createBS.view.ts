import { $, by, element, ExpectedConditions as until, browser } from 'protractor';
import * as sideNavView from '@console/internal-integration-tests/views/sidenav.view';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import { SECOND } from '@console/ceph-storage-plugin/integration-tests/utils/consts';
import { getOperatorHubCardIndex, click } from '@console/shared/src/test-utils/utils';
import { refreshIfNotVisible } from '@console/ceph-storage-plugin/integration-tests/utils/helpers';
import { currentSelectors } from '@console/ceph-storage-plugin/integration-tests/views/installFlow.view';

const ENDPOINT = 'http://test-endpoint.com';
const ACC_KEY = 'my_dummy_test_key';
const SEC_KEY = 'my_dummy_sec_key';
const TARGET = 'my_dummy_target';

export const operatorsPage = async () => {
  await sideNavView.clickNavLink(['Operators', 'Installed Operators']);
};

export const getOperatorHubAPILink = async (name: string) => {
  try {
    await browser.wait(until.visibilityOf(currentSelectors.createLink), 10 * SECOND);
  } catch {
    await refreshIfNotVisible(currentSelectors.createLink, 5);
  }
  const index = await getOperatorHubCardIndex(name);
  return $(`article:nth-child(${index + 1}) a`);
};

export const ocsOperator = $('a[data-test-operator-row="OpenShift Container Storage"]');

// Provider dropdown (AWS S3 is default)
export const providerDropdown = element(by.partialButtonText('AWS S3'));

// Bs page
const backingStoreNameInput = $('input[aria-label="Backing Store Name"]');

// AwS S3
export const regionDropdown = $('form > div:nth-child(3) > div > div > button');
export const usEast1 = element(by.partialButtonText('us-east-1'));
export const endpointInput = $('input[aria-label="Endpoint Address"]');

export const switchToCreds = element(by.partialButtonText('Switch to Credentials'));
export const accessKeyField = $('input[aria-label="Access Key Field"]');
export const secretKeyField = $('input[aria-label="Secret Key Field"]');
export const targetBucket = $('input[aria-label="Target Bucket"]');

export const targetContainer = $('input[aria-label="Target Blob Container"]');

// PVC
export const storageClassDropdown = $('#sc-dropdown');
export const rbd = $('#ceph-rbd-link');

export const createBtn = element(by.partialButtonText('Create Backing Store'));

export enum Providers {
  AWS = 'AWS S3',
  AZURE = 'Azure Blob',
  S3 = 'S3 Compatible',
  PVC = 'PVC',
}

const inputCustomSecret = async () => {
  await click(switchToCreds);
  await browser.wait(until.visibilityOf(accessKeyField));
  await accessKeyField.sendKeys(ACC_KEY);
  await secretKeyField.sendKeys(SEC_KEY);
};

export const providerDropdownItem = (provider: Providers) =>
  element(by.partialButtonText(provider));

const setupS3Type = async () => {
  await endpointInput.sendKeys(ENDPOINT);
  await inputCustomSecret();
};

export const setupAWS = async () => {
  await browser.wait(until.visibilityOf(regionDropdown));
  await click(regionDropdown);
  await browser.wait(until.visibilityOf(usEast1));
  await click(usEast1);
  await inputCustomSecret();
  await targetBucket.sendKeys(TARGET);
};

export const setupAzure = async () => {
  await click(providerDropdown);
  await click(providerDropdownItem(Providers.AZURE));
  await inputCustomSecret();
  await targetContainer.sendKeys(TARGET);
};

export const setupS3 = async () => {
  await click(providerDropdown);
  await providerDropdownItem(Providers.S3).click();
  await setupS3Type();
  await targetBucket.sendKeys(TARGET);
};

export const setupPVC = async () => {
  await providerDropdown.click();
  await providerDropdownItem(Providers.PVC).click();
};

export class BackingStoreHandler {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  async createStore(provider: Providers) {
    // Assumes we are in the page
    await browser.wait(until.visibilityOf(backingStoreNameInput));
    await backingStoreNameInput.sendKeys(this.name);
    await this.setupProvider(provider);
    await click(createBtn);
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
    await browser.wait(until.visibilityOf(crudView.resourceTitle));
    const name = await crudView.resourceTitle.getText();
    return { name };
  }

  async setupProvider(provider: Providers) {
    switch (provider) {
      case Providers.AWS:
        await setupAWS();
        break;
      case Providers.AZURE:
        await setupAzure();
        break;
      case Providers.S3:
        await setupS3();
        break;
      case Providers.PVC:
        await setupPVC();
        break;
      default:
        break;
    }
    // let it go to resource page
    await browser.sleep(1 * SECOND);
  }
}
