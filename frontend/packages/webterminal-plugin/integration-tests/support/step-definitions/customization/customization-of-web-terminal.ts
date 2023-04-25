import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import { nav } from '@console/cypress-integration-tests/views/nav';
import {
  devNavigationMenu,
  switchPerspective,
} from '@console/dev-console/integration-tests/support/constants';
import {
  app,
  navigateTo,
  perspective,
  verifyAndInstallWebTerminalOperator,
} from '@console/dev-console/integration-tests/support/pages';
import { webTerminalConfiguration } from '../../pages/functions/webTerminalConfiguration';

Given('user has installed Web Terminal operator', () => {
  verifyAndInstallWebTerminalOperator();
  cy.reload();
  app.waitForDocumentLoad();
});

Given('user has logged in as admin user', () => {
  perspective.switchTo(switchPerspective.Administrator);
  nav.sidenav.switcher.shouldHaveText(switchPerspective.Administrator);
});

Given('user is at Consoles page', () => {
  navigateTo(devNavigationMenu.Consoles);
});

When('user clicks on Web Terminal tab', () => {
  cy.wait(5000);
  cy.get('[role="presentation"]').contains('Web Terminal').should('be.visible').click();
});

Then('user should see Web Terminal Congiguration page', () => {
  cy.byTestID('web-terminal form-section').should('be.visible');
});

Given('user is at Web Terminal Configuration page', () => {
  webTerminalConfiguration();
});

When('user increase the timeout value and set unit as {string}', (unit: string) => {
  cy.wait(2000);
  cy.get('[data-test-id="Increment"]').should('be.visible').click();
  cy.byLegacyTestID('dropdown-button').click();
  cy.byLegacyTestID('dropdown-menu').contains(unit).click();
});

When('user enters image value as {string}', (image: string) => {
  cy.get('[data-test="web-terminal-image"]').should('be.visible').clear().type(image);
});

When('user clicks on Save button to save web terminal settings', () => {
  cy.get('[data-test="save-button"]').should('be.enabled').click();
});

Then('user should see a success alert', () => {
  cy.get('[aria-label="Success Alert"]').should('be.visible');
});

When('user checks checkboxes to save data even after operator restarts or update', () => {
  cy.get('[data-test="timeout-value-checkbox"]').should('be.enabled').check();
  cy.get('[data-test="image-value-checkbox"]').should('be.enabled').check();
});

When('user unchecks checkboxes to save data even after operator restarts or update', () => {
  cy.wait(2000);
  cy.get('[data-test="timeout-value-checkbox"]').should('be.enabled').uncheck();
  cy.get('[data-test="image-value-checkbox"]').should('be.enabled').uncheck();
});

When('user navigates to Cluster configuration page', () => {
  cy.byLegacyTestID('actions-menu-button').should('be.visible').click();
  cy.byTestActionID('Customize').should('be.visible').click();
});
