import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { addOptions, devNavigationMenu } from '../../constants';
import { addPagePO, helmChartRepositoriesPO } from '../../pageObjects';
import { addPage, createForm, navigateTo } from '../../pages';
import { helmChartRepository } from '../../pages/add-flow/helm-chart-repository';

Given('user is at Add page', () => {
  navigateTo(devNavigationMenu.Add);
});

Then('user can see Helm Chart repositories card on the Add page', () => {
  cy.get(addPagePO.helmChartRepositoriesCard).should('be.visible');
});

When('user selects Helm Chart repositories card from Add page', () => {
  addPage.selectCardFromOptions(addOptions.HelmChartRepositories);
});

When('user switches to YAML', () => {
  cy.get(helmChartRepositoriesPO.yaml.yamlSwitcher)
    .should('be.visible')
    .click();
});

Then('user can see YAML view', () => {
  cy.get(helmChartRepositoriesPO.yaml.yamlEditor).should('be.visible');
  cy.get(helmChartRepositoriesPO.cancelButton)
    .should('be.enabled')
    .click();
});

When('user selects Helm Chart card on the Add page', () => {
  addPage.selectCardFromOptions(addOptions.HelmChart);
});

When('user clicks {string} link in Helm Charts catalog description', (linkText: string) => {
  cy.byLegacyTestID('catalog-page-description').within(() => {
    cy.get('a')
      .contains(linkText)
      .click();
  });
});

Then('user can see {string} form', (title: string) => {
  cy.get(helmChartRepositoriesPO.formTitle).should('have.text', title);
  cy.get(helmChartRepositoriesPO.cancelButton)
    .should('be.enabled')
    .click();
});

Given('user is at Create Helm Chart Repository page', () => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.HelmChartRepositories);
});

Then('user enters Chart repository name as helm-test2', () => {
  cy.get(helmChartRepositoriesPO.name)
    .should('be.visible')
    .clear()
    .type('helm-test2');
});

When('user selects cluster-scoped scope type', () => {
  cy.get(`[data-test="HelmChartRepository-view-input"]`)
    .should('be.visible')
    .click();
});

When('user enters Chart repository name as {string}', (name: string) => {
  cy.get(helmChartRepositoriesPO.name)
    .should('be.visible')
    .clear()
    .type(name);
});

When('user enters Display name as {string}', (displayName: string) => {
  cy.get(helmChartRepositoriesPO.displayName)
    .scrollIntoView()
    .should('be.visible')
    .clear()
    .type(displayName);
});

When('user enters Description as {string}', (description: string) => {
  cy.get(helmChartRepositoriesPO.description)
    .scrollIntoView()
    .should('be.visible')
    .clear()
    .type(description);
});

When('user enters URL as {string}', (url: string) => {
  cy.get(helmChartRepositoriesPO.url)
    .scrollIntoView()
    .should('be.visible')
    .clear()
    .type(url);
});

When('user clicks on Create button', () => {
  createForm.clickCreate();
});

Then(
  'user can see {string} for resource {string} and type {string} under Chart Repositories in Helm Charts catalog page',
  (repo: string, resourceName: string, type: string) => {
    let helmRepo = repo
      .toLowerCase()
      .split(' ')
      .join('-');
    helmRepo = helmRepo.replace(/([A-Z,a-z]+)([0-9])/g, '$1-$2');
    cy.get(`[data-test="chartRepositoryTitle-${helmRepo}"]`).should('be.visible');
    helmChartRepository.deleteChartRepository(resourceName, type);
  },
);
