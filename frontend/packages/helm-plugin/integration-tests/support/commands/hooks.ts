before(() => {
  cy.login();
  cy.document()
    .its('readyState')
    .should('eq', 'complete');
  // set the user settings location to local storage, so that no need of deleting config map from openshift-console-user-settings namespace
  cy.window().then((win: any) => {
    win.SERVER_FLAGS.userSettingsLocation = 'localstorage';
  });
  // Default helm repo has been changed to a new repo, so executing below line to fix that issue
  cy.exec('oc apply -f test-data/red-hat-helm-charts.yaml');
});

after(() => {
  cy.exec(`oc delete namespace ${Cypress.env('NAMESPACE')}`, { failOnNonZeroExit: false });
  // cy.logout();
});
