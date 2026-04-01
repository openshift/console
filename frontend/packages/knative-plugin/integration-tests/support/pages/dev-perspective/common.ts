import { app } from '@console/dev-console/integration-tests/support/pages';

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
    const idp = Cypress.expose('BRIDGE_HTPASSWD_IDP') || 'test';
    const username = Cypress.expose('BRIDGE_HTPASSWD_USERNAME') || 'test';
    cy.env(['BRIDGE_HTPASSWD_PASSWORD']).then(({ BRIDGE_HTPASSWD_PASSWORD }) => {
      cy.login(idp, username, BRIDGE_HTPASSWD_PASSWORD || 'test');
    });
    app.waitForLoad();
  },
};
