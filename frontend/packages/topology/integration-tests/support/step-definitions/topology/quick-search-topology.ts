import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants';
import {
  catalogPO,
  gitPO,
  quickSearchAddPO,
} from '@console/dev-console/integration-tests/support/pageObjects';
import {
  createGitWorkload,
  devFilePage,
  gitPage,
  navigateTo,
  topologyHelper,
} from '@console/dev-console/integration-tests/support/pages';
import { addQuickSearch } from '../../../../../dev-console/integration-tests/support/pages/add-flow/add-quick-search';
import { topologyPO } from '../../page-objects/topology-po';
import { topologyPage } from '../../pages/topology/topology-page';

Then('user is able to see Start building your application, Add page links', () => {
  cy.get(topologyPO.emptyView.startBuildingYourApplicationLink).should('be.visible');
  cy.get(topologyPO.emptyView.addPageLink).should('be.visible');
});

Then('Display options dropdown, Filter by resource and Find by name fields are disabled', () => {
  cy.contains('Display options').should('be.disabled');
  cy.get(topologyPO.filterByResourceDropDown).should('be.disabled');
  cy.get(topologyPO.search).should('be.disabled');
});

Then('switch view is disabled', () => {
  cy.get(topologyPO.switcher).should('have.attr', 'aria-disabled', 'true');
});

Given('user created a workload and is at topology list view', () => {
  navigateTo(devNavigationMenu.Add);
  createGitWorkload(
    'https://github.com/sclorg/nodejs-ex.git',
    'nodejs-app',
    'deployment',
    'nodejs-ex-git-app',
    false,
  );
  navigateTo(devNavigationMenu.Topology);
  cy.get(topologyPO.quickSearchPO.listView).click();
});

Given('user is at topology list view', () => {
  navigateTo(devNavigationMenu.Topology);
  topologyPage.verifyUserIsInListView();
});

Given('user is at topology graph view', () => {
  navigateTo(devNavigationMenu.Topology);
  topologyPage.verifyUserIsInGraphView();
});

When('user clicks on graph view button', () => {
  topologyPage.verifyUserIsInListView();
  cy.get(topologyPO.quickSearchPO.graphView).click();
});

When('user clicks on list view button', () => {
  topologyPage.verifyUserIsInGraphView();
  cy.get(topologyPO.quickSearchPO.listView).click();
});

Then('user can see Add to project button', () => {
  cy.get(quickSearchAddPO.quickSearchButton).should('be.visible');
});

When('user clicks Add to project button', () => {
  cy.get(quickSearchAddPO.quickSearchButton)
    .should('be.visible')
    .click();
});

Then('user can see Add to project search bar', () => {
  cy.get(quickSearchAddPO.quickSearchBar).should('be.visible');
});

When('user enters {string} in Add to project search bar', (node: string) => {
  addQuickSearch.enterNodeName(node);
});

When('user selects django+PostgreSQL option', () => {
  cy.get(topologyPO.quickSearchPO.djangoPostgreSQL).click();
});

When('user clicks on instantiate template', () => {
  cy.get(quickSearchAddPO.quickSearchCreateButton)
    .should('be.visible')
    .click();
});

When('user clicks on create with default values in Instantiate Template form', () => {
  cy.get(catalogPO.create)
    .scrollIntoView()
    .click();
});

Then(
  'user can see {string} and {string} workload in topology graph view',
  (workloadName1: string, workloadName2: string) => {
    topologyPage.verifyWorkloadInTopologyPage(workloadName1);
    topologyPage.verifyWorkloadInTopologyPage(workloadName2);
  },
);

When('user selects .Net core option', () => {
  cy.get(topologyPO.quickSearchPO.NETSample).click();
});

When('user clicks on Create Application', () => {
  cy.get(quickSearchAddPO.quickSearchCreateButton)
    .should('be.visible')
    .click();
});

When('user clicks on create with default values in Create Application form', () => {
  cy.get(catalogPO.create)
    .scrollIntoView()
    .click();
});

Then('user can see {string} workload in topology list view', (workloadName: string) => {
  topologyHelper.verifyWorkloadInTopologyPage(workloadName);
});

When('user clicks on View all developer catalog items link', () => {
  cy.get(quickSearchAddPO.viewInDevCatalog)
    .scrollIntoView()
    .click();
});

Then('user will see Catalog with {string} text filter', (filterWord: string) => {
  cy.get(catalogPO.search).should('be.visible');
  cy.get(catalogPO.search).should('have.value', filterWord);
});

Then('user will see No results', () => {
  cy.get(topologyPO.quickSearchPO.noResults).should('be.visible');
});

When('user selects Monitor your sample application option', () => {
  cy.get(topologyPO.quickSearchPO.monitorApp).click();
});

When('user clicks on Start button', () => {
  cy.get(quickSearchAddPO.quickSearchCreateButton)
    .should('be.visible')
    .click();
});

Then('Monitor your sample application quick start displays in the Topology', () => {
  cy.get(topologyPO.quickSearchPO.quickstartDrawer).should('be.visible');
});

When('user clicks on View all quick starts link', () => {
  cy.get(topologyPO.quickSearchPO.quickStarts).click();
});

Then('user will be redirected to the search results of the Quick Starts Catalog', () => {
  cy.get(topologyPO.quickSearchPO.pageTitle).should('include.text', 'Quick Starts');
  navigateTo(devNavigationMenu.Topology);
});

When('user selects Basic NodeJS Devfiles option', () => {
  cy.get(topologyPO.quickSearchPO.nodejsDevfiles).click();
});

When('user clicks on Create button in the Import from Devfile page', () => {
  devFilePage.verifyValidatedMessage('https://github.com/nodeshift-starters/devfile-sample.git');
  cy.get(gitPO.gitRepoUrl).should(
    'have.value',
    'https://github.com/nodeshift-starters/devfile-sample.git',
  );
  gitPage.clickCreate();
});

Then(
  'user is taken to the Topology page with {string} workload created',
  (workloadName: string) => {
    topologyPage.verifyWorkloadInTopologyPage(workloadName);
  },
);

When('user selects Basic NodeJS Samples option', () => {
  cy.get(topologyPO.quickSearchPO.nodejsSamples).click();
});

When('user clicks on Create Devfile Samples', () => {
  cy.get(quickSearchAddPO.quickSearchCreateButton)
    .should('be.visible')
    .click();
});

When('user enters Name as {string} in Import from Devfile page', (name: string) => {
  const gitUrl = 'https://github.com/nodeshift-starters/devfile-sample.git';
  devFilePage.verifyValidatedMessage(gitUrl);
  gitPage.enterAppName(`${name}-app`);
  gitPage.enterWorkloadName(`${name}`);
  cy.get(gitPO.gitRepoUrl).should('have.value', gitUrl);
});

When('user clicks on View all Samples link', () => {
  cy.get(topologyPO.quickSearchPO.samplePage).click();
});

Then('user is taken to the search results in context of the Samples page', () => {
  cy.get(topologyPO.quickSearchPO.resourseTitle).should('include.text', 'Samples');
});
