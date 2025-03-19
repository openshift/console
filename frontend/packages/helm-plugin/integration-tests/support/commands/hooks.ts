import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';

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
  cy.window().then((win: any) => {
    win.SERVER_FLAGS.userSettingsLocation = 'localstorage';
  });
  // Default helm repo has been changed to a new repo, so executing below line to fix that issue
  cy.exec('oc apply -f test-data/red-hat-helm-charts.yaml');
  guidedTour.close();
});

beforeEach(() => {
  cy.initAdmin();
  cy.byLegacyTestID('topology-header').should('exist').click({ force: true });
});

after(() => {
  cy.exec(`oc delete namespace ${Cypress.env('NAMESPACE')}`, { failOnNonZeroExit: false });
});
