import { checkErrors } from '@console/cypress-integration-tests/support';

/* eslint-disable no-console, promise/catch-or-return */
before(() => {
  cy.exec('../../../../contrib/create-user.sh');
  const bridgePasswordIDP: string = Cypress.expose('BRIDGE_HTPASSWD_IDP') || 'test';
  const bridgePasswordUsername: string = Cypress.expose('BRIDGE_HTPASSWD_USERNAME') || 'test';
  cy.env(['BRIDGE_HTPASSWD_PASSWORD']).then(({ BRIDGE_HTPASSWD_PASSWORD }) => {
    cy.login(bridgePasswordIDP, bridgePasswordUsername, BRIDGE_HTPASSWD_PASSWORD || 'test');
  });
  cy.document().its('readyState').should('eq', 'complete');
});

after(() => {
  const namespaces: string[] = Cypress.expose('NAMESPACES') || [];
  cy.exec(`oc delete namespace ${namespaces.join(' ')}`, {
    failOnNonZeroExit: false,
    timeout: 180000,
  });
});

beforeEach(() => {
  cy.initAdmin();
  cy.byLegacyTestID('topology-header').should('exist').click({ force: true });
});

afterEach(() => {
  checkErrors();
});
