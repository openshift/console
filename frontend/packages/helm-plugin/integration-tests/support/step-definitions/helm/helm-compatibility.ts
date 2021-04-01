import { addOptions } from '@console/dev-console/integration-tests/support/constants/add';
import { addPage } from '@console/dev-console/integration-tests/support/pages/add-flow/add-page';
import { Given, When, Then } from 'cypress-cucumber-preprocessor/steps';
import { detailsPage } from '@console/cypress-integration-tests/views/details-page';
import { pageTitle } from '@console/dev-console/integration-tests/support/constants/pageTitle';

Given('user is at the Install Helm Chart page', () => {
  addPage.selectCardFromOptions(addOptions.HelmChart);
});

When('user clicks on the Helm Chart card on the Add page', () => {
  addPage.selectCardFromOptions(addOptions.HelmChart);
});

When('user redirects to Helm Charts page', () => {
  detailsPage.titleShouldContain(pageTitle.HelmCharts);
});

Then('user is able to see helm charts', () => {
  cy.get('.pf-c-badge').should('be.visible');
});
