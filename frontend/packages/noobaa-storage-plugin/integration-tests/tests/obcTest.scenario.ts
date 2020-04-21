import { execSync } from 'child_process';
import { browser, ExpectedConditions as until } from 'protractor';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { CreateOBCHandler } from '../views/obcPage.view';
import { deployment, testDeployment } from '../mocks/deploymentData';
import {
  ACCESS_KEY,
  BOUND,
  MASKED_VALUE,
  NOOBAA_LABEL,
  NO_ANNOTATIONS,
  OBC_NAME,
  OBC_STORAGE_CLASS,
  OBC_STORAGE_CLASS_EXACT,
  SECRET_KEY,
} from '../utils/consts';

describe('Test Object Bucket Claim resource', () => {
  let obcHandler;

  beforeAll(async () => {
    obcHandler = new CreateOBCHandler(OBC_NAME, testName, OBC_STORAGE_CLASS, '');
    await obcHandler.createBucketClaim();
    // Set namespace here and keep the deployment JSON NS agnostic
    execSync(`echo '${JSON.stringify(deployment)}' | kubectl create -n ${testName} -f -`);
  });

  it('Test if Object Bucket Claim is created sucessfully', async () => {
    const { name, status } = await obcHandler.getNameAndState();
    expect(name).toEqual(OBC_NAME);
    await obcHandler.waitUntilBound();
    expect(status).toEqual(BOUND);
  });

  it('Test if owner and creation date are shown correctly', async () => {
    const { obcOwner, obcCreationDate } = await obcHandler.getOwnerAndDate();
    expect(obcOwner.getText()).toEqual('No owner');
    await browser.wait(
      until.textToBePresentInElement(obcCreationDate, 'a few seconds ago'),
      60 * 1000,
      'A few seconds after creation the date should become `a few seconds ago`',
    );
  });

  it('Test if secret data is available', async () => {
    const secretElement = await obcHandler.verifySecretDataIsAvailable();
    expect(secretElement).toBeDefined();
  });

  it('Test if secret data is masked', async () => {
    const { endpoint, accessKey, secretKey } = await obcHandler.getSecretData();
    expect(endpoint.getText()).toEqual(MASKED_VALUE);
    expect(accessKey.getText()).toEqual(MASKED_VALUE);
    expect(secretKey.getText()).toEqual(MASKED_VALUE);
  });

  it('Test if secret data can be revealed', async () => {
    await obcHandler.revealHiddenValues();
    const { endpoint, accessKey, secretKey } = await obcHandler.getSecretData();
    expect(endpoint.getText()).toContain('openshift-storage');
    expect(accessKey.getText()).toMatch(ACCESS_KEY);
    expect(secretKey.getText()).toMatch(SECRET_KEY);
  });

  it('Test if secret data can be hidden again', async () => {
    await obcHandler.hideValues();
    const { endpoint, accessKey, secretKey } = await obcHandler.getSecretData();
    expect(endpoint.getText()).toEqual(MASKED_VALUE);
    expect(accessKey.getText()).toEqual(MASKED_VALUE);
    expect(secretKey.getText()).toEqual(MASKED_VALUE);
  });

  it('Test if labels and annotations are shown correctly', async () => {
    const { labels, annotations } = await obcHandler.getLabelsAndAnnotations();
    expect(labels).toContain(NOOBAA_LABEL);
    expect(annotations).toEqual(NO_ANNOTATIONS);
  });

  it('Test if namespace and secret are shown correctly', async () => {
    const { obcNamespace, obcSecret } = await obcHandler.getNamespaceAndSecret();
    expect(obcNamespace.getText()).toEqual(testName);
    expect(obcSecret.getText()).toEqual(OBC_NAME);
  });

  it('Test if status and storage class are shown correctly', async () => {
    const { obcStatus, obcStorageClass } = await obcHandler.getStatusAndStorageClass();
    expect(obcStatus.getText()).toEqual(BOUND);
    expect(obcStorageClass.getText()).toEqual(OBC_STORAGE_CLASS_EXACT);
  });

  it('Test if Object Bucket is created', async () => {
    const obName = `obc-${testName}-${OBC_NAME}`;
    const { name, status } = await obcHandler.verifyOBPage(obName);
    expect(name).toEqual(obName);
    expect(status).toEqual(BOUND);
  });

  it('Test attachment to a Deployment', async () => {
    const deploymentName = await obcHandler.attachToDeployment(testDeployment);
    expect(deploymentName).toEqual(testDeployment);
  });

  afterAll(async () => {
    await obcHandler.deleteBucketClaim();
    execSync(`echo '${JSON.stringify(deployment)}' | kubectl delete -n ${testName} -f -`);
  });
});
