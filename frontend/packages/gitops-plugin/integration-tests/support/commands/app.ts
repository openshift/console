before(() => {
  // login script is changed by console team, due to that unable to execute the scripts in local. So commenting below function until that issue is resolved
  // cy.login();
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
