before(() => {
  const bridgePasswordIDP: string = Cypress.expose('BRIDGE_HTPASSWD_IDP') || 'test';
  const bridgePasswordUsername: string = Cypress.expose('BRIDGE_HTPASSWD_USERNAME') || 'test';
  cy.env(['BRIDGE_HTPASSWD_PASSWORD']).then(({ BRIDGE_HTPASSWD_PASSWORD }) => {
    cy.login(bridgePasswordIDP, bridgePasswordUsername, BRIDGE_HTPASSWD_PASSWORD || 'test');
  });
  cy.document().its('readyState').should('eq', 'complete');
  cy.window().then((win: any) => {
    win.SERVER_FLAGS.userSettingsLocation = 'localstorage';
  });
  // Default helm repo has been changed to a new repo, so executing below line to fix that issue
  cy.exec('oc apply -f test-data/red-hat-helm-charts.yaml');
});

beforeEach(() => {
  cy.initAdmin();
  cy.byLegacyTestID('topology-header').should('exist').click({ force: true });
});

after(() => {
  cy.exec(`oc delete namespace ${Cypress.expose('NAMESPACE')}`, { failOnNonZeroExit: false });
});
