import { actionsMenu } from '@console/dev-console/integration-tests/support/pageObjects';

export const actionsDropdownMenu = {
  verifyActionsMenu: () => cy.get(actionsMenu).should('be.visible'),
  clickActionMenu: () => cy.get(actionsMenu).click(),
  selectAction: (action: string) => {
    actionsDropdownMenu.clickActionMenu();
    cy.byTestActionID(action).click();
  },
};

export const tableFunctions = {
  verifyColumnValue: (columnName: string, columnValue: string) => {
    cy.get('tr th').each(($el, index) => {
      if ($el.text().includes(columnName)) {
        cy.get('tbody tr')
          .find('td')
          .eq(index)
          .should('have.text', columnValue);
      }
    });
  },

  selectKebabMenu: (name: string) => {
    cy.get('div[role="grid"]').within(() => {
      cy.get('tr td:nth-child(1)').each(($el, index) => {
        if ($el.text().includes(name)) {
          cy.get('tbody tr')
            .eq(index)
            .find('[data-test-id="kebab-button"]')
            .click({ force: true });
        }
      });
    });
  },
};
