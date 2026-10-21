import { devNavigationMenu } from '@console/dev-console/integration-tests/support/constants';
import { navigateTo } from '@console/dev-console/integration-tests/support/pages/app';

export const webTerminalConfiguration = () => {
  navigateTo(devNavigationMenu.Consoles);
  cy.byLegacyTestID('actions-menu-button').should('be.visible').click();
  cy.byTestActionID('Customize').should('be.visible').click();
  cy.wait(5000);
  cy.get('[role="presentation"]').contains('Web Terminal').should('be.visible').click();
};
