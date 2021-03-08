import { verifyAndInstallKnativeOperator } from '@console/dev-console/integration-tests/support/pages/functions/installOperatorOnCluster';

before(() => {
  cy.login();
  cy.document()
    .its('readyState')
    .should('eq', 'complete');
  verifyAndInstallKnativeOperator();
});

after(() => {
  cy.exec(`oc delete namespace ${Cypress.env('NAMESPACE')}`, { failOnNonZeroExit: false });
  // cy.logout();
});
