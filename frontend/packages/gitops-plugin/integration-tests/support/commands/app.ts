before(() => {
  cy.login();
  cy.visit('');
  cy.document()
    .its('readyState')
    .should('eq', 'complete');
});

after(() => {
  // cy.exec(`oc delete namespace ${Cypress.env('NAMESPACE')}`);
});

beforeEach(() => {
  cy.log('Before each scenario, this block is executed');
});
