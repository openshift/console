import { When, Then, Given } from 'cypress-cucumber-preprocessor/steps';
import { pageTitle } from '@console/dev-console/integration-tests/support/constants';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants/global';
import { createGitWorkload } from '@console/dev-console/integration-tests/support/pages';
import { app, navigateTo } from '@console/dev-console/integration-tests/support/pages/app';
import { topologyPO, typeOfResource, typeOfWorkload } from '../../page-objects/topology-po';
import { topologyHelper } from '../../pages/topology';

When('user navigates to Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

Then('user sees Topology page with message "No resources found"', () => {
  cy.get(topologyPO.emptyText).should('be.visible');
});

Given('user is at the Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

When('user clicks on "Add page" link in the topology page', () => {
  cy.get(topologyPO.graph.addLink)
    .should('be.visible')
    .click();
});

Then('user will be redirected to Add page', () => {
  cy.url().should('include', 'add');
  app.waitForLoad();
  cy.contains(pageTitle.Add).should('be.visible');
});

Given('user is at the Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

When('user clicks on {string} link in the topology page', (build: string) => {
  cy.get(topologyPO.graph.startBuildingNewApp)
    .should('be.visible')
    .click();
  cy.log(`Quick search bar can be seen with ${build} link`);
});

Then('user will be able to see Add to project search bar', () => {
  cy.get(topologyPO.graph.quickSearch).should('be.visible');
});

Given(
  'user has created a deployment workload named {string}',
  (
    componentName: string,
    resourceType: string = 'Deployment',
    applicationName: string = 'nodejs-ex-git-app',
  ) => {
    navigateTo(devNavigationMenu.Add);
    createGitWorkload(
      'https://github.com/sclorg/nodejs-ex.git',
      componentName,
      resourceType,
      applicationName,
    );
  },
);

Given(
  'user has created deployment config workload {string}',
  (
    componentName: string,
    resourceType: string = 'Deployment Config',
    applicationName: string = 'nodejs-ex-git-app',
  ) => {
    navigateTo(devNavigationMenu.Add);
    createGitWorkload(
      'https://github.com/sclorg/nodejs-ex.git',
      componentName,
      resourceType,
      applicationName,
    );
  },
);

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
  (
    resourceType: string,
    componentName: string = `${resourceType.toLowerCase()}-ex-git`,
    applicationName: string = 'django-ex-git-app',
  ) => {
    navigateTo(devNavigationMenu.Add);
    createGitWorkload(
      'https://github.com/sclorg/django-ex.git',
      componentName,
      resourceType,
      applicationName,
    );
  },
);

When('user is at Topology page chart view', () => {
  navigateTo(devNavigationMenu.Topology);
});

When('user clicks the filter by resource on top', () => {
  cy.get(topologyPO.graph.filterByResource.filterByResourceDropDown)
    .should('be.visible')
    .click();
});

Then(
  'user will see {string} and {string} options',
  (resourceType1: string, resourceType2: string) => {
    cy.get(typeOfResource(resourceType1)).should('be.visible');
    cy.get(typeOfResource(resourceType2)).should('be.visible');
  },
);

Then(
  'user can see only the {string} workload when Deployment option is selected',
  (workload: string) => {
    cy.get(typeOfResource('Deployment')).click();
    cy.get(typeOfWorkload(workload)).should('be.visible');
    cy.get(typeOfResource('Deployment')).click();
  },
);

Then(
  'user can see only the {string} workload when Deployment-Config option is selected',
  (workload: string) => {
    cy.get(typeOfResource('DeploymentConfig')).click();
    cy.get(typeOfWorkload(workload)).should('be.visible');
    cy.get(typeOfResource('DeploymentConfig')).click();
  },
);
