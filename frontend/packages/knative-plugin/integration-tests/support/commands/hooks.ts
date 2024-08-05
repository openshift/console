import { checkErrors } from '@console/cypress-integration-tests/support';
import { installKnativeOperatorUsingCLI } from '@console/dev-console/integration-tests/support/pages';

before(() => {
  cy.login();
  cy.document().its('readyState').should('eq', 'complete');
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
});

beforeEach(() => {
  cy.initDeveloper();
});

after(() => {
  const namespaces: string[] = Cypress.env('NAMESPACES') || [];
  let start = 0;
  cy.then(() => {
    start = performance.now();
  });

  cy.exec(`oc adm top pod -n ${namespaces.join(' ')}`, {
    failOnNonZeroExit: false,
  }).then((result) => {
    cy.log(result.stdout);
  });

  cy.exec(`oc get events -n ${namespaces.join(' ')}`, {
    failOnNonZeroExit: false,
  }).then((result) => {
    cy.log(result.stdout);
  });

  cy.exec(`oc adm top pod -n ${namespaces.join(' ')}`, {
    failOnNonZeroExit: false,
  }).then((result) => {
    cy.log(result.stdout);
  });

  cy.exec(`oc get all -n ${namespaces.join(' ')}`, {
    failOnNonZeroExit: false,
  }).then((result) => {
    cy.log(result.stdout);
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
