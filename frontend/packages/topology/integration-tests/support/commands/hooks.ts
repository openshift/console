/* eslint-disable no-console, promise/catch-or-return */
before(() => {
  cy.login();
  cy.document()
    .its('readyState')
    .should('eq', 'complete');
});

after(() => {
  const namespaces: string[] = Cypress.env('NAMESPACES') || [];
  cy.exec(`oc delete namespace ${namespaces.join(' ')}`, {
    failOnNonZeroExit: false,
    timeout: 180000,
  });
});
