import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { checkDeveloperPerspective } from '@console/dev-console/integration-tests/support/pages/functions/checkDeveloperPerspective';
import { installShipwrightOperatorUsingCLI } from '@console/dev-console/integration-tests/support/pages/functions/installOperatorOnClusterUsingCLI';

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
  cy.exec('../../../../contrib/create-user.sh');
  cy.login();
  cy.document().its('readyState').should('eq', 'complete');
  cy.exec(
    `oc patch console.operator.openshift.io/cluster --type='merge' -p '{"spec":{"customization":{"perspectives":[{"id":"dev","visibility":{"state":"Enabled"}}]}}}'`,
    { failOnNonZeroExit: false },
  );
  cy.reload(true);
  cy.document().its('readyState').should('eq', 'complete');
  guidedTour.close();
  checkDeveloperPerspective();
  installShipwrightOperatorUsingCLI();
});

after(() => {
  const namespaces: string[] = Cypress.env('NAMESPACES') || [];
  cy.exec(`oc delete namespace ${namespaces.join(' ')}`, { failOnNonZeroExit: false });
});

beforeEach(() => {
  cy.initDeveloper();
});

afterEach(() => {
  cy.checkErrors();
});
