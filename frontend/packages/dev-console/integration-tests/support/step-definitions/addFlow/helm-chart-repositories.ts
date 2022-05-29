import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { addOptions, devNavigationMenu } from '../../constants';
import { addPagePO, helmChartRepositoriesPO } from '../../pageObjects';
import { addPage, createForm, navigateTo } from '../../pages';

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

Given('user is at Create ProjectHelmChartRepository page', () => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.HelmChartRepositories);
});

When('user enters Chart repository name as {string}', (name: string) => {
  cy.get(helmChartRepositoriesPO.name)
    .should('be.visible')
    .clear()
    .type(name);
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
  'user can see {string} under Chart Repositories in Helm Charts catalog page',
  (projectHelmChartRepositories: string) => {
    const projectHelmRepo = projectHelmChartRepositories.replace(/([A-Z,a-z]+)([0-9])/g, '$1-$2');
    cy.get(`[data-test="chartRepositoryTitle-${projectHelmRepo}"]`).should('be.visible');
  },
);
