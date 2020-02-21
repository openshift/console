import { $, browser, ExpectedConditions as until } from 'protractor';
import { execSync } from 'child_process';
import { goToOBCPage, CreateOBCHandler, goToOBPage } from '../../views/obcPage.view';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import { backingStore, bucketClass, storageClass, objectBucket } from '../../mocks/objectData';
import { click } from '@console/shared/src/test-utils/utils';
import {
  deleteResource,
  untilNoLoadersPresent,
} from '@console/internal-integration-tests/views/crud.view';
import { NS } from '@console/ceph-storage-plugin/integration-tests/utils/consts';
import { OB_RESOURCE_PATH } from '../../utils/consts';

describe('Test Object Bucket Claim CRUD', () => {
  beforeAll(async () => {
    execSync(`echo '${JSON.stringify(backingStore)}' | oc apply -f -`);
    execSync(`echo '${JSON.stringify(bucketClass)}' | oc apply -f -`);
    execSync(`echo '${JSON.stringify(storageClass)}' | oc apply -f -`);
  });

  afterAll(async () => {
    execSync(`echo '${JSON.stringify(backingStore)}' | oc delete -f -`);
    execSync(`echo '${JSON.stringify(bucketClass)}' | oc delete -f -`);
    execSync(`echo '${JSON.stringify(storageClass)}' | oc delete -f -`);
  });

  it('Test if Object Bucket Claim page is reachable', async () => {
    await goToOBCPage();
    const obcName = `${testName}obc`;
    // Change ns to input from a const
    const obcHandler = new CreateOBCHandler(obcName, NS);
    await obcHandler.createBucketClaim();
    const { name, status } = await obcHandler.getNameAndState();
    expect(name).toEqual(obcName);
    expect(status).toEqual('Pending');
    await obcHandler.deleteBucketClaim();
  });

  it('Read and Delete Tests for Object Buckets', async () => {
    execSync(`echo '${JSON.stringify(objectBucket)}' | oc apply -f -`);
    await goToOBPage();
    const bucketLink = $(`a[title=${objectBucket.metadata.name}]`);
    await click(bucketLink);
    await browser.wait(until.and(untilNoLoadersPresent));
    await deleteResource(OB_RESOURCE_PATH, OB_RESOURCE_PATH, objectBucket.metadata.name, false);
  });
});
