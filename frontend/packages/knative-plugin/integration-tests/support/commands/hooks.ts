import { checkErrors } from '@console/cypress-integration-tests/support';
import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { installKnativeOperatorUsingCLI } from '@console/dev-console/integration-tests/support/pages';
import { checkDeveloperPerspective } from '@console/dev-console/integration-tests/support/pages/functions/checkDeveloperPerspective';

before(() => {
  cy.exec('../../../../contrib/create-user.sh');
  const bridgePasswordIDP: string = Cypress.env('BRIDGE_HTPASSWD_IDP') || 'test';
  const bridgePasswordUsername: string = Cypress.env('BRIDGE_HTPASSWD_USERNAME') || 'test';
  const bridgePasswordPassword: string = Cypress.env('BRIDGE_HTPASSWD_PASSWORD') || 'test';
  cy.login(bridgePasswordIDP, bridgePasswordUsername, bridgePasswordPassword);
  cy.document().its('readyState').should('eq', 'complete');
  checkDeveloperPerspective();
  installKnativeOperatorUsingCLI();
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
  guidedTour.close();
});

beforeEach(() => {
  cy.initDeveloper();
  // cy.initAdmin();
  // cy.byLegacyTestID('topology-header').should('exist').click({force: true});
});

after(() => {
  const namespaces: string[] = Cypress.env('NAMESPACES') || [];
  let start = 0;
  cy.then(() => {
    start = performance.now();
  });

  cy.exec(`oc delete namespace ${namespaces.join(' ')}`, {
    failOnNonZeroExit: false,
  }).then((result) => {
    cy.log(result.stdout);
    cy.log(`duration: ${performance.now() - start}`);
  });
  // cy.logout();
});

afterEach(() => {
  const namespaces: string[] = Cypress.env('NAMESPACES') || [];

  cy.exec(`oc adm top pod -n ${namespaces.join(' ')}`, {
    failOnNonZeroExit: false,
  }).then((result) => {
    cy.log(result.stdout);
  });
  // Below code helps to close the form, when there is any issue. so that other scenarios will be executed
  checkErrors();
});
