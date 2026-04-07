import { clusterVersionWithUpgradeableFalse } from '../../mocks/cluster-version';
import { checkErrors } from '../../support';
import { clusterSettings } from '../../views/cluster-settings';

const CLUSTER_VERSION_ALIAS = 'clusterVersion';
const WAIT_OPTIONS = { requestTimeout: 300000 };

describe('Cluster Settings when ClusterVersion Upgradeable=False', () => {
  before(() => {
    cy.login();
    cy.initAdmin();
  });

  beforeEach(() => {
    clusterSettings.detailsIsLoaded();
  });

  afterEach(() => {
    checkErrors();
  });

  it('displays alerts and badges', () => {
    cy.intercept(
      '/api/kubernetes/apis/config.openshift.io/v1/clusterversions/version',
      clusterVersionWithUpgradeableFalse,
    ).as(CLUSTER_VERSION_ALIAS);
    cy.wait(`@${CLUSTER_VERSION_ALIAS}`, WAIT_OPTIONS);
    cy.byTestID('cluster-settings-alerts-not-upgradeable').should('exist');
    cy.byTestID('cv-more-updates-button').should('exist').click();
    cy.byTestID('more-updates-modal')
      .find('[data-test="cluster-settings-alerts-not-upgradeable"]')
      .should('exist');
    cy.byTestID('more-updates-modal').find('[data-test="cv-update-blocked"]').should('exist');
    cy.byTestID('more-updates-modal-close-button').should('exist').click();
    cy.byTestID('cv-channel-version-blocked').should('exist');
    cy.byTestID('cv-channel')
      .first()
      .find('[data-test="cv-channel-version-dot-blocked"]')
      .should('exist')
      .click();
    cy.byTestID('cv-update-blocked').should('exist');
    cy.byTestID('cv-channel-version-dot-blocked-info').should('exist');
    cy.byLegacyTestID('cv-update-button').should('exist').click({ force: true }); // force since popover is covering button
    cy.byTestID('update-cluster-modal')
      .find('[data-test="cluster-settings-alerts-not-upgradeable"]')
      .should('exist');
    cy.byTestID('update-cluster-modal')
      .find('[data-test="dropdown-with-switch-toggle"]')
      .should('exist')
      .click();
    cy.byTestID('cv-update-blocked').should('have.length', 2);
  });
});
