//  To ignore the resizeObserverLoopErrors on CI, adding below code
const resizeObserverLoopErrRe = /^[^(ResizeObserver loop limit exceeded)]/;
/* eslint-disable consistent-return */
Cypress.on('uncaught:exception', (err, runnable, promise) => {
  /* returning false here prevents Cypress from failing the test */
  if (resizeObserverLoopErrRe.test(err.message)) {
    return false;
  }
  cy.log('uncaught:exception', err, runnable, promise);
});

before(() => {
  const bridgePasswordIDP: string = Cypress.env('BRIDGE_HTPASSWD_IDP') || 'test';
  const bridgePasswordUsername: string = Cypress.env('BRIDGE_HTPASSWD_USERNAME') || 'test';
  const bridgePasswordPassword: string = Cypress.env('BRIDGE_HTPASSWD_PASSWORD') || 'test';
  cy.login(bridgePasswordIDP, bridgePasswordUsername, bridgePasswordPassword);
  cy.document().its('readyState').should('eq', 'complete');
  // set the user settings location to local storage, so that no need of deleting config map from openshift-console-user-settings namespace
  cy.window().then((win: any) => {
    win.SERVER_FLAGS.userSettingsLocation = 'localstorage';
  });
  // Default helm repo has been changed to a new repo, so executing below line to fix that issue
  cy.exec('oc apply -f test-data/red-hat-helm-charts.yaml');
});

beforeEach(() => {
  cy.initDeveloper();
});

after(() => {
  cy.exec(`oc delete namespace ${Cypress.env('NAMESPACE')}`, { failOnNonZeroExit: false });
});
