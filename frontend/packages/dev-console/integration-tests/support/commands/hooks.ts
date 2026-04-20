import { quickStartSidebarPO } from '../pageObjects/quickStarts-po';

before(() => {
  cy.exec('../../../../contrib/create-user.sh');
  const bridgePasswordIDP: string = Cypress.env('BRIDGE_HTPASSWD_IDP') || 'test';
  const bridgePasswordUsername: string = Cypress.env('BRIDGE_HTPASSWD_USERNAME') || 'test';
  const bridgePasswordPassword: string = Cypress.env('BRIDGE_HTPASSWD_PASSWORD') || 'test';
  cy.login(bridgePasswordIDP, bridgePasswordUsername, bridgePasswordPassword);
  cy.document().its('readyState').should('eq', 'complete');
  // checkDeveloperPerspective();
});

after(() => {
  const namespaces: string[] = Cypress.env('NAMESPACES') || [];
  cy.exec(`oc delete namespace ${namespaces.join(' ')}`, { failOnNonZeroExit: false });
});

beforeEach(() => {
  cy.initAdmin();
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
