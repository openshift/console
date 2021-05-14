import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';

before(() => {
  cy.login();
  cy.document()
    .its('readyState')
    .should('eq', 'complete');
  guidedTour.close();
});

after(() => {
  cy.exec(`oc delete namespace ${Cypress.env('NAMESPACE')}`, { failOnNonZeroExit: false });
  // cy.logout();
});
