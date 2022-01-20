import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { pageTitle, sideBarTabs, nodeActions } from '../../constants';
import { monitoringPO, topologyPO, addHealthChecksPO } from '../../pageObjects';
import {
  addHealthChecksPage,
  createGitWorkloadIfNotExistsOnTopologyPage,
  createHelmChartFromAddPage,
  monitoringPage,
  topologyPage,
  topologySidePane,
} from '../../pages';

Given(
  'workload {string} with resource type {string} is present in topology page',
  (workloadName: string, resourceType: string) => {
    createGitWorkloadIfNotExistsOnTopologyPage(
      'https://github.com/sclorg/nodejs-ex.git',
      workloadName,
      resourceType,
    );
    topologyPage.verifyWorkloadInTopologyPage(workloadName);
  },
);

Given('helm release {string} is present in topology page', (helmReleaseName: string) => {
  createHelmChartFromAddPage(helmReleaseName);
  topologyPage.verifyWorkloadInTopologyPage(helmReleaseName);
});

Given(
  'user has installed helm chart {string} with release name {string}',
  (helmChartName: string, helmReleaseName: string) => {
    createHelmChartFromAddPage(helmReleaseName, helmChartName);
    topologyPage.verifyWorkloadInTopologyPage(helmReleaseName);
  },
);

When('user clicks on Observe tab', () => {
  topologySidePane.selectTab(sideBarTabs.Observe);
});

When('user clicks on Memory usage chart', () => {
  cy.get('[data-test="memory-usage"]')
    .contains('a', 'Inspect')
    .click();
});

Then('page redirected to the Observe Metrics page for the chart', () => {
  detailsPage.titleShouldContain('Observe');
  cy.get('.co-m-horizontal-nav-item--active')
    .find(monitoringPO.tabs.metrics)
    .should('be.visible');
});

When('user selects {string} from Context Menu', (menuOption: string) => {
  topologyPage.selectContextMenuAction(menuOption);
});

When('user clicks on View dashboard link', () => {
  cy.get(topologyPO.sidePane.monitoringTab.viewMonitoringDashBoardLink).click({ force: true });
});

When('user selects {string} from topology sidebar Actions dropdown', (menuOption: string) => {
  topologySidePane.selectNodeAction(menuOption);
});

When('user clicks on the workload {string} to open the sidebar', (nodeName: string) => {
  topologyPage.clickOnNode(nodeName);
  topologySidePane.verify();
});

When(
  'user clicks on the deployment of workload {string} to open the sidebar',
  (nodeName: string) => {
    topologyPage.clickOnDeploymentNode(nodeName);
    topologySidePane.verify();
  },
);

Then('user wont see Observe tab', () => {
  topologySidePane.verifyTabNotVisible(sideBarTabs.Observe);
});

Then('page redirected to the Observe page', () => {
  detailsPage.titleShouldContain('Observe');
});

Then('page redirected to the Dashboard tab of Observe page', () => {
  detailsPage.titleShouldContain('Observe');
  cy.get('.co-m-horizontal-nav-item--active')
    .find(monitoringPO.tabs.dashboard)
    .should('be.visible');
});

Then('user will see the {string} selected in the Dashboard dropdown', (dashboardName: string) => {
  cy.get(monitoringPO.dashboardTab.dashboardDropdown).should('contain.text', dashboardName);
});

Then('user will see {string} option selected in the Workload dropdown', (workloadName: string) => {
  cy.get(monitoringPO.dashboardTab.workloadsDropdown).should('contain.text', workloadName);
});

Then('user will see {string} option selected in the Type dropdown', (resourceType: string) => {
  cy.get(monitoringPO.dashboardTab.typeDropdown).should('contain.text', resourceType);
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

When('user edits the application {string}', (name: string) => {
  topologyPage.rightClickOnNode(name);
  cy.byTestActionID(`Edit ${name}`)
    .should('be.visible')
    .click();
});

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

When('user starts a new build', () => {
  topologyPage.startBuild();
});

Then('user will be taken to Dashboard tab on the Monitoring page', () => {
  detailsPage.titleShouldContain(pageTitle.Observe);
});

Then('user wont see Monitoring tab', () => {
  topologySidePane.verify();
  cy.get(topologyPO.sidePane.tabName)
    .contains(sideBarTabs.Observe)
    .should('not.be.visible');
});

Then('user will see View dashboard link', () => {
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
