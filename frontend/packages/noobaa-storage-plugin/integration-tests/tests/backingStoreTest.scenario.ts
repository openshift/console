import { execSync } from 'child_process';
import { $, ExpectedConditions as until, browser } from 'protractor';
import * as crudView from '@console/internal-integration-tests/views/crud.view';
import { appHost, testName } from '@console/internal-integration-tests/protractor.conf';
import { click } from '@console/shared/src/test-utils/utils';
import {
  operatorsPage,
  ocsOperator,
  BackingStoreHandler,
  Providers,
  getOperatorHubAPILink,
} from '../views/createBS.view';

const NAME_BS = `${testName}-bs`;
const NS = 'openshift-storage';

const bsHandler = new BackingStoreHandler(NAME_BS);

describe('Tests creation of Backing Store', () => {
  beforeAll(async () => {
    await browser.get(`${appHost}/ns/${NS}`);
  });

  beforeEach(async () => {
    await operatorsPage();
    await click(ocsOperator);
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
    const bsLink = await getOperatorHubAPILink('Backing Store');
    await click(bsLink);
    await browser.wait(until.and(crudView.untilNoLoadersPresent));
  });

  afterEach(async () => {
    await crudView.clickDetailsPageAction('Delete Backing Store');
    await browser.wait(until.presenceOf($('#confirm-action')));
    await $('#confirm-action').click();
    await browser.wait(until.invisibilityOf($('.co-overlay')));
  });

  it('Tests creation of AWS S3 backing store', async () => {
    const { name } = await bsHandler.createStore(Providers.AWS);
    expect(name).toEqual(NAME_BS);
    execSync(`kubectl delete secrets ${NAME_BS}-secret -n openshift-storage`);
  });

  it('Tests creation of Azure backing store', async () => {
    const { name } = await bsHandler.createStore(Providers.AZURE);
    expect(name).toEqual(NAME_BS);
    execSync(`kubectl delete secrets ${NAME_BS}-secret -n openshift-storage`);
  });

  it('Tests creation of S3 Endpoint Type', async () => {
    const { name } = await bsHandler.createStore(Providers.S3);
    expect(name).toEqual(NAME_BS);
    execSync(`kubectl delete secrets ${NAME_BS}-secret -n openshift-storage`);
  });

  it('Tests creation of PVC Endpoint Type', async () => {
    const { name } = await bsHandler.createStore(Providers.PVC);
    expect(name).toEqual(NAME_BS);
  });
});
