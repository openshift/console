import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { addOptions, pageTitle, sideBarTabs, nodeActions } from '../../constants';
import { monitoringPO, topologyPO, addHealthChecksPO } from '../../pageObjects';
import {
  addPage,
  addHealthChecksPage,
  createGitWorkload,
  createHelmChartFromAddPage,
  monitoringPage,
  topologyPage,
  topologySidePane,
} from '../../pages';

Given(
  'workload {string} with resource type {string} is present in topology page',
  (workloadName: string, resourceType: string) => {
    createGitWorkload('https://github.com/sclorg/nodejs-ex.git', workloadName, resourceType);
    topologyPage.verifyWorkloadInTopologyPage(workloadName);
  },
);

Given('user has installed helm release {string}', (helmReleaseName: string) => {
  createHelmChartFromAddPage(helmReleaseName);
  topologyPage.verifyWorkloadInTopologyPage(helmReleaseName);
});

When('user clicks on Monitoring tab', () => {
  topologySidePane.selectTab(sideBarTabs.observe);
});

When('user selects {string} from Context Menu', (menuOption: string) => {
  topologyPage.selectContextMenuAction(menuOption);
});

When('user clicks on View Monitoring dashboard link', () => {
  cy.get('a')
    .contains('View monitoring dashboard')
    .click({ force: true });
});

When('user selects {string} from topology sidebar Actions dropdown', (menuOption: string) => {
  topologySidePane.selectNodeAction(menuOption);
});

When('user clicks on the workload {string} to open the sidebar', (nodeName: string) => {
  topologyPage.clickOnNode(nodeName);
  topologySidePane.verify();
});

When(
  'user clicks on the knative service {string} to open the sidebar',
  (knativeWorkloadName: string) => {
    topologyPage.clickOnKnativeService(knativeWorkloadName);
  },
);

Then('page redirected to the Monitoring page', () => {
  detailsPage.titleShouldContain('Monitoring');
});

Given('user is on the topology sidebar of the helm release {string}', (helmReleaseName: string) => {
  createHelmChartFromAddPage(helmReleaseName);
  topologyPage.clickOnHelmWorkload();
});

When('user clicks on From Git card', () => {
  addPage.selectCardFromOptions(addOptions.Git);
});

When('user clicks on Add Readiness Probe', () => {
  addHealthChecksPage.clickProbeLink('Add Readiness Probe');
});

When('user clicks on tick button', () => {
  addHealthChecksPage.clickCheckIcon();
});

When('user clicks on Add Liveness Probe', () => {
  addHealthChecksPage.clickProbeLink('Add Liveness Probe');
});

When('user clicks on Add Startup Probe', () => {
  addHealthChecksPage.clickProbeLink('Add Startup Probe');
});

When('user clicks on Add button', () => {
  addHealthChecksPage.clickAdd();
});

When(
  'user right clicks on the workload {string} to open the Context Menu',
  (workloadName: string) => {
    topologyPage.rightClickOnNode(workloadName);
  },
);

When(
  'user right clicks on the Service {string} to open the Context Menu',
  (serviceName: string) => {
    topologyPage.rightClickOnKnativeService(serviceName);
  },
);

When('user clicks on Edit Health Checks', () => {
  topologyPage.selectContextMenuAction(nodeActions.EditHealthChecks);
});

When('user sees Readiness Probe already added', () => {
  addHealthChecksPage.verifySuccessText('Readiness Probe Added');
});

When('user removes Readiness Probe', () => {
  addHealthChecksPage.removeReadinessProbe();
});

When('user clicks on Save button', () => {
  addHealthChecksPage.clickSave();
});

When('user right clicks on the {string} to open the Context Menu', (nodeName: string) => {
  topologyPage.rightClickOnNode(nodeName);
});

Then('user will be taken to Dashboard tab on the Monitoring page', () => {
  detailsPage.titleShouldContain(pageTitle.Observe);
});

Then('user wont see Monitoring tab', () => {
  topologySidePane.verify();
  cy.get(topologyPO.sidePane.tabName)
    .contains(sideBarTabs.observe)
    .should('not.be.visible');
});

Then('user will see View Monitoring dashborad link', () => {
  cy.get(topologyPO.sidePane.monitoringTab.viewMonitoringDashBoardLink).should('be.visible');
});

Then('user will see CPU Usage Metrics', () => {
  monitoringPage.dashboard.verifyCpuUsageGraph();
});

Then('user will see Memory Usage Metrics', () => {
  monitoringPage.dashboard.verifyMemoryUsageGraph();
});

Then('user will see Receive Bandwidth Metrics', () => {
  monitoringPage.dashboard.verifyReceiveBandwidthGraph();
});

Then('user will see All Events dropdown', () => {
  cy.get(monitoringPO.dashboardTab.workloadsFilter).should('be.visible');
});

Then('user will see Health Checks advanced option', () => {
  // TODO: implement step
});

Then('user will not see Add Health Checks link on the Sidebar for {string}', (nodeName: string) => {
  // TODO: implement step
  cy.log(nodeName);
});

Then('user will see Readiness Probe added on the Add Health Checks page', () => {
  cy.get(addHealthChecksPO.readinessProbeAdded).should('be.visible');
});

Then('user will be redirected Add Health Checks page', () => {
  addHealthChecksPage.verifyTitle();
});

Then('user will see Liveness Probe added on the Add Health Checks page', () => {
  cy.get(addHealthChecksPO.livenessProbeAdded).should('be.visible');
});

Then('user will see Startup Probe added on the Add Health Checks page', () => {
  cy.get(addHealthChecksPO.addStartUpProbeAdded).should('be.visible');
});

Then('user will see Readiness Probe removed on the Add Health Checks page', () => {
  cy.get(addHealthChecksPO.readinessProbeAdded).should('not.be.visible');
});

Then('user sees Liveness Probe already added', () => {
  addHealthChecksPage.verifySuccessText('Liveness Probe Added');
});
