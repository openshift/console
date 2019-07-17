import { browser, ExpectedConditions as until, Key, by } from 'protractor';

import { appHost, testName, checkLogs, checkErrors } from '../../protractor.conf';
import * as crudView from '../../views/crud.view';
import * as secretsView from '../../views/secrets.view';

const BROWSER_TIMEOUT = 15000;
const WORKLOAD_NAME = `filter-${testName}`;
// const WORKLOAD_LABEL = `lbl-filter=${testName}`;

describe('details what are you doing', () => {
  const secretName = 'test-secret';

/* before everythying what will be executed */
  beforeAll(async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/deployments`);
    await crudView.isLoaded();
    // Wait until the resource is created and the details page loads before continuing.
  });

/* before each it block what will be executed */
  beforeEach(async() => secretsView.visitSecretDetailsPage(appHost, testName, secretName));

/* after each it block what will be executed */
  afterEach(() => {
    checkLogs();
    checkErrors();
  });

/* after everythying what will be executed */
  afterAll(async() => {
    await browser.get(`${appHost}/k8s/ns/${testName}/deployments`);
    await crudView.isLoaded();
  });

  it('Task details', async() => {
    /* tasks to be accomplish like opening menu and selecting options etc. has to be executed over here*/
    /* functions and elements from respective view file be used to accomplish the tasks*/

    await browser.get(`${appHost}/k8s/ns/${testName}/deployments/${WORKLOAD_NAME}/pods`);
    
    // await browser.wait(until.elementToBeClickable(crudView.name), BROWSER_TIMEOUT);
    await crudView.rowForName(name).element(by.linkText(name)).click();

    //send keys function is method for sending one or more keystrokes to the active window
    await crudView.nameFilter.sendKeys(WORKLOAD_NAME);

    await browser.wait(until.elementToBeClickable(crudView.resourceRowNamesAndNs.first()), BROWSER_TIMEOUT);
    await browser.wait(until.urlContains(`/${name}`));

    //expectations for each scenario should be there
    expect(crudView.resourceRowNamesAndNs.first().getText()).toContain(WORKLOAD_NAME);
    expect(crudView.messageLbl.isPresent()).toBe(true);
  });

});
