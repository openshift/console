import { checkErrors } from '@console/cypress-integration-tests/support';
import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';

/* eslint-disable no-console, promise/catch-or-return */
before(() => {
  cy.exec('../../../../contrib/create-user.sh');
  const bridgePasswordIDP: string = Cypress.env('BRIDGE_HTPASSWD_IDP') || 'test';
  const bridgePasswordUsername: string = Cypress.env('BRIDGE_HTPASSWD_USERNAME') || 'test';
  const bridgePasswordPassword: string = Cypress.env('BRIDGE_HTPASSWD_PASSWORD') || 'test';
  cy.login(bridgePasswordIDP, bridgePasswordUsername, bridgePasswordPassword);
  cy.document().its('readyState').should('eq', 'complete');
  guidedTour.close();
});

after(() => {
  const namespaces: string[] = Cypress.env('NAMESPACES') || [];
  cy.exec(`oc delete namespace ${namespaces.join(' ')}`, {
    failOnNonZeroExit: false,
    timeout: 180000,
  });
});

beforeEach(() => {
  cy.initDeveloper();
});

afterEach(() => {
  checkErrors();
});
