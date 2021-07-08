import { verifyAndInstallPipelinesOperator } from '@console/dev-console/integration-tests/support/pages';

before(() => {
  cy.login();
  cy.document()
    .its('readyState')
    .should('eq', 'complete');
  verifyAndInstallPipelinesOperator();
});

after(() => {
  const namespaces: string[] = Cypress.env('NAMESPACES') || [];
  cy.log(`Deleting "${namespaces.join(' ')}" namespace`);
  cy.exec(`oc delete namespace ${namespaces.join(' ')}`, {
    failOnNonZeroExit: false,
    timeout: 180000,
  });
});

afterEach(() => {
  cy.checkErrors();
});
