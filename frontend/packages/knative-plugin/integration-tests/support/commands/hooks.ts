import {
  devNavigationMenu,
  switchPerspective,
} from '@console/dev-console/integration-tests/support/constants/global';
import {
  verifyAndInstallKnativeOperator,
  navigateTo,
  perspective,
} from '@console/dev-console/integration-tests/support/pages';

before(() => {
  cy.login();
  cy.document()
    .its('readyState')
    .should('eq', 'complete');
  verifyAndInstallKnativeOperator();

  //  To ignore the resizeObserverLoopErrors on CI, adding below code
  const resizeObserverLoopErrRe = /^[^(ResizeObserver loop limit exceeded)]/;
  /* eslint-disable consistent-return */
  Cypress.on('uncaught:exception', (err) => {
    /* returning false here prevents Cypress from failing the test */
    if (resizeObserverLoopErrRe.test(err.message)) {
      return false;
    }
  });
});

beforeEach(() => {
  perspective.switchTo(switchPerspective.Developer);
  navigateTo(devNavigationMenu.Add);
});

after(() => {
  cy.exec(`oc delete namespace ${Cypress.env('NAMESPACE')}`, { failOnNonZeroExit: false });
  // cy.logout();
});

afterEach(() => {
  // Below code helps to close the form, when there is any issue. so that other scenarios will be executed
  cy.checkErrors();
});
