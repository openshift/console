import { execSync } from 'child_process';
import { browser, ExpectedConditions as until, by, element } from 'protractor';
import {
  appHost,
  checkLogs,
  checkErrors,
  testName,
  retry,
} from '../../../../integration-tests/protractor.conf';
import { switchPerspective, Perspective, sideHeader } from '../views/dev-perspective.view';
import {
  pipelinecheckStatus,
  pageSidebar,
  pipelinePage,
  pipelineScriptRunner,
  createPipelineYamlError,
  pipelineOverviewName,
  pipelineTable,
  pipelineTableBody,
} from '../views/pipeline.view';
import * as sidenavView from '../../../../integration-tests/views/sidenav.view';
import * as crudView from '../../../../integration-tests/views/crud.view';
import * as catalogView from '../../../../integration-tests/views/catalog.view';
import * as catalogPageView from '../../../../integration-tests/views/catalog-page.view';
import * as operatorView from '../../../operator-lifecycle-manager/integration-tests/views/operator.view';
import * as operatorHubView from '../../../operator-lifecycle-manager/integration-tests/views/operator-hub.view';

const JASMINE_DEFAULT_TIMEOUT_INTERVAL = jasmine.DEFAULT_TIMEOUT_INTERVAL;
const JASMINE_EXTENDED_TIMEOUT_INTERVAL = 1000 * 60 * 3;

describe('Pipeline', async () => {
  beforeAll(async () => {
    await browser.get(`${appHost}/k8s/cluster/projects`);
    await browser.wait(until.presenceOf(sidenavView.navSectionFor('Operators')));
    await sidenavView.clickNavLink(['Operators', 'OperatorHub']);
    await crudView.isLoaded();

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

  it('displays subscription creation form for selected Operator', async () => {
    await switchPerspective(Perspective.Administrator);
    await catalogView.categoryTabsPresent();
    await catalogView.categoryTabs.get(0).click();
    await catalogPageView.catalogTileFor('Pipelines Operator').click();
    await browser.wait(until.visibilityOf(operatorHubView.operatorModal));
    await browser.wait(until.presenceOf(element(by.id('confirm-action'))));
    await element(by.id('confirm-action')).click();
    await browser.wait(until.presenceOf(operatorHubView.operatorModalInstallBtn));
    await operatorHubView.operatorModalInstallBtn.click();
    await operatorHubView.createSubscriptionFormLoaded();

    expect(operatorHubView.createSubscriptionFormName.getText()).toEqual(
      'OpenShift Pipelines Operator',
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

    expect(catalogPageView.catalogTileFor('OpenShift Pipelines Operator').isDisplayed()).toBe(true);
  });

  it(`displays Operator in "Cluster Service Versions" view for "${testName}" namespace`, async () => {
    await retry(() => catalogPageView.catalogTileFor('OpenShift Pipelines Operator').click());
    await operatorHubView.operatorModalIsLoaded();
    await element(by.id('confirm-action')).click();
    await operatorHubView.viewInstalledOperator();
    await crudView.isLoaded();

    await browser.wait(
      until.visibilityOf(operatorView.rowForOperator('OpenShift Pipelines Operator')),
    );
    expect(operatorView.rowForOperator('OpenShift Pipelines Operator').isDisplayed()).toBe(true);
  });

  it('pipeline is installed', async () => {
    await switchPerspective(Perspective.Developer);
    expect(sideHeader.getText()).toContain('Developer');
    await browser.wait(until.visibilityOf(pageSidebar));
    expect(pageSidebar.getText()).toContain('Pipelines');
  });

  it('pipeline tab scenario', async () => {
    await switchPerspective(Perspective.Developer);
    expect(sideHeader.getText()).toContain('Developer');
    await browser.wait(until.visibilityOf(pageSidebar));
    expect(pageSidebar.getText()).toContain('Pipelines');
    await pipelinecheckStatus();
    expect(pipelinePage.getText()).toContain('Pipelines');
    await pipelineScriptRunner();
    expect(createPipelineYamlError.isPresent()).toBe(false);
    await browser.wait(until.elementToBeClickable(pipelineOverviewName));
    await browser.wait(until.textToBePresentInElement(pipelineOverviewName, 'new-pipeline'));
    await execSync(
      `oc create -f ./packages/dev-console/integration-tests/views/simple-pipeline-demo.yaml -n ${testName}`,
    );
    await pipelinecheckStatus();
    await browser.wait(until.visibilityOf(pipelineTable));
    expect(pipelineTableBody.element(by.css('[data-test-id="simple-pipeline"]')).isPresent()).toBe(
      true,
    );
    expect(pipelineTableBody.element(by.css('[data-test-id="new-pipeline"]')).isPresent()).toBe(
      true,
    );
  });
});
