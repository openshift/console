import { browser, ExpectedConditions as until } from 'protractor';
import { appHost } from '@console/internal-integration-tests/protractor.conf';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import {
  createNewObjectBucketClaim,
  deleteObjectBucketClaim,
  goToObjectBucketClaims,
  obcStatus,
} from '../../views/obc.view';
import { CLAIM_STATUS, DEFAULT_BUCKET_CLASS, NS, STORAGE_CLASS_PATTERNS } from '../../utils/consts';

describe('Test OBC creation with options.', () => {
  beforeAll(async () => {
    await browser.get(`${appHost}/`);
  });

  it('Test OBC creation with default storage class and bucket class', async () => {
    const testObc = {
      name: 'obc-default-values',
      namespace: NS,
      storageClass: STORAGE_CLASS_PATTERNS.NOOBAA_FULL_NAME,
      bucketClass: DEFAULT_BUCKET_CLASS,
    };
    await createNewObjectBucketClaim(testObc, true);
    browser.wait(until.visibilityOf(obcStatus));
    expect(obcStatus.getText()).toEqual(CLAIM_STATUS.BOUND);
    await goToObjectBucketClaims();
    await crudView.resourceRowsPresent();
    await deleteObjectBucketClaim(testObc.name, NS);
  });
});
