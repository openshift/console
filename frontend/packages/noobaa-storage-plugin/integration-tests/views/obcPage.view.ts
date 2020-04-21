import * as sideNavView from '@console/internal-integration-tests/views/sidenav.view';
import { execSync } from 'child_process';
import { $, by, browser, element, ExpectedConditions as until } from 'protractor';
import {
  clickKebabAction,
  deleteResource,
  resourceRowsPresent,
  untilNoLoadersPresent,
} from '@console/internal-integration-tests/views/crud.view';
import { click } from '@console/shared/src/test-utils/utils';
import { selectItemFromDropdown } from '@console/ceph-storage-plugin/integration-tests/views/pvc.view';
import { SECOND } from '@console/ceph-storage-plugin/integration-tests/utils/consts';
import { BOUND, ATTACH_TO_DEPLOYMENT, OBC_RESOURCE_PATH } from '../utils/consts';

export const goToOBCPage = async () => {
  await sideNavView.clickNavLink(['Storage', 'Object Bucket Claims']);
};

export const goToOBPage = async () => {
  await sideNavView.clickNavLink(['Storage', 'Object Buckets']);
};

const createOBC = element(by.buttonText('Create Object Bucket Claim'));

const obcNameInput = $('#obc-name');
// doesn't work in OCP 4.3
// const scDropdown = $('#sc-dropdown');
const scDropdown = $('div.co-storage-class-dropdown div button');
// const bcDropdown = $('#bc-dropdown');
const bcDropdown = $('div.nb-create-obc__bc-dropdown div button');
// const defaultBC = $('a#noobaa-default-bucket-class-link');
const createBtn = element(by.buttonText('Create'));

// Resource Page
const resourceName = $('.co-resource-item__resource-name');
const resourceStatus = $('.co-resource-item__resource-status');
const showValues = element(by.partialButtonText('Reveal Values'));
const hideValues = element(by.partialButtonText('Hide Values'));
const endpoint = element(by.xpath('//dt[text()="Endpoint"]/following-sibling::dd/div/pre'));
const accessKey = element(by.xpath('//dt[text()="Access Key"]/following-sibling::dd/div/pre'));
const secretKey = element(by.xpath('//dt[text()="Secret Key"]/following-sibling::dd/div/pre'));
export const obcName = element(by.xpath('//dl/dt[text()="Name"]/following-sibling::dd'));
const obcNamespace = element(by.xpath('//dl/dt[text()="Namespace"]/following-sibling::dd/span/a'));
const obcLabels = element(by.xpath('//dl/dt[text()="Labels"]/following-sibling::dd'));
const obcAnnotations = element(by.xpath('//dl/dt[text()="Annotations"]/following-sibling::dd'));
const obcCreationDate = element(by.xpath('//dt[text()="Created At"]/following-sibling::dd'));
const obcOwner = element(by.xpath('//dt[text()="Owner"]/following-sibling::dd'));
const obcSecret = element(by.xpath('//dt[text()="Secret"]/following-sibling::dd/span/a'));
const obcStatus = element(by.xpath('//dt[text()="Status"]/following-sibling::dd'));
const obcStorageClass = element(
  by.xpath('//dt[text()="Storage Class"]/following-sibling::dd/span/a'),
);
export const obcObjectBucket = element(
  by.xpath('//dt[text()="Object Bucket"]/following-sibling::dd/span/a'),
);

// Deployment Modal
const modal = $('.ReactModal__Content');
const deploymentDropdown = $('#dropdown-selectbox');
const attachBtn = element(by.buttonText('Attach'));

export const isDeploymentReady = (deploymentName: string, namespace: string) => {
  return async () => {
    const deploymentInfo = JSON.parse(
      execSync(`kubectl get deployment ${deploymentName} -o json -n ${namespace}`).toString(),
    );
    const allReplicas = deploymentInfo.status.replicas;
    const { readyReplicas } = deploymentInfo.status;
    return allReplicas === readyReplicas;
  };
};

export const isClaimBound = () => {
  return async () => {
    await browser.wait(until.visibilityOf(obcStatus));
    const currentStatus = await obcStatus.getText();
    return currentStatus === BOUND;
  };
};

export class CreateOBCHandler {
  name: string;

  namespace: string;

  storageclass: string;

  bucketclass: string;

  constructor(name: string, namespace: string, storageclass: string, bucketclass: string) {
    this.name = name;
    this.namespace = namespace;
    this.storageclass = storageclass;
    this.bucketclass = bucketclass;
  }

  async waitForElement(elem: any) {
    await browser.wait(until.visibilityOf(elem));
  }

  async createBucketClaim() {
    await goToOBCPage();
    await this.waitForElement(createOBC);
    await click(createOBC);
    await this.waitForElement(scDropdown);
    await obcNameInput.sendKeys(this.name);
    await selectItemFromDropdown(this.storageclass, scDropdown);
    if (this.bucketclass) {
      await this.waitForElement(bcDropdown);
      await click(bcDropdown);
      await click(this.bucketclass);
    }
    await click(createBtn);
  }

  async getNameAndState() {
    await browser.wait(until.visibilityOf(resourceName));
    await browser.wait(until.visibilityOf(resourceStatus));
    const name = await resourceName.getText();
    const status = await resourceStatus.getText();
    return { name, status };
  }

  async waitUntilBound() {
    await browser.wait(isClaimBound(), 60 * SECOND, 'Claim should get bound within 60 seconds');
  }

  async verifySecretDataIsAvailable() {
    await browser.wait(until.presenceOf(showValues));
    return showValues;
  }

  async revealHiddenValues() {
    await click(showValues);
  }

  async hideValues() {
    await click(hideValues);
  }

  async getSecretData() {
    await browser.wait(until.presenceOf(endpoint));
    await browser.wait(until.presenceOf(accessKey));
    await browser.wait(until.presenceOf(secretKey));
    return { endpoint, accessKey, secretKey };
  }

  async getLabelsAndAnnotations() {
    await browser.wait(until.presenceOf(obcLabels));
    const labels = await obcLabels.getText();
    await browser.wait(until.presenceOf(obcAnnotations));
    const annotations = await obcAnnotations.getText();
    return { labels, annotations };
  }

  async getNamespaceAndSecret() {
    await browser.wait(until.presenceOf(obcNamespace));
    await browser.wait(until.presenceOf(obcSecret));
    return { obcNamespace, obcSecret };
  }

  async getStatusAndStorageClass() {
    await browser.wait(until.presenceOf(obcStatus));
    await browser.wait(until.presenceOf(obcStorageClass));
    return { obcStatus, obcStorageClass };
  }

  async getOwnerAndDate() {
    await browser.wait(until.presenceOf(obcOwner));
    await browser.wait(until.presenceOf(obcCreationDate));
    return { obcOwner, obcCreationDate };
  }

  async verifyOBPage(obName: string) {
    const link = element(by.partialLinkText(obName));
    click(link);
    await browser.wait(until.and(untilNoLoadersPresent));
    return this.getNameAndState();
  }

  async attachToDeployment(deploymentName: string) {
    await goToOBCPage();
    await resourceRowsPresent();
    await clickKebabAction(this.name, ATTACH_TO_DEPLOYMENT);
    await browser.wait(until.visibilityOf(modal));
    await browser.wait(until.and(untilNoLoadersPresent));
    await browser.wait(until.visibilityOf(deploymentDropdown));
    await click(deploymentDropdown);
    const deployment = await element(by.partialButtonText(deploymentName));
    await click(deployment);
    await click(attachBtn);
    await browser.wait(
      isDeploymentReady(deploymentName, this.namespace),
      120 * SECOND,
      'All pods of the deployment should be in Running state within 2 minutes',
    );
    await browser.wait(until.visibilityOf(resourceName));
    const resName = await resourceName.getText();
    return resName;
  }

  async deleteBucketClaim() {
    await deleteResource(OBC_RESOURCE_PATH, OBC_RESOURCE_PATH, this.name);
  }
}
