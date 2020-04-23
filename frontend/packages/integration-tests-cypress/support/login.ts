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
// ex: cy.login('test', 'test', 'test')
Cypress.Commands.add('login', (provider: string, username: string, password: string) => {
  // if local, no need to login
  if (!Cypress.env('BRIDGE_KUBEADMIN_PASSWORD')) {
    cy.task('log', '  skipping login, no BRIDGE_KUBEADMIN_PASSWORD set');
    return;
  }
  const idp = provider || KUBEADMIN_IDP;
  cy.task('log', `  Logging in as ${username || KUBEADMIN_USERNAME}`);
  cy.visit(''); // visits baseUrl which is set in plugins/index.js
  cy.byLegacyTestID('login').should('be.visible');
  cy.contains(idp)
    .should('be.visible')
    .click();
  cy.get('#inputUsername').type(username || KUBEADMIN_USERNAME);
  cy.get('#inputPassword').type(password || Cypress.env('BRIDGE_KUBEADMIN_PASSWORD'));
  cy.get(submitButton).click();
  masthead.username.shouldBeVisible();
});

Cypress.Commands.add('logout', () => {
  if (!Cypress.env('BRIDGE_KUBEADMIN_PASSWORD')) {
    cy.task('log', '  skipping logout');
    return;
  }
  cy.task('log', '  Logging out');
  cy.byTestID('user-dropdown').click();
  cy.byTestID('log-out').click();
  cy.byLegacyTestID('login').should('be.visible');
});
