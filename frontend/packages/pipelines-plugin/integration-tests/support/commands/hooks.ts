import { verifyAndInstallPipelinesOperator } from '@console/dev-console/integration-tests/support/pages';

before(() => {
  cy.login();
  cy.document()
    .its('readyState')
    .should('eq', 'complete');
  // set the user settings location to local storage, so that no need of deleting config map from openshift-console-user-settings namespace
  cy.window().then((win: any) => {
    win.SERVER_FLAGS.userSettingsLocation = 'localstorage';
  });
  verifyAndInstallPipelinesOperator();
});

after(() => {
  cy.exec(`oc delete namespace ${Cypress.env('NAMESPACE')}`, {
    failOnNonZeroExit: false,
    timeout: 180000,
  });
});

afterEach(() => {
  cy.checkErrors();
});
