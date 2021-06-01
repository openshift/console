import { verifyAndInstallPipelinesOperator } from '@console/dev-console/integration-tests/support/pages';

before(() => {
  cy.login();
  cy.document()
    .its('readyState')
    .should('eq', 'complete');
  verifyAndInstallPipelinesOperator();
});

after(() => {
  cy.log(`Deleting "${Cypress.env('NAMESPACE')}" namespace`);
  cy.exec(`oc delete namespace ${Cypress.env('NAMESPACE')}`, {
    failOnNonZeroExit: false,
    timeout: 180000,
  });
  // cy.logout();
});
