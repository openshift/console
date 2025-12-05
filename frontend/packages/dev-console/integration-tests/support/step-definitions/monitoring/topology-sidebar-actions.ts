import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { nodeActions } from '../../constants';
import { addHealthChecksPO } from '../../pageObjects';
import {
  addHealthChecksPage,
  createGitWorkloadIfNotExistsOnTopologyPage,
  createHelmChartFromAddPage,
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

When('user selects {string} from Context Menu', (menuOption: string) => {
  topologyPage.selectContextMenuAction(menuOption);
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

When(
  'user clicks on the knative service {string} to open the sidebar',
  (knativeWorkloadName: string) => {
    topologyPage.clickOnKnativeService(knativeWorkloadName);
  },
);

Given('user is on the topology sidebar of the helm release {string}', (helmReleaseName: string) => {
  createHelmChartFromAddPage(helmReleaseName);
});

When('user clicks on Add Readiness Probe', () => {
  addHealthChecksPage.clickProbeLink('Add Readiness probe');
});

When('user clicks on tick button', () => {
  addHealthChecksPage.clickCheckIcon();
});

When('user clicks on Add Liveness Probe', () => {
  addHealthChecksPage.clickProbeLink('Add Liveness probe');
});

When('user clicks on Add Startup Probe', () => {
  addHealthChecksPage.clickProbeLink('Add Startup probe');
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
  cy.byTestActionID(`Edit ${name}`).should('be.visible').click();
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
  addHealthChecksPage.verifySuccessText('Readiness probe added');
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
  addHealthChecksPage.verifySuccessText('Liveness probe added');
});
