import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants';
import {
  app,
  createGitWorkload,
  navigateTo,
  projectNameSpace,
  topologyActions,
} from '@console/dev-console/integration-tests/support/pages';
import {
  topologyHelper,
  topologyPage,
  topologySidePane,
} from '@console/topology/integration-tests/support/pages/topology';
import { topologyPO } from '../../page-objects/topology-po';
import { checkPodsText } from '../../pages/functions/add-secret';

Given('user has scaled up the pod to 2 for workload {string}', (workloadName: string) => {
  topologyPage.componentNode(workloadName).click({ force: true });
  topologySidePane.selectTab('Details');
  topologySidePane.scaleUpPodCount();
});

When('user scales up the pod', () => {
  topologySidePane.scaleUpPodCount();
});

When('user scales down the pod number', () => {
  topologySidePane.scaleDownPodCount();
});

Then(
  'user is able to see pod Scaling to {string} for workload {string}',
  (podText: string, workloadName: string) => {
    topologySidePane.close();
    cy.reload();
    app.waitForDocumentLoad();
    topologyPage.componentNode(workloadName).click({ force: true });
    topologySidePane.selectTab('Details');
    topologySidePane.verifyPodText(podText);
  },
);

Given('user has created a deployment workload {string}', (componentName: string) => {
  navigateTo(devNavigationMenu.Add);
  createGitWorkload(
    'https://github.com/sclorg/nodejs-ex.git',
    componentName,
    'Deployment',
    'nodejs-ex-git-app',
  );
});

Given('user is at Topology chart view', () => {
  navigateTo(devNavigationMenu.Topology);
  cy.get(topologyPO.switcher).should('have.attr', 'aria-label', 'List view');
});

When('user clicks on workload {string} to open sidebar', (workloadName: string) => {
  topologyPage.componentNode(workloadName).click({ force: true });
});

When('user clicks on Action menu', () => {
  topologySidePane.clickActionsDropDown();
});

When('user clicks {string} from action menu', (actionItem: string) => {
  app.waitForLoad();
  topologyActions.selectAction(actionItem);
});

When('user deletes the existing annotation for route', () => {
  cy.get(topologyPO.deploymentStrategy.envRow)
    .eq(1)
    .within(() => {
      cy.get('[data-test="delete-button"]').click();
    });
});

When('user enters key as {string}', (annotationKey: string) => {
  cy.get(topologyPO.graph.addNewAnnotations).click();
  cy.get(topologyPO.deploymentStrategy.envName)
    .last()
    .clear()
    .type(annotationKey);
});

When('user enters value as {string}', (annotationValue: string) => {
  cy.get(topologyPO.deploymentStrategy.envValue)
    .last()
    .clear()
    .type(annotationValue);
  cy.get(topologyPO.graph.deleteWorkload).click();
});

Then('user can see route decorator has been hidden for workload {string}', (appName: string) => {
  cy.reload();
  app.waitForDocumentLoad();
  topologyHelper.search(appName);
  cy.get(topologyPO.graph.reset).click();
  cy.get(topologyPO.highlightNode)
    .should('be.visible')
    .within(() => {
      cy.get(topologyPO.graph.routeDecorator).should('not.exist');
    });
});

Then('user can see the new route href in route decorator be {string}', (value: string) => {
  cy.reload();
  app.waitForDocumentLoad();
  topologyHelper.search('nodejs-ex-2');
  cy.get(topologyPO.graph.reset).click();
  cy.get(topologyPO.highlightNode)
    .should('be.visible')
    .within(() => {
      cy.get(topologyPO.graph.routeDecorator, { timeout: 120000 }).should(
        'have.attr',
        'href',
        value,
      );
    });
});

Given('user has selected namespace {string}', (projectName: string) => {
  projectNameSpace.selectProject(projectName);
});

When('user clicks on knative workload {string}', (workloadName: string) => {
  topologyPage.waitForLoad();
  topologyPage.knativeNode(workloadName).click({ force: true });
});

When('user clicks on sidebar workload {string}', (workloadName: string) => {
  topologyPage.waitForLoad();
  topologyPage.componentNode(workloadName).click({ force: true });
});

When('user opens Details tab', () => {
  topologyPage.waitForLoad();
  topologyPage.componentNode('nodejs-ex-git-1').click({ force: true });
  topologySidePane.selectTab('Details');
});

When('user can see pod count is 1', () => {
  topologySidePane.close();
  topologyPage.componentNode('nodejs-ex-git-1').click({ force: true });
  checkPodsText();
});

When('user can see workload {string} is created', (workloadName: string) => {
  navigateTo(devNavigationMenu.Topology);
  topologyPage.componentNode(workloadName).should('be.visible');
});

When('user clicks on {string} from action menu', (actionItem: string) => {
  topologyActions.selectAction(actionItem);
});

Then('user can see traffic details for pod', () => {
  topologySidePane.selectTab('Resources');
  topologySidePane.verifySection('Pods');
  cy.get(topologyPO.sidePane.resourcesTab.waitingPods, { timeout: 100000 }).should('not.exist');
  cy.get(topologyPO.sidePane.resourcesTab.podTrafficStatus, { timeout: 100000 }).should(
    'be.visible',
  );
});
