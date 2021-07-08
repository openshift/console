import { submitButton } from '../views/form';
import { masthead } from '../views/masthead';

declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      login(providerName?: string, username?: string, password?: string): Chainable<Element>;
      logout(): Chainable<Element>;
    }
  }
}

const KUBEADMIN_USERNAME = 'kubeadmin';
const KUBEADMIN_IDP = 'kube:admin';

// any command added below, must be added to global Cypress interface above

// This will add 'cy.login(...)'
// ex: cy.login('my-idp', 'my-user', 'my-password')
Cypress.Commands.add('login', (provider: string, username: string, password: string) => {
  // Check if auth is disabled (for a local development environment).
  cy.visit(''); // visits baseUrl which is set in plugins/index.js
  cy.window().then((win: any) => {
    if (win.SERVER_FLAGS?.authDisabled) {
      cy.task('log', '  skipping login, console is running with auth disabled');
      return;
    }

    // Make sure we clear the cookie in case a previous test failed to logout.
    cy.clearCookie('openshift-session-token');

    const idp = provider || KUBEADMIN_IDP;
    cy.task('log', `  Logging in as ${username || KUBEADMIN_USERNAME}`);
    cy.byLegacyTestID('login').should('be.visible');
    cy.get('body').then(($body) => {
      if ($body.text().includes(idp)) {
        cy.contains(idp)
          .should('be.visible')
          .click();
      }
    });
    cy.get('#inputUsername').type(username || KUBEADMIN_USERNAME);
    cy.get('#inputPassword').type(password || Cypress.env('BRIDGE_KUBEADMIN_PASSWORD'));
    cy.get(submitButton).click();
    masthead.username.shouldBeVisible();
  });
});

Cypress.Commands.add('logout', () => {
  // Check if auth is disabled (for a local development environment).
  cy.window().then((win: any) => {
    if (win.SERVER_FLAGS?.authDisabled) {
      cy.task('log', '  skipping logout, console is running with auth disabled');
      return;
    }
    cy.task('log', '  Logging out');
    cy.byTestID('user-dropdown').click();
    cy.byTestID('log-out').click();
    cy.byLegacyTestID('login').should('be.visible');
  });
});
