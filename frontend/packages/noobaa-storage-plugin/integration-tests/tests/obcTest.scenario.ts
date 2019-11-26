import { execSync } from 'child_process';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { CreateOBCHandler } from '../views/obcPage.view';
import { deployment, testDeployment } from '../mocks/deploymentData';
import { BOUND, OBC_NAME } from '../utils/consts';

describe('Test Object Bucket Claim resource', () => {
  let obcHandler;

  beforeAll(async () => {
    obcHandler = new CreateOBCHandler(OBC_NAME, testName);
    await obcHandler.createBucketClaim();
    // Set namespace here and keep the deployment JSON NS agnostic
    execSync(`echo '${JSON.stringify(deployment)}' | kubectl create -n ${testName} -f -`);
  });

  it('Test if Object Bucket Claim is created sucessfully', async () => {
    const { name, status } = await obcHandler.getNameAndState();
    expect(name).toEqual(OBC_NAME);
    expect(status).toEqual(BOUND);
  });

  it('Test if secret data is available', async () => {
    const secretElement = await obcHandler.verifySecretDataIsAvailable();
    expect(secretElement).toBeDefined();
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
