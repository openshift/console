import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants';
import {
  app,
  createGitWorkload,
  navigateTo,
  topologyActions,
} from '@console/dev-console/integration-tests/support/pages';
import {
  topologyPage,
  topologySidePane,
} from '@console/topology/integration-tests/support/pages/topology';
import { topologyPO } from '../../page-objects/topology-po';

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

Then('user can see the route link in Resource section has been removed', () => {
  // Uncomment this after the feature work for epic ODC-6361 is complete
  // cy.get(topologyPO.sidePane.resourcesTab.routeLink)
  //   .scrollIntoView()
  //   .should('not.be.visible');
});

Then('user can see route decorator has been hidden', () => {
  // Uncomment this after the feature work for epic ODC-6361 is complete
  // cy.get(topologyPO.graph.routeDecorator)
  //   .scrollIntoView()
  //   .should('not.be.visible');
});

Then('user can see the new route link in Resource section be {string}', (value: string) => {
  // Uncomment this after the feature work for epic ODC-6361 is complete
  // cy.get(topologyPO.sidePane.resourcesTab.routeLink)
  //   .scrollIntoView()
  //   .should('contain.text', value);
  cy.log(value); // to avoid lint issue
});
