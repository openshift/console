import { execSync } from 'child_process';
import { $, browser, ExpectedConditions as until } from 'protractor';
import { goToInstalledOperators } from '@console/ceph-storage-plugin/integration-tests/views/add-capacity.view';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import { BucketClassHandler, Tier } from '../views/createBC.view';
import { click } from '@console/shared/src/test-utils/utils';
import { appHost, testName } from '@console/internal-integration-tests/protractor.conf';
import { NS } from '@console/ceph-storage-plugin/integration-tests/utils/consts';
import { ocsOperator, getOperatorHubAPILink } from '../views/createBS.view';

const bcName = `${testName}-bucketclass`;
const description = `${testName}-bucketClass is a bucket class being used for testing purposes. Please do not use it for real storage purposes in case the test fails and the class is not deleted`;

const getBucketClassObject = () =>
  JSON.parse(execSync(`kubectl get bucketclass ${bcName} -n openshift-storage -o json`).toString());

describe('Tests creation of Bucket Class', () => {
  const bcHandler = new BucketClassHandler(bcName, description);
  beforeAll(async () => {
    await browser.get(`${appHost}/ns/${NS}`);
  });

  beforeEach(async () => {
    await goToInstalledOperators();
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
    await browser.wait(until.visibilityOf(ocsOperator));
    await ocsOperator.click();
    const bcLink = await getOperatorHubAPILink('Bucket Class');
    await click(bcLink);
  });

  afterEach(async () => {
    await crudView.clickDetailsPageAction('Delete Bucket Class');
    await browser.wait(until.presenceOf($('#confirm-action')));
    await $('#confirm-action').click();
    await browser.sleep(100);
  });

  it('Create a 1 Tier(Spread) Bucket Class', async () => {
    bcHandler.setTiers([Tier.SPREAD]);
    const bc = await bcHandler.createBC();
    expect(bc.name).toEqual(bcName);
    expect(bc.tier1Policy.toLocaleUpperCase()).toContain(Tier.SPREAD);
    const cliData = getBucketClassObject();
    expect(cliData?.metadata?.name).toEqual(bc.name);
  });

  it('Create a 1 Tier(Mirror) Bucket Class', async () => {
    bcHandler.setTiers([Tier.MIRROR]);
    const bc = await bcHandler.createBC();
    expect(bc.name).toEqual(bcName);
    expect(bc.tier1Policy.toLocaleUpperCase()).toContain(Tier.MIRROR);
    const cliData = getBucketClassObject();
    expect(cliData?.metadata?.name).toEqual(bc.name);
  });

  it('Create a 2 Tier(Spread, Spread) Bucket Class', async () => {
    bcHandler.setTiers([Tier.SPREAD, Tier.SPREAD]);
    const bc = await bcHandler.createBC();
    expect(bc.name).toEqual(bcName);
    expect(bc.tier1Policy.toLocaleUpperCase()).toContain(Tier.SPREAD);
    expect(bc.tier2Policy.toLocaleUpperCase()).toContain(Tier.SPREAD);
    const cliData = getBucketClassObject();
    expect(cliData?.metadata?.name).toEqual(bcName);
  });

  it('Create a 2 Tier(Spread, Mirror) Bucket Class', async () => {
    bcHandler.setTiers([Tier.SPREAD, Tier.MIRROR]);
    const bc = await bcHandler.createBC();
    expect(bc.name).toEqual(bcName);
    expect(bc.tier1Policy.toLocaleUpperCase()).toContain(Tier.SPREAD);
    expect(bc.tier2Policy.toLocaleUpperCase()).toContain(Tier.MIRROR);
    const cliData = getBucketClassObject();
    expect(cliData?.metadata?.name).toEqual(bcName);
  });

  it('Create a 2 Tier(Mirror, Mirror) Bucket Class', async () => {
    bcHandler.setTiers([Tier.MIRROR, Tier.MIRROR]);
    const bc = await bcHandler.createBC();
    expect(bc.name).toEqual(bcName);
    expect(bc.tier1Policy.toLocaleUpperCase()).toContain(Tier.MIRROR);
    expect(bc.tier2Policy.toLocaleUpperCase()).toContain(Tier.MIRROR);
    const cliData = getBucketClassObject();
    expect(cliData?.metadata?.name).toEqual(bcName);
  });
});
