import { When, Then, Given } from 'cypress-cucumber-preprocessor/steps';
import { pageTitle } from '@console/dev-console/integration-tests/support/constants';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants/global';
import { createGitWorkload } from '@console/dev-console/integration-tests/support/pages';
import { app, navigateTo } from '@console/dev-console/integration-tests/support/pages/app';
import { topologyPO, typeOfWorkload } from '../../page-objects/topology-po';
import { topologyHelper } from '../../pages/topology';

When('user navigates to Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

Then('user sees Topology page with message {string}', (message: string) => {
  cy.get(topologyPO.emptyText).contains(message);
});

Given('user is at the Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

When('user clicks on {string} link in the topology page', (addLink) => {
  cy.get(topologyPO.graph.addLink)
    .should('be.visible')
    .should('have.text', addLink);
  cy.get(topologyPO.graph.addLink).click();
});

Then('user will be redirected to Add page', () => {
  cy.url().should('include', 'add');
  app.waitForLoad();
  cy.contains(pageTitle.Add).should('be.visible');
});

When('user clicks on {string} link in the empty topology page', (build: string) => {
  cy.byTestID(
    build
      .toLowerCase()
      .replace(/\s+/g, '-')
      .trim(),
  )
    .should('be.visible')
    .click();
  cy.log(`Quick search bar can be seen with ${build} link`);
});

Then('user will be able to see Add to project search bar', () => {
  cy.get(topologyPO.graph.quickSearch).should('be.visible');
});

Given('user has created a deployment workload named {string}', (componentName: string) => {
  navigateTo(devNavigationMenu.Add);
  createGitWorkload(
    'https://github.com/sclorg/nodejs-ex.git',
    componentName,
    'Deployment',
    'nodejs-ex-git-app',
  );
});

Given('user has created a deployment config workload {string}', (componentName: string) => {
  navigateTo(devNavigationMenu.Add);
  createGitWorkload(
    'https://github.com/sclorg/nodejs-ex.git',
    componentName,
    'Deployment Config',
    'nodejs-ex-git-app',
  );
});

When('user navigates to Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

Then(
  'user sees {string} and {string} workloads in topology chart area',
  (workload1: string, workload2: string) => {
    topologyHelper.verifyWorkloadInTopologyPage(workload1);
    topologyHelper.verifyWorkloadInTopologyPage(workload2);
  },
);

Given(
  'user created {string} workload',
  (resourceType: string, componentName: string = `${resourceType.toLowerCase()}-ex-git`) => {
    navigateTo(devNavigationMenu.Add);
    createGitWorkload(
      'https://github.com/sclorg/django-ex.git',
      componentName,
      resourceType,
      'django-ex-git-app',
    );
  },
);

When('user is at Topology page chart view', () => {
  navigateTo(devNavigationMenu.Topology);
  cy.get(topologyPO.switcher).should('have.attr', 'aria-label', 'List view');
});

When('user clicks the filter by resource on top', () => {
  cy.get(topologyPO.graph.filterByResource.filterByResourceDropDown)
    .should('be.visible')
    .click();
});

When('user clicks on {string} option', (resourceType: string) => {
  cy.byTestID(resourceType)
    .should('be.visible')
    .click();
});

Then('user can see only the {string} workload', (workload: string) => {
  cy.get(typeOfWorkload(workload)).should('be.visible');
});
