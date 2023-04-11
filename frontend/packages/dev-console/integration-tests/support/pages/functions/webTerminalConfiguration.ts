import { devNavigationMenu } from '../../constants';
import { navigateTo } from '../app';

export const webTerminalConfiguration = () => {
  navigateTo(devNavigationMenu.Consoles);
  cy.byLegacyTestID('actions-menu-button')
    .should('be.visible')
    .click();
  cy.byTestActionID('Customize')
    .should('be.visible')
    .click();
  cy.get('[role="presentation"]')
    .contains('Web Terminal')
    .should('be.visible')
    .click();
};
