import { guidedTour } from '@console/cypress-integration-tests/views/guided-tour';
import { quickStartSidebarPO } from '../pageObjects/quickStarts-po';

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
  const bridgePasswordIDP: string = Cypress.env('BRIDGE_HTPASSWD_IDP') || 'test';
  const bridgePasswordUsername: string = Cypress.env('BRIDGE_HTPASSWD_USERNAME') || 'test';
  const bridgePasswordPassword: string = Cypress.env('BRIDGE_HTPASSWD_PASSWORD') || 'test';
  cy.login(bridgePasswordIDP, bridgePasswordUsername, bridgePasswordPassword);
  cy.document().its('readyState').should('eq', 'complete');
  guidedTour.close();
});

after(() => {
  const namespaces: string[] = Cypress.env('NAMESPACES') || [];
  cy.exec(`oc delete namespace ${namespaces.join(' ')}`, { failOnNonZeroExit: false });
});

beforeEach(() => {
  cy.initDeveloper();
});

afterEach(() => {
  // Below code helps to close the form, when there is any issue. so that other scenarios will be executed
  cy.url().then(($url) => {
    if ($url.includes('?quickstart=')) {
      cy.get(quickStartSidebarPO.quickStartSidebar).then(() => {
        if (Cypress.$(quickStartSidebarPO.restartSideNoteAction).length) {
          cy.get(quickStartSidebarPO.quickStartSidebar)
            .get(quickStartSidebarPO.restartSideNoteAction)
            .click();
        }
        cy.get(quickStartSidebarPO.closePanel).click();
      });
    }
  });

  cy.checkErrors();
});
