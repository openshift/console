import { Then, When } from 'cypress-cucumber-preprocessor/steps';
import { submitButton } from '@console/cypress-integration-tests/views/form';
import { authorizeAccessPage } from '../../pages/crw/authorizeAccess';
import { keycloakRegistrationPage } from '../../pages/crw/keycloak';

When('user clicks on Codeready Workspaces in Application menu in Masthead', () => {
  cy.byTestID('application-launcher-item')
    .should('have.attr', 'target', '_blank')
    .invoke('removeAttr', 'target')
    .click();
});

Then('user is redirected to Codeready Workspaces Dashboard', () => {
  const idp = Cypress.env('BRIDGE_HTPASSWD_IDP') || 'test';
  const username = Cypress.env('BRIDGE_HTPASSWD_USERNAME') || 'test';
  const password = Cypress.env('BRIDGE_HTPASSWD_PASSWORD') || 'test';
  cy.byLegacyTestID('login').should('be.visible');
  cy.contains(idp)
    .should('be.visible')
    .click();
  cy.get('#inputUsername').type(username);
  cy.get('#inputPassword').type(password);
  cy.get(submitButton).click();
  cy.url().then((url) => {
    if (url.includes('oauth')) {
      authorizeAccessPage.allowPermissions();
      keycloakRegistrationPage.submitRegistrationForm(
        username,
        'some@mail.com',
        username,
        username,
      );
    }
  });

  const crwUrl = Cypress.config('baseUrl')?.replace(
    'console-openshift-console',
    'codeready-openshift-workspaces',
  );

  cy.url().should('equal', `${crwUrl}/dashboard/#/create-workspace?tab=quick-add`);
  cy.get('.pf-c-spinner__tail-ball').should('not.exist');
  cy.get('.pf-c-title').should('have.text', 'Quick Add');
});
