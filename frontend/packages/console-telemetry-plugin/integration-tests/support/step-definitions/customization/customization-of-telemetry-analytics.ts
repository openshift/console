import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants';
import { navigateTo } from '@console/dev-console/integration-tests/support/pages';
import { telemetryConfiguration } from '../../pages/functions/telemetryConfiguration';

Given('user is at Consoles page', () => {
  navigateTo(devNavigationMenu.Consoles);
});

When('user clicks on Telemetry tab', () => {
  cy.get('[role="presentation"]').contains('Telemetry').should('be.visible').click();
});

Then('user should see Telemetry Configuration page', () => {
  cy.byTestID('telemetry form-section').should('be.visible');
});

Given('user is at Telemetry Configuration page', () => {
  telemetryConfiguration();
});

When('user clicks on Analytics dropdown', () => {
  cy.byTestID('telemetry-dropdown').click();
});

Then('user should see Opt-in, Opt-out, Enforce and Disabled options', () => {
  cy.get('[role="presentation"]').contains('Opt-in').should('be.visible');
  cy.get('[role="presentation"]').contains('Opt-out').should('be.visible');
  cy.get('[role="presentation"]').contains('Enforce').should('be.visible');
  cy.get('[role="presentation"]').contains('Disabled').should('be.visible');
});

Then('user should see a success alert', () => {
  cy.byTestID('success-alert').should('be.visible');
});

When('user navigates to Cluster configuration page', () => {
  cy.byLegacyTestID('actions-menu-button').should('be.visible').click();
  cy.byTestActionID('Customize').should('be.visible').click();
});

When('user selects {string} option in dropdown menu', (value: string) => {
  cy.byTestID(`telemetry-dropdown-option-${value}`).click();
});
