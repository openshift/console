import {
  clusterVersionWithAvailableUpdates,
  clusterVersionWithAvailableAndConditionalUpdates,
  clusterVersionWithConditionalUpdates,
} from '../../mocks/cluster-version';
import { checkErrors } from '../../support';
import { clusterSettings } from '../../views/cluster-settings';

const CLUSTER_VERSION_ALIAS = 'clusterVersion';
const WAIT_OPTIONS = { requestTimeout: 300000 };

describe('Cluster Settings cluster update modal', () => {
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

  it('changes based on the cluster', () => {
    cy.log('with a paused Worker MCP');
    clusterSettings.pauseMCP();
    cy.intercept(
      '/api/kubernetes/apis/config.openshift.io/v1/clusterversions/version',
      clusterVersionWithAvailableUpdates,
    ).as(CLUSTER_VERSION_ALIAS);
    cy.wait(`@${CLUSTER_VERSION_ALIAS}`, WAIT_OPTIONS);
    clusterSettings.openUpdateModalAndOpenDropdown();
    cy.byTestID('update-cluster-modal')
      .find('[data-test="dropdown-with-switch-switch"]')
      .should('exist')
      .and('have.attr', 'disabled');
    cy.byTestID('update-cluster-modal')
      .find('[data-test="dropdown-with-switch-menu-item-4.17.1"]')
      .should('exist')
      .click();
    cy.byTestID('update-cluster-modal-paused-nodes-warning').should('exist');
    cy.byTestID('update-cluster-modal-partial-update-radio').should('exist').click();
    cy.byTestID('pause-mcp-checkbox-worker').should('exist').and('have.attr', 'checked');
    cy.byLegacyTestID('modal-cancel-action').should('exist').click();
    clusterSettings.pauseMCP('false');

    cy.log('with available and conditional updates');
    cy.intercept(
      '/api/kubernetes/apis/config.openshift.io/v1/clusterversions/version',
      clusterVersionWithAvailableAndConditionalUpdates,
    ).as(CLUSTER_VERSION_ALIAS);
    cy.wait(`@${CLUSTER_VERSION_ALIAS}`, WAIT_OPTIONS);
    clusterSettings.openUpdateModalAndOpenDropdown();
    cy.byTestID('update-cluster-modal')
      .find('[data-test="dropdown-with-switch-switch"]')
      .should('exist')
      .click();
    cy.byTestID('update-cluster-modal')
      .find('[data-test="dropdown-with-switch-menu-item-4.17.1"]')
      .should('exist')
      .click();
    cy.byTestID('update-cluster-modal-not-recommended-alert').should('not.exist');
    cy.byTestID('update-cluster-modal').find('[data-test="dropdown-with-switch-toggle"]').click();
    cy.byTestID('update-cluster-modal')
      .find('[data-test="dropdown-with-switch-menu-item-4.16.4"]')
      .should('exist')
      .click();
    cy.byTestID('update-cluster-modal-not-recommended-alert').should('exist');
    cy.byLegacyTestID('modal-cancel-action').should('exist').click();

    cy.log('with conditional updates');
    cy.intercept(
      '/api/kubernetes/apis/config.openshift.io/v1/clusterversions/version',
      clusterVersionWithConditionalUpdates,
    ).as(CLUSTER_VERSION_ALIAS);
    cy.wait(`@${CLUSTER_VERSION_ALIAS}`, WAIT_OPTIONS);
    cy.byTestID('cv-not-recommended-alert').should('exist');
    clusterSettings.openUpdateModalAndOpenDropdown();
    cy.byTestID('update-cluster-modal')
      .find('[data-test="dropdown-with-switch-switch"]')
      .should('exist')
      .click();
    cy.byTestID('update-cluster-modal')
      .find('[data-test="dropdown-with-switch-menu-item-4.17.1"]')
      .should('not.exist');
    cy.byTestID('update-cluster-modal')
      .find('[data-test="dropdown-with-switch-menu-item-4.16.4"]')
      .should('exist')
      .click();
    cy.byTestID('update-cluster-modal-not-recommended-alert').should('exist');
    cy.byLegacyTestID('modal-cancel-action').should('exist').click();
  });
});
