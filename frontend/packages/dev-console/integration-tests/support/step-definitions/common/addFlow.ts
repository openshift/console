import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { gitPage } from '../../pages/add-flow/git-page';
import { perspective, navigateTo } from '../../pages/app';
import { addPage } from '../../pages/add-flow/add-page';
import { addOptions } from '../../constants/add';
import { createGitWorkload } from '../../pages/functions/createGitWorkload';
import { switchPerspective, devNavigationMenu } from '../../constants/global';
import { pageTitle } from '../../constants/pageTitle';
import { catalogPage } from '../../pages/add-flow/catalog-page';
import { topologyPO } from '../../pageObjects/topology-po';
import { topologyHelper } from '../../pages/topology/topology-helper-page';
import { topologyPage } from '../../pages/topology/topology-page';

Given('user is at Add page', () => {
  navigateTo(devNavigationMenu.Add);
});

Given('user is at Topology page', () => {
  navigateTo(devNavigationMenu.Topology);
});

Given(
  'user has created workload {string} with resource type {string}',
  (componentName: string, resourceType: string = 'Deployment') => {
    createGitWorkload(
      'https://github.com/sclorg/nodejs-ex.git',
      componentName,
      resourceType,
      'nodejs-ex-git-app',
    );
    topologyHelper.verifyWorkloadInTopologyPage(componentName);
  },
);

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
  perspective.switchTo(switchPerspective.Developer);
  navigateTo(devNavigationMenu.Add);
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
  gitPage.clickCreate();
});

Then('user will be redirected to Add page', () => {
  // detailsPage.titleShouldContain(pageTitle.Add);
  cy.get('.ocs-page-layout__title').should('contain.text', pageTitle.Add);
});

When('user clicks Cancel button on Add page', () => {
  gitPage.clickCancel();
});

Then('user can see {string} card on the Add page', (cardName: string) => {
  addPage.verifyCard(cardName);
});

When('user selects {string} card from add page', (cardName: string) => {
  addPage.selectCardFromOptions(cardName);
});
