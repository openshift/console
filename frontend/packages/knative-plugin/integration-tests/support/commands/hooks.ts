import { checkErrors } from '@console/cypress-integration-tests/support';
import { installKnativeOperatorUsingCLI } from '@console/dev-console/integration-tests/support/pages';

before(() => {
  cy.exec('../../../../contrib/create-user.sh');
  const bridgePasswordIDP: string = Cypress.expose('BRIDGE_HTPASSWD_IDP') || 'test';
  const bridgePasswordUsername: string = Cypress.expose('BRIDGE_HTPASSWD_USERNAME') || 'test';
  cy.env(['BRIDGE_HTPASSWD_PASSWORD']).then(({ BRIDGE_HTPASSWD_PASSWORD }) => {
    cy.login(bridgePasswordIDP, bridgePasswordUsername, BRIDGE_HTPASSWD_PASSWORD || 'test');
  });
  cy.document().its('readyState').should('eq', 'complete');
  installKnativeOperatorUsingCLI();
});

beforeEach(() => {
  cy.initAdmin();
  cy.byLegacyTestID('topology-header').should('exist').click({ force: true });
});

after(() => {
  const namespaces: string[] = Cypress.expose('NAMESPACES') || [];
  let start = 0;
  cy.then(() => {
    start = performance.now();
  });

  cy.exec(`oc delete namespace ${namespaces.join(' ')}`, {
    failOnNonZeroExit: false,
  }).then((result) => {
    cy.log(result.stdout);
    cy.log(`duration: ${performance.now() - start}`);
  });
  // cy.logout();
});

afterEach(() => {
  const namespaces: string[] = Cypress.expose('NAMESPACES') || [];

  cy.exec(`oc adm top pod -n ${namespaces.join(' ')}`, {
    failOnNonZeroExit: false,
  }).then((result) => {
    cy.log(result.stdout);
  });
  // Below code helps to close the form, when there is any issue. so that other scenarios will be executed
  checkErrors();
});
