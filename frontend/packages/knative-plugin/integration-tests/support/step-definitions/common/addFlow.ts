import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import {
  addOptions,
  devNavigationMenu,
} from '@console/dev-console/integration-tests/support/constants';
import { pageTitle } from '@console/dev-console/integration-tests/support/constants/pageTitle';
import {
  gitPage,
  createForm,
  navigateTo,
  addPage,
  createGitWorkload,
  catalogPage,
} from '@console/dev-console/integration-tests/support/pages';
import { topologyPO } from '@console/topology/integration-tests/support/page-objects/topology-po';
import { topologyPage } from '@console/topology/integration-tests/support/pages/topology/topology-page';

Given('user is at Add page', () => {
  navigateTo(devNavigationMenu.Add);
});

Given('user is at Import from git page', () => {
  addPage.selectCardFromOptions(addOptions.Git);
});

Given('user has opened application {string} in topology page', (componentName: string) => {
  cy.get('body').then(($body) => {
    if ($body.find(topologyPO.graph.workload).length > 0) {
      topologyPage.verifyWorkloadInTopologyPage(componentName);
      topologyPage.clickWorkloadUrl(componentName);
    } else {
      createGitWorkload(
        'https://github.com/sclorg/nodejs-ex.git',
        componentName,
        'Deployment',
        'dancer-ex-git-app',
      );
    }
  });
  topologyPage.verifyWorkloadInTopologyPage(componentName);
});

Given('user is at Developer Catalog page', () => {
  addPage.selectCardFromOptions(addOptions.DeveloperCatalog);
});

When('user clicks Instantiate Template button on side bar', () => {
  catalogPage.clickButtonOnCatalogPageSidePane();
});

Given('user is at DevFile page', () => {
  addPage.selectCardFromOptions(addOptions.DevFile);
});

When('user navigates to Add page', () => {
  navigateTo(devNavigationMenu.Add);
});

When('user clicks Create button on Add page', () => {
  createForm.clickCreate();
});

Then('user will be redirected to Add page', () => {
  cy.get('.ocs-page-layout__title').should('contain.text', pageTitle.Add);
});

When('user clicks Cancel button on Add page', () => {
  createForm.clickCancel();
});

When('user enters Git Repo url as {string}', (gitUrl: string) => {
  gitPage.enterGitUrl(gitUrl);
  gitPage.verifyValidatedMessage();
  cy.get('body').then(($el) => {
    if ($el.find('[aria-label$="Alert"]').length) {
      cy.log('Builder image detected');
    }
  });
});

When('user enters Application name as {string}', (appName: string) => {
  gitPage.enterAppName(appName);
});

When('user enters Name as {string}', (name: string) => {
  gitPage.enterComponentName(name);
});

When('user selects resource type as {string}', (resourceType: string) => {
  gitPage.selectResource(resourceType);
});

Then('user will be redirected to {string} page', (title: string) => {
  detailsPage.titleShouldContain(title);
});

When('user clicks EventSource card on Add page', () => {
  addPage.selectCardFromOptions(addOptions.EventSource);
  detailsPage.titleShouldContain(pageTitle.EventSource);
});

When('user navigates to Add page', () => {
  navigateTo(devNavigationMenu.Add);
});

Then('user will see the Channel card on the Add page', () => {
  addPage.verifyCard('Channel');
});
