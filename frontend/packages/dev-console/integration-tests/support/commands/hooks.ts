import { quickStartSidebarPO } from '../pageObjects/quickStarts-po';

before(function () {
  // Skip all dev-console tests on techPreview clusters: the Developer perspective is
  // disabled by default and the htpasswd IDP doesn't exist, so create-user.sh would
  // need to create it (5-10 min auth-operator cycle) before login can succeed. The
  // combination causes initAdmin() to time out waiting for the perspective-switcher-toggle.
  // cy.exec() returns a Cypress Chainable, not a true Promise — it has no .catch() method.
  // Cypress's command queue manages error handling; this disable is required.
  // eslint-disable-next-line promise/catch-or-return
  cy.exec('oc get featuregate cluster -o jsonpath={.spec.featureSet}', {
    failOnNonZeroExit: false,
  }).then((result) => {
    if (result.stdout.trim() === 'TechPreviewNoUpgrade') {
      this.skip();
    }
  });
  cy.exec('../../../../contrib/create-user.sh');
  const bridgePasswordIDP: string = Cypress.expose('BRIDGE_HTPASSWD_IDP') || 'test';
  const bridgePasswordUsername: string = Cypress.expose('BRIDGE_HTPASSWD_USERNAME') || 'test';
  cy.env(['BRIDGE_HTPASSWD_PASSWORD']).then(({ BRIDGE_HTPASSWD_PASSWORD }) => {
    cy.login(bridgePasswordIDP, bridgePasswordUsername, BRIDGE_HTPASSWD_PASSWORD || 'test');
  });
  cy.document().its('readyState').should('eq', 'complete');
  // checkDeveloperPerspective();
});

after(() => {
  const namespaces: string[] = Cypress.expose('NAMESPACES') || [];
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
