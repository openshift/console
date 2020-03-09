import { execSync } from 'child_process';
import { protractor, by, browser, ExpectedConditions as until } from 'protractor';
import {
  appHost,
  checkLogs,
  checkErrors,
  testName,
  retry,
} from '../../../../integration-tests/protractor.conf';
import {
  installServerlessOperator,
  firstKebabMenu,
  machineSetsInput,
  submitCount,
  servicesValidation,
  revisionsValidation,
  routesValidation,
  machineCount,
  knativeServingNS,
  pageSidebar,
} from '../views/serverless.view';
import { switchPerspective, Perspective, sideHeader } from '../views/dev-perspective.view';
import * as sidenavView from '../../../../integration-tests/views/sidenav.view';
import * as crudView from '../../../../integration-tests/views/crud.view';
import * as catalogView from '../../../../integration-tests/views/catalog.view';
import * as catalogPageView from '../../../../integration-tests/views/catalog-page.view';
import * as operatorView from '../../../operator-lifecycle-manager/integration-tests/views/operator.view';
import * as operatorHubView from '../../../operator-lifecycle-manager/integration-tests/views/operator-hub.view';

const JASMINE_DEFAULT_TIMEOUT_INTERVAL = jasmine.DEFAULT_TIMEOUT_INTERVAL;
const JASMINE_EXTENDED_TIMEOUT_INTERVAL = 3000 * 60 * 5;

describe('Serverless', async () => {
  beforeAll(async () => {
    await browser.get(`${appHost}/k8s/cluster/projects`);
    await switchPerspective(Perspective.Administrator);
    expect(sideHeader.getText()).toContain('Administrator');

    // Extend the default jasmine timeout interval just in case it takes a while for the htpasswd idp to be ready
    jasmine.DEFAULT_TIMEOUT_INTERVAL = JASMINE_EXTENDED_TIMEOUT_INTERVAL;
  });

  afterAll(() => {
    // Set jasmine timeout interval back to the original value after these tests are done
    jasmine.DEFAULT_TIMEOUT_INTERVAL = JASMINE_DEFAULT_TIMEOUT_INTERVAL;
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  it('displays subscription creation form for serverless Operator', async () => {
    await crudView.isLoaded();
    await browser.wait(until.presenceOf(sidenavView.navSectionFor('Operators')));
    await sidenavView.clickNavLink(['Operators', 'OperatorHub']);
    await crudView.isLoaded();
    await catalogView.categoryTabsPresent();
    await catalogView.categoryTabs.get(0).click();
    await catalogPageView.catalogTileFor('OpenShift Serverless Operator').click();
    await browser.wait(until.visibilityOf(installServerlessOperator));
    await installServerlessOperator.element(by.linkText('Install')).click();
    await operatorHubView.createSubscriptionFormLoaded();
    expect(operatorHubView.createSubscriptionFormName.getText()).toEqual(
      'OpenShift Serverless Operator',
    );
    await browser.wait(until.visibilityOf(operatorHubView.createSubscriptionFormInstallMode));
    await operatorHubView.allNamespacesInstallMode.click();

    expect(operatorHubView.createSubscriptionError.isPresent()).toBe(false);
    expect(operatorHubView.createSubscriptionFormBtn.getAttribute('disabled')).toEqual(null);
    await operatorHubView.createSubscriptionFormBtn.click();
    await crudView.isLoaded();
    await browser.get(`${appHost}/operatorhub/ns/${testName}`);
    await crudView.isLoaded();
    await catalogPageView.clickFilterCheckbox('installState-installed');
    expect(catalogPageView.catalogTileFor('OpenShift Serverless Operator').isDisplayed()).toBe(
      true,
    );
  });

  it(`displays Operator in "Cluster Service Versions" view for "${testName}" namespace`, async () => {
    await retry(() => catalogPageView.catalogTileFor('OpenShift Serverless Operator').click());
    await browser
      .wait(until.presenceOf(installServerlessOperator), 15000)
      .then(() => browser.sleep(500));
    await operatorHubView.viewInstalledOperator();
    await crudView.isLoaded();
    await browser.wait(
      until.visibilityOf(operatorView.rowForOperator('OpenShift Serverless Operator')),
    );
    expect(operatorView.rowForOperator('OpenShift Serverless Operator').isDisplayed()).toBe(true);
  });

  it(`create knative-serving namespace and apply serving.yaml`, async () => {
    await execSync(`oc new-project knative-serving`);
    await execSync(
      `oc apply -f ./packages/dev-console/integration-tests/views/serverless-service.yaml`,
    );
    await browser.get(`${appHost}/k8s/cluster/projects/`);
    await crudView.isLoaded();
    await browser.wait(until.elementToBeClickable(knativeServingNS));
    expect(knativeServingNS.isDisplayed()).toBe(true);
  });

  it('Increase the Machine sets count', async () => {
    await switchPerspective(Perspective.Administrator);
    expect(sideHeader.getText()).toContain('Administrator');
    await browser.wait(until.presenceOf(sidenavView.navSectionFor('Compute')));
    await sidenavView.clickNavLink(['Compute', 'Machine Sets']);
    await crudView.isLoaded();

    await browser.wait(until.elementToBeClickable(firstKebabMenu));
    await firstKebabMenu.click();
    await browser.wait(until.elementToBeClickable(crudView.actionForLabel('Edit Count')));
    await crudView.actionForLabel('Edit Count').click();

    await browser.wait(until.elementToBeClickable(machineSetsInput));
    await machineSetsInput.sendKeys(protractor.Key.chord(protractor.Key.CONTROL, 'a'));
    await machineSetsInput.clear().sendKeys('6');
    await browser.wait(until.elementToBeClickable(submitCount));
    await submitCount.click();
    await browser.wait(until.visibilityOf(machineCount));
    expect(machineCount.isDisplayed()).toBe(true);
  });

  it('Serverless is installed', async () => {
    await crudView.isLoaded();
    await switchPerspective(Perspective.Developer);
    expect(sideHeader.getText()).toContain('Developer');
    await switchPerspective(Perspective.Administrator);
    expect(sideHeader.getText()).toContain('Administrator');
    await browser.wait(until.visibilityOf(pageSidebar));
    await browser.wait(until.presenceOf(sidenavView.navSectionFor('Serverless')));
    await sidenavView.clickNavLink(['Serverless', 'Services']);
    await browser.wait(until.visibilityOf(servicesValidation));
    expect(servicesValidation.isDisplayed()).toBe(true);
    await crudView.isLoaded();
    await browser.wait(until.presenceOf(sidenavView.navSectionFor('Serverless')));
    await sidenavView.clickNavLink(['Serverless', 'Revisions']);
    await browser.wait(until.visibilityOf(revisionsValidation));
    expect(revisionsValidation.isDisplayed()).toBe(true);
    await crudView.isLoaded();
    await browser.wait(until.presenceOf(sidenavView.navSectionFor('Serverless')));
    await sidenavView.clickNavLink(['Serverless', 'Routes']);
    await browser.wait(until.visibilityOf(routesValidation));
    expect(routesValidation.isDisplayed()).toBe(true);
  });
});
