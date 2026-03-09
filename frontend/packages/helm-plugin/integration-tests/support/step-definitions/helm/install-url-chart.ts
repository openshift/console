import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants';
import { navigateTo } from '@console/dev-console/integration-tests/support/pages';
import { topologyPage } from '@console/topology/integration-tests/support/pages/topology/topology-page';
import { urlChartInstallPage } from '../../pages';

Given('user is at the URL chart install page', () => {
  navigateTo(devNavigationMenu.Helm);
  cy.byLegacyTestID('item-create').click();
  cy.get('[data-test-dropdown-menu]').contains('Helm Chart URL').click();
});

When('user clicks on Create menu and selects "Install a Helm Chart from a URL"', () => {
  cy.byLegacyTestID('item-create').click();
  cy.get('[data-test-dropdown-menu]').contains('Helm Chart URL').click();
});

Then('user is redirected to the URL chart install page', () => {
  cy.url().should('include', '/url-chart');
  cy.get('[data-test="oci-chart-url"]').should('be.visible');
});

When('user clicks on the Next button without filling any fields', () => {
  urlChartInstallPage.clickNext();
});

Then('user will see validation errors for Chart URL, Release name, and Chart version', () => {
  urlChartInstallPage.verifyValidationErrors();
});

When('user enters {string} as Chart URL', (url: string) => {
  urlChartInstallPage.enterChartURL(url);
});

When('user enters Release Name as {string}', (name: string) => {
  urlChartInstallPage.enterReleaseName(name);
});

When('user enters Chart Version as {string}', (version: string) => {
  urlChartInstallPage.enterChartVersion(version);
});

When('user clicks on the Next button', () => {
  urlChartInstallPage.clickNext();
});

When('user clicks on the Install button', () => {
  urlChartInstallPage.clickInstall();
});

Then('user will see a validation error for invalid Chart URL format', () => {
  cy.get('.pf-m-error').should('exist');
});

Then('user will be redirected to Topology page', () => {
  topologyPage.verifyTopologyPage();
});
