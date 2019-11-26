import * as sideNavView from '@console/internal-integration-tests/views/sidenav.view';
import { $, by, browser, element, ExpectedConditions as until } from 'protractor';
import {
  clickKebabAction,
  deleteResource,
  resourceRowsPresent,
  untilNoLoadersPresent,
} from '@console/internal-integration-tests/views/crud.view';
import { click } from '@console/shared/src/test-utils/utils';
import { SECOND } from '@console/ceph-storage-plugin/integration-tests/utils/consts';
import { ATTACH_TO_DEPLOYMENT, OBC_RESOURCE_PATH } from '../utils/consts';

export const OBCPage = async () => {
  await sideNavView.clickNavLink(['Storage', 'Object Bucket Claims']);
};

export const gotoOBPage = async () => {
  await sideNavView.clickNavLink(['Storage', 'Object Buckets']);
};

const createOBC = element(by.buttonText('Create Object Bucket Claim'));

const obcNameInput = $('#obc-name');
const scDropdown = $('#sc-dropdown');
const bcDropdown = $('#bc-dropdown');
const obcSC = $('#openshift-storage\\.noobaa\\.io-link');
const defaultBC = $('a#noobaa-default-bucket-class-link');
const createBtn = element(by.buttonText('Create'));

// Resource Page
const resourceName = $('.co-resource-item__resource-name');
const resourceStatus = $('.co-resource-item__resource-status');
const showValues = element(by.partialButtonText('Reveal Values'));

// Deployment Modal
const modal = $('.ReactModal__Content');
const deploymentDropdown = $('#dropdown-selectbox');
const attachBtn = element(by.buttonText('Attach'));

export class CreateOBCHandler {
  name: string;

  namespace: string;

  constructor(name: string, namespace: string) {
    this.name = name;
    this.namespace = namespace;
  }

  async waitForElement(elem: any) {
    await browser.wait(until.visibilityOf(elem));
  }

  async createBucketClaim() {
    await OBCPage();
    await this.waitForElement(createOBC);
    await click(createOBC);
    await this.waitForElement(scDropdown);
    await obcNameInput.sendKeys(this.name);
    await click(scDropdown);
    await click(obcSC);
    await this.waitForElement(bcDropdown);
    await click(bcDropdown);
    await click(defaultBC);
    await click(createBtn);
  }

  async getNameAndState() {
    await browser.wait(until.visibilityOf(resourceName));
    await browser.wait(until.visibilityOf(resourceStatus));
    const name = await resourceName.getText();
    const status = await resourceStatus.getText();
    return { name, status };
  }

  async verifySecretDataIsAvailable() {
    await browser.wait(until.presenceOf(showValues));
    return showValues;
  }

  async verifyOBPage(obName: string) {
    const link = element(by.partialLinkText(obName));
    click(link);
    await browser.wait(until.and(untilNoLoadersPresent));
    return this.getNameAndState();
  }

  async attachToDeployment(deploymentName: string) {
    await OBCPage();
    await resourceRowsPresent();
    await clickKebabAction(this.name, ATTACH_TO_DEPLOYMENT);
    await browser.wait(until.visibilityOf(modal));
    await browser.wait(until.and(untilNoLoadersPresent));
    await browser.wait(until.visibilityOf(deploymentDropdown));
    await click(deploymentDropdown);
    const deployment = await element(by.partialButtonText(deploymentName));
    await click(deployment);
    await click(attachBtn);
    // Give a second to move to deployments page
    await browser.sleep(1 * SECOND);
    await browser.wait(until.visibilityOf(resourceName));
    const resName = await resourceName.getText();
    return resName;
  }

  async deleteBucketClaim() {
    await deleteResource(OBC_RESOURCE_PATH, OBC_RESOURCE_PATH, this.name);
  }
}
