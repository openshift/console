import { When, Then } from 'cypress-cucumber-preprocessor/steps';
import { catalogPO, helmPO } from '@console/dev-console/integration-tests/support/pageObjects';
import { catalogPage } from '@console/dev-console/integration-tests/support/pages';

When('user searches and selects {string} helm chart from catalog page', (helmChartName: string) => {
  catalogPage.search(helmChartName);
  catalogPage.selectHelmChartCard(helmChartName);
});

Then('user will see the information of all the chart versions', () => {
  cy.get('ul.pf-c-dropdown__menu')
    .find('li button')
    .should('have.length.gte', 1);
  cy.byLegacyTestID('reset-button').click();
});

When('user clicks on the Install Helm Chart button on side bar', () => {
  catalogPage.clickButtonOnCatalogPageSidePane();
});

When('user clicks on the chart versions dropdown menu', () => {
  cy.get(helmPO.upgradeHelmRelease.chartVersion).click();
});

When('user selects the YAML view', () => {
  cy.get(catalogPO.installHelmChart.yamlView).click();
  cy.get('.osc-yaml-editor').should('be.visible');
});

When('user enters Replica count as {string}', (replicaCount: string) => {
  cy.get(catalogPO.installHelmChart.replicaCount)
    .clear()
    .type(replicaCount);
});

When('user selects the Form View', () => {
  cy.get(catalogPO.installHelmChart.formView).click();
});

When('user comes back to Form view', () => {
  cy.get(catalogPO.installHelmChart.formView).click();
  cy.get('.co-dynamic-form').should('be.visible');
});

Then(
  'user will see Release Name, Replica count as {string}, {string} respectively',
  (releaseName: string, replicaCount: string) => {
    cy.get(catalogPO.installHelmChart.replicaCount).should('contain.value', replicaCount);
    cy.get(catalogPO.installHelmChart.releaseName).should('contain.value', releaseName);
    cy.byLegacyTestID('reset-button').click();
  },
);
