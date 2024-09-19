import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { actionsMenu } from '@console/dev-console/integration-tests/support/pageObjects';
import { app } from '@console/dev-console/integration-tests/support/pages';

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
        cy.get('tbody tr').find('td').eq(index).should('have.text', columnValue);
      }
    });
  },

  selectKebabMenu: (name: string) => {
    cy.get('.co-virtualized-table').within(() => {
      cy.get('tr td:nth-child(1)').each(($el, index) => {
        if ($el.text().includes(name)) {
          cy.get('tbody tr').eq(index).find('[data-test-id="kebab-button"]').click({ force: true });
        }
      });
    });
  },
};

export const userLoginPage = {
  nonAdminUserlogin: () => {
    Cypress.session.clearAllSavedSessions();
    app.waitForDocumentLoad();
    cy.get('body').then(($body) => {
      if ($body.find('[data-test-id="login"]').length === 0) {
        /* eslint-disable cypress/no-unnecessary-waiting */
        cy.wait(4000);
      }
    });
    const idp = Cypress.env('BRIDGE_HTPASSWD_IDP') || 'test';
    const username = Cypress.env('BRIDGE_HTPASSWD_USERNAME') || 'test';
    const password = Cypress.env('BRIDGE_HTPASSWD_PASSWORD') || 'test';
    cy.login(idp, username, password);
    app.waitForLoad();
    guidedTour.close();
  },
};
