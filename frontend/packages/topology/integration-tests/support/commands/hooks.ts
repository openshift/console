before(() => {
  cy.login();
  cy.document()
    .its('readyState')
    .should('eq', 'complete');
});

after(() => {
  cy.exec(`oc delete namespace ${Cypress.env('NAMESPACE')}`, {
    failOnNonZeroExit: false,
    timeout: 180000,
  });
});
