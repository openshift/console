import { checkErrors } from '../../support';

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
  });
});
