import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';

before(() => {
  cy.login();
  cy.document()
    .its('readyState')
    .should('eq', 'complete');
  guidedTour.close();
});

after(() => {
  const namespaces: string[] = Cypress.env('NAMESPACES') || [];
  cy.exec(`oc delete namespace ${namespaces.join(' ')}`, { failOnNonZeroExit: false });
  // cy.logout();
});
