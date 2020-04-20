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
  pipelineTableBody,
  pipelineStartKebab,
  pipelineFilter,
  pipelineStart,
  pipelineRun,
  pipelineRerun,
  pipelineActionList,
  pipelineStartLastRun,
  pipelineSelect,
  pipelineRuns,
  pipelineRunLogs,
  samplePipelineElement,
  pipelineRunOverview,
  pipelines,
  pipelineRunLogList,
  pipelineRunStartLoaded,
  pipelineTableBodyElement,
  pipelineYaml,
  pipelineActions,
  pipelineTab,
  pipelineRunLogContainer,
} from '../views/pipeline.view';
import * as sidenavView from '../../../../integration-tests/views/sidenav.view';
import * as crudView from '../../../../integration-tests/views/crud.view';
import * as catalogView from '../../../../integration-tests/views/catalog.view';
import * as catalogPageView from '../../../../integration-tests/views/catalog-page.view';
import * as operatorView from '../../../operator-lifecycle-manager/integration-tests/views/operator.view';
import * as operatorHubView from '../../../operator-lifecycle-manager/integration-tests/views/operator-hub.view';

const JASMINE_DEFAULT_TIMEOUT_INTERVAL = jasmine.DEFAULT_TIMEOUT_INTERVAL;
const JASMINE_EXTENDED_TIMEOUT_INTERVAL = 1000 * 60 * 5;

describe('Pipeline', async () => {
  beforeAll(async () => {
    await switchPerspective(Perspective.Administrator);
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

  it('displays subscription creation form for pipeline Operator', async () => {
    await switchPerspective(Perspective.Administrator);
    await catalogView.categoryTabsPresent();
    await catalogView.categoryTabs.get(0).click();
    await catalogPageView.catalogTileFor('Pipelines Operator').click();
    await browser.wait(until.visibilityOf(operatorHubView.communityWarningModal));
    await browser.wait(until.presenceOf(element(by.id('confirm-action'))));
    await element(by.id('confirm-action')).click();
    await browser.wait(until.visibilityOf(operatorHubView.operatorModalBody));
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
    await operatorHubView.operatorInstallPageLoaded();
    await operatorHubView.viewInstalledOperatorsBtn.click();
    await crudView.isLoaded();
    await browser.get(`${appHost}/operatorhub/ns/${testName}`);
    await crudView.isLoaded();
    await catalogPageView.clickFilterCheckbox('installState-installed');

    expect(catalogPageView.catalogTileFor('OpenShift Pipelines Operator').isDisplayed()).toBe(true);
  });

  it(`displays Operator in "Cluster Service Versions" view for "${testName}" namespace`, async () => {
    await retry(() => catalogPageView.catalogTileFor('OpenShift Pipelines Operator').click());
    await browser.wait(until.visibilityOf(operatorHubView.communityWarningModal));
    await element(by.id('confirm-action')).click();
    await operatorHubView.viewInstalledOperator();
    await crudView.isLoaded();

    await browser.wait(
      until.visibilityOf(operatorView.rowForOperator('OpenShift Pipelines Operator')),
    );
    expect(operatorView.rowForOperator('OpenShift Pipelines Operator').isDisplayed()).toBe(true);
  });

  it('pipeline is installed', async () => {
    await browser.get(`${appHost}/k8s/cluster/projects/${testName}`);
    await switchPerspective(Perspective.Developer);
    expect(sideHeader.getText()).toContain('Developer');
    await browser.driver.navigate().refresh();
    await browser.wait(until.visibilityOf(pageSidebar));
    await browser.wait(until.visibilityOf(pipelineTab));
    expect(pageSidebar.getText()).toContain('Pipelines');
  });

  it('create pipeline through cli & UI', async () => {
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
    await browser.wait(until.visibilityOf(pipelineTableBodyElement(testName, 'simple-pipeline')));
    expect(element(by.css('[data-test-id="simple-pipeline"]')).isPresent()).toBe(true);
    await browser.wait(until.visibilityOf(pipelineTableBodyElement(testName, 'new-pipeline')));
    expect(element(by.css('[data-test-id="new-pipeline"]')).isPresent()).toBe(true);
  });

  it('run pipeline and generate pipeline logs scenario', async () => {
    await switchPerspective(Perspective.Developer);
    await browser.wait(until.visibilityOf(pageSidebar));
    await pipelinecheckStatus();
    await execSync(
      `oc create -f ./packages/dev-console/integration-tests/views/sample-app-pipeline.yaml -n ${testName}`,
    );
    await browser.wait(until.visibilityOf(samplePipelineElement));
    const samplePipelineText = await samplePipelineElement.getText();
    expect(samplePipelineText).toBe('sample-app-pipeline');
    expect(samplePipelineElement.isPresent()).toBe(true);
    await pipelineFilter.click();
    await pipelineFilter.sendKeys('sample-app-pipeline');
    await browser.wait(until.visibilityOf(samplePipelineElement));
    await browser.wait(until.elementToBeClickable(pipelineStartKebab));
    await pipelineStartKebab.click();
    await browser.wait(until.visibilityOf(pipelineActions), 5000);
    await browser.wait(until.visibilityOf(pipelineStart), 5000);
    await pipelineRunStartLoaded();
    await pipelineStart.click();
    await browser.wait(until.visibilityOf(pipelineRunOverview));
    const runName = await pipelineOverviewName.getText();
    await pipelinecheckStatus();
    await browser.wait(
      until.visibilityOf(pipelineTableBodyElement(testName, 'sample-app-pipeline')),
    );
    await samplePipelineElement.click();
    await browser.wait(until.visibilityOf(pipelineRun));
    await pipelineRun.click();
    await browser.wait(until.visibilityOf(pipelines(runName)));
    const pipelineRunName = await pipelines(runName).getText();
    expect(pipelineRunName).toBe(runName);
    await pipelineStartKebab.click();
    await browser.wait(until.visibilityOf(pipelineRerun));
    await pipelineRerun.click();
    await browser.wait(until.visibilityOf(pipelineActionList));
    await pipelineActionList.click();
    await pipelineStartLastRun.click();
    const tempUrlText = await pipelineOverviewName.getText();
    await browser.wait(until.urlContains(tempUrlText));
    await browser.wait(until.visibilityOf(pipelineYaml), 5000);
    await browser.wait(until.elementToBeClickable(pipelineYaml));
    await pipelineYaml.click();
    await browser.wait(until.visibilityOf(pipelineRuns), 5000);
    await browser.wait(until.elementToBeClickable(pipelineRuns)).then(() => pipelineRuns.click());
    await browser.wait(until.visibilityOf(pipelines(runName)));
    const pipelineRunNumber = await pipelineTableBody.getAttribute('childElementCount');
    expect(pipelineRunNumber).toBe('3');
    await pipelineSelect(runName).click();
    await pipelineRunLogs.click();
    await browser.wait(until.presenceOf(pipelineRunLogList));
    expect(pipelineRunLogContainer.isPresent()).toBe(true);
    expect(pipelineRunLogList.isPresent()).toBe(true);
    const sample = await pipelineRunLogList.getText();
    expect(sample.replace(/\s+/g, ' ')).toContain('install-deps');
  });
});
