import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { app } from '@console/dev-console/integration-tests/support/pages';

export const userLoginPage = {
  nonAdminUserlogin: () => {
    cy.logout();
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
