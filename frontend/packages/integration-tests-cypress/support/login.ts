import { submitButton } from '../views/form';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace,no-redeclare
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

// This will add to 'login(provider, username, password)' to cy
// ex: cy.login('test', 'test', 'test')
Cypress.Commands.add('login', (provider: string, username: string, password: string) => {
  // if local, no need to login
  if (!Cypress.env('BRIDGE_KUBEADMIN_PASSWORD')) {
    cy.task('log', 'No BRIDGE_KUBEADMIN_PASSWORD set, skipping login');
    return;
  }
  const idp = provider || KUBEADMIN_IDP;
  cy.task('log', `  Logging into IDP ${idp}, using baseUrl ${Cypress.config('baseUrl')}`);
  cy.clearCookie('openshift-session-token');
  cy.visit(''); // visits baseUrl which is set in plugins/index.js
  cy.byLegacyTestID('login').should('be.visible');
  cy.contains(idp)
    .should('be.visible')
    .click();
  cy.get('#inputUsername').type(username || KUBEADMIN_USERNAME);
  cy.get('#inputPassword').type(password || Cypress.env('BRIDGE_KUBEADMIN_PASSWORD'));
  cy.get(submitButton).click();
  cy.byTestID('user-dropdown').should('be.visible');
});

Cypress.Commands.add('logout', () => {
  if (!Cypress.env('BRIDGE_KUBEADMIN_PASSWORD')) {
    cy.task('log', 'No BRIDGE_KUBEADMIN_PASSWORD set, skipping logout');
    return;
  }
  cy.task('log', '  Logging out');
  cy.byTestID('user-dropdown')
    .click()
    .contains('Log out')
    .click();
  cy.byLegacyTestID('login').should('be.visible');
});
