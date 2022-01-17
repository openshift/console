import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { catalogPO, gitPO, quickSearchAddPO, quickStartSidebarPO } from '../../pageObjects';
import { devFilePage, gitPage, topologyPage } from '../../pages';
import { addQuickSearch } from '../../pages/add-flow/add-quick-search';

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

When('user selects {string} option of {string}', (option: string, type: string) => {
  addQuickSearch.selectQuickOption(option, type);
});

When('user clicks on {string}', (buttonName: string) => {
  cy.log(buttonName, 'is clicked');
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
  'user can see {string} and {string} workload in topology view',
  (workloadName1: string, workloadName2: string) => {
    topologyPage.verifyWorkloadInTopologyPage(workloadName1);
    topologyPage.verifyWorkloadInTopologyPage(workloadName2);
  },
);

When('user clicks on View all developer catalog items link', () => {
  cy.get(quickSearchAddPO.viewInDevCatalog)
    .scrollIntoView()
    .click();
});

Then('user will see Catalog with {string} text filter', (filterWord: string) => {
  cy.get(catalogPO.search).should('be.visible');
  cy.get(catalogPO.search).should('have.value', filterWord);
});

Then('user will see {string}', (searchResult: string) => {
  cy.get(quickSearchAddPO.quickSearchNoResults).contains(searchResult);
});

Then('{string} quick start displays in the Add page', (quickStartName: string) => {
  cy.get(quickStartSidebarPO.quickStartSidebar)
    .should('be.visible')
    .contains(quickStartName);
});

When('user clicks on Create button in the Import from Git page', () => {
  const gitUrl = 'https://github.com/nodeshift-starters/devfile-sample.git';
  devFilePage.verifyValidatedMessage(gitUrl);
  gitPage.enterAppName('devfile-sample-git-app');
  gitPage.enterWorkloadName('devfile-sample-git');
  cy.get(gitPO.gitRepoUrl).should('have.value', gitUrl);
  // re-enter the URL so the actual github request gets mocked
  gitPage.enterGitUrl(gitUrl);
  gitPage.clickCreate();
});

Then(
  'user is taken to the Topology page with {string} workload created',
  (workloadName: string) => {
    topologyPage.verifyWorkloadInTopologyPage(workloadName);
  },
);
