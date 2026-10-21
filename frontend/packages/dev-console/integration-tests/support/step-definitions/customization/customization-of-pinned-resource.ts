import { Given, Then, When } from 'cypress-cucumber-preprocessor/steps';
import { devNavigationMenu } from '../../constants';
import { navigateTo } from '../../pages';

Given('user is at Consoles page', () => {
  navigateTo(devNavigationMenu.Consoles);
});

When('user navigates to Cluster configuration page', () => {
  cy.byLegacyTestID('actions-menu-button').should('be.visible').click();
  cy.byTestActionID('Customize').should('be.visible').click();
});

When('user clicks on Developer tab', () => {
  cy.get('[role="presentation"]').contains('Developer').should('be.visible').click();
});

Then('user should see Pre-pinned navigation items section', () => {
  cy.byTestID('pinned-resource form-section').should('be.visible');
});
