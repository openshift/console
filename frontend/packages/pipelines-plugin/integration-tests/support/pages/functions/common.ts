import { actionsMenu } from '@console/dev-console/integration-tests/support/pageObjects';

export const actionsDropdownMenu = {
  verifyActionsMenu: () => cy.get(actionsMenu).should('be.visible'),
  clickActionMenu: () => cy.get(actionsMenu).click(),
  selectAction: (action: string) => {
    actionsDropdownMenu.clickActionMenu();
    cy.byTestActionID(action).click();
  },
};
