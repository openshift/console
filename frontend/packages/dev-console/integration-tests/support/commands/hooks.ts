before(() => {
  cy.login();
  cy.document()
    .its('readyState')
    .should('eq', 'complete');
});

after(() => {
  cy.exec(`oc delete namespace ${Cypress.env('NAMESPACE')}`, { failOnNonZeroExit: false });
  // cy.logout();
});

afterEach(() => {
  // Below code helps to close the form, when there is any issue. so that other scenarios will be executed
  cy.checkErrors();
});
