import { checkErrors } from '../../support';
import { detailsPage } from '../../views/details-page';

describe('Cluster Settings when control plane is managed', () => {
  before(() => {
    cy.login();
    cy.initAdmin();
  });

  afterEach(() => {
    checkErrors();
  });

  it('displays an alert and hides elements', () => {
    cy.visit('/settings/cluster', {
      onLoad: (contentWindow) => {
        contentWindow.SERVER_FLAGS.controlPlaneTopology = 'External';
      },
    });
    cy.byTestID('cluster-settings-alerts-hosted').should('exist');
    cy.byTestID('current-channel-update-link').should('not.exist');
    cy.byTestID('cv-update-button').should('not.exist');
    cy.byTestID('cv-upstream-server-url').should('not.exist');
    cy.byTestID('cv-autoscaler').should('not.exist');
    cy.contains('logged in as a temporary administrative user').should('not.exist');
    cy.contains('allow others to log in').should('not.exist');
    // check on Configuration page
    detailsPage.selectTab('Configuration');
    cy.get('.loading-box__loaded').should('exist');
    const configName = [
      'APIServer',
      'Authentication',
      'DNS',
      'FeatureGate',
      'Networking',
      'OAuth',
      'Proxy',
      'Scheduler',
    ];
    configName.forEach(function (name) {
      cy.get(`[href="/k8s/cluster/config.openshift.io~v1~${name}/cluster"]`).should('not.exist');
    });
    // check on Overview page
    cy.clickNavLink(['Home', 'Overview']);
    cy.byTestID('Control Plane').should('not.exist');
  });
});
