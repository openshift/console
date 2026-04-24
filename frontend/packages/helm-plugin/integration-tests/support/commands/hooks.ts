before(() => {
  cy.login();
  cy.document().its('readyState').should('eq', 'complete');
  cy.window().then((win: any) => {
    win.SERVER_FLAGS.userSettingsLocation = 'localstorage';
  });
  // Default helm repo has been changed to a new repo, so executing below line to fix that issue
  cy.exec('oc apply -f test-data/red-hat-helm-charts.yaml');
});

after(() => {
  cy.exec(`oc delete namespace ${Cypress.expose('NAMESPACE')}`, { failOnNonZeroExit: false });
});
