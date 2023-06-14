before(() => {
  const bridgePasswordIDP: string = Cypress.env('BRIDGE_HTPASSWD_IDP');
  const bridgePasswordUsername: string = Cypress.env('BRIDGE_HTPASSWD_USERNAME');
  const bridgePasswordPassword: string = Cypress.env('BRIDGE_KUBEADMIN_PASSWORD');
  cy.login(bridgePasswordIDP, bridgePasswordUsername, bridgePasswordPassword);
  cy.document().its('readyState').should('eq', 'complete');
});

after(() => {
  const namespaces: string[] = Cypress.env('NAMESPACES') || [];
  cy.exec(`oc delete namespace ${namespaces.join(' ')}`, { failOnNonZeroExit: false });
  // cy.logout();
});

afterEach(() => {
  // Below code helps to close the form, when there is any issue. so that other scenarios will be executed
  cy.checkErrors();
});
