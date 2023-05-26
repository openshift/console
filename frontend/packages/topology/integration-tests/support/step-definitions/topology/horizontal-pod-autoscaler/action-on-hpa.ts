import { When, Then, Given } from 'cypress-cucumber-preprocessor/steps';
import {
  devNavigationMenu,
  switchPerspective,
} from '@console/dev-console/integration-tests/support/constants';
import {
  app,
  createGitWorkloadWithResourceLimit,
  navigateTo,
  perspective,
  topologyPage,
  topologySidePane,
} from '@console/dev-console/integration-tests/support/pages';
import { hpaPO } from '../../../page-objects/hpa-po';
import { checkPodsCount } from '../../../pages/functions/add-secret';

Given(
  'user has created a deployment workload {string} with CPU resource limit {string} and Memory resource limit {string}',
  (workloadName: string, limitCPU: string, limitMemory: string) => {
    navigateTo(devNavigationMenu.Add);
    createGitWorkloadWithResourceLimit(
      'https://github.com/sclorg/nodejs-ex.git',
      workloadName,
      'Deployment',
      'nodejs-ex-git-app',
      limitCPU,
      limitMemory,
    );
  },
);

Given('user is at administrator perspective', () => {
  perspective.switchTo(switchPerspective.Administrator);
});

Given('user is at developer perspective', () => {
  perspective.switchTo(switchPerspective.Developer);
  cy.testA11y('Developer perspective with guider tour modal');
});

Given('user is at HorizontalPodAutoscaler page under workloads section', () => {
  cy.get(hpaPO.navWorkloads).click();
  cy.get(hpaPO.nav).contains('HorizontalPodAutoscalers').click();
});

Given('user has created HorizontalPodAutoscaler', () => {
  cy.get(hpaPO.createItem).contains('Create HorizontalPodAutoscaler').click();
  cy.get(hpaPO.saveChanges).click();
});

Given(
  'user can see a deployment workload {string} created with HPA assigned to it',
  (workloadName: string) => {
    topologyPage.componentNode(workloadName).should('be.visible');
  },
);

Given('user has a deployment workload {string} with HPA assigned to it', (workloadName) => {
  navigateTo(devNavigationMenu.Add);
  createGitWorkloadWithResourceLimit(
    'https://github.com/sclorg/nodejs-ex.git',
    workloadName,
    'Deployment',
    'nodejs-ex-git-app',
  );
  cy.get(hpaPO.sidebarClose).click();
  topologyPage.componentNode(workloadName).click({ force: true });
  cy.get(hpaPO.actionMenu).click();
  cy.byTestActionID('Add HorizontalPodAutoscaler').click();
  cy.get(hpaPO.cpu).clear().type('50');
  cy.get(hpaPO.memory).clear().type('50');
  cy.get(hpaPO.submitBtn).click();
  cy.get(hpaPO.switchToggler).should('be.visible');
});

When('user clicks the HPA associated with the workload', () => {
  cy.get(hpaPO.resourceTitle).should('include.text', 'example');
  cy.get(hpaPO.hpaHeading).should('be.visible');
  cy.get(hpaPO.nav).contains('HorizontalPodAutoscalers').click();
  cy.get(hpaPO.itemFilter).type('example');
  cy.get(hpaPO.resourceItem).contains('example').click();
});

When('user selects {string} option from Actions menu in HPA details page', (option: string) => {
  cy.get(hpaPO.resourceTitle).should('include.text', 'example');
  cy.get(hpaPO.actionMenu).click();
  cy.byTestActionID(option).click();
});

When('user sees Delete Horizontal Pod Autoscaler modal opens', () => {
  cy.get(hpaPO.modalTitle).should('be.visible').contains('Delete HorizontalPodAutoscaler?');
});

When('user clicks Delete', () => {
  cy.get(hpaPO.deleteOption).click();
});

Then('user can see the intended HPA is deleted', () => {
  cy.get(hpaPO.exampleHPA).should('not.exist');
  cy.get(hpaPO.emptyMessage).contains('No HorizontalPodAutoscalers found');
});

Given('user is at Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

When('user clicks on workload {string}', (workloadName: string) => {
  topologyPage.waitForLoad();
  topologyPage.componentNode(workloadName).click({ force: true });
});

When('user selects {string} option from Actions menu', (option: string) => {
  cy.get(hpaPO.actionMenu).click();
  cy.byTestActionID(option).click();
});

When('user enters Name as {string} in Horizontal Pod Autoscaler page', (hpaName: string) => {
  cy.get(hpaPO.nameHPA).clear().type(hpaName);
});

When('user sets Minimum Pods value to {string}', (minPod: string) => {
  cy.get(hpaPO.minhpaPod).clear().type(minPod);
});

When('user sets Maximum Pods value to {string}', (maxPod: string) => {
  cy.get(hpaPO.maxhpaPod).clear().type(maxPod);
});

When('user enters CPU Utilization as {string}', (cpuUtilisation: string) => {
  cy.get(hpaPO.cpu).clear().type(cpuUtilisation);
});

When('user enters Memory Utilization as {string}', (memoryUtilization: string) => {
  cy.get(hpaPO.memory).clear().type(memoryUtilization);
});

When('user clicks on Save button', () => {
  cy.get(hpaPO.submitBtn).click();
});

Then('user can see sidebar opens with Resources tab selected by default', () => {
  topologySidePane.verifySelectedTab('Resources');
});

Then('user can see two pods under pod section', () => {
  checkPodsCount();
  cy.get(hpaPO.nodeList, { timeout: 120000 }).should('have.length.within', 2, 5);
});

Then('user can see HorizontalPodAutoscalers section', () => {
  cy.get(hpaPO.sectionHeading).contains('HorizontalPodAutoscalers');
});

Then(
  'user can see the {string} with HPA tag associated present under HPA section',
  (hpaName: string) => {
    cy.byLegacyTestID(hpaName).should('be.visible');
  },
);

When('user sees values are prefilled', () => {
  cy.get(hpaPO.hpaFormName).should('not.be.empty');
  cy.get(hpaPO.maxhpaPod).should('not.be.empty');
  cy.get(hpaPO.minhpaPod).should('not.be.empty');
  cy.get(hpaPO.cpu).should('not.be.empty');
  cy.get(hpaPO.memory).should('not.be.empty');
});

When('user checks the name value but cannot edit it', () => {
  cy.get(hpaPO.hpaFormName).should('have.value', 'example');
  cy.get(hpaPO.hpaFormName).should('be.disabled');
});

When('user checks and edit the value to {string} for maximum pods', (maxPod: string) => {
  cy.get(hpaPO.maxhpaPod).clear().type(maxPod);
});

When('user checks and edit the value to {string} for minimum pods', (minPod: string) => {
  cy.get(hpaPO.minhpaPod).clear().type(minPod);
});

When('user checks and edit the cpu value to {string}', (cpuUtilisation: string) => {
  cy.get(hpaPO.cpu).clear().type(cpuUtilisation);
});

When('user checks and edit the memory value to {string}', (memoryUtilization: string) => {
  cy.get(hpaPO.memory).clear().type(memoryUtilization);
});

Then('user goes to the details tab', () => {
  topologySidePane.selectTab('Details');
});

Then('user can see the changed pods number', () => {
  cy.reload();
  app.waitForDocumentLoad();
  topologySidePane.selectTab('Details');
  cy.get(hpaPO.podRing, { timeout: 80000 }).should('include.text', '3 Pods');
  cy.get(hpaPO.sidebarClose).click();
});

When('user right clicks on workload {string}', (appName: string) => {
  topologyPage.rightClickOnNode(appName);
});

When('user selects {string} option from context menu', (actionItem: string) => {
  cy.byTestActionID(actionItem).click();
});

When('user clicks Remove on Remove HorizontalPodAutoscaler? modal', () => {
  cy.get(hpaPO.deleteOption).click();
});

When('user selects Resources tab on sidebar', () => {
  topologySidePane.selectTab('Resources');
});

Then('user can not see HorizontalPodAutoscalers section', () => {
  cy.reload();
  app.waitForDocumentLoad();
  cy.get(hpaPO.sectionHeading).contains('HorizontalPodAutoscalers').should('not.exist');
});
