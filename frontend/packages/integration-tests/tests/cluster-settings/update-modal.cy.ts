import {
  clusterVersionWithAvailableUpdates,
  clusterVersionWithAvailableAndConditionalUpdates,
  clusterVersionWithConditionalUpdates,
} from '../../mocks/cluster-version';
import {
  machineConfigPoolListWithPausedWorker,
  machineConfigPoolListWithUnpausedWorker,
} from '../../mocks/machine-config-pool';
import { checkErrors } from '../../support';
import { stubMachineConfigPoolWatchWebSocket } from '../../support/stub-machine-config-pool-watch-ws';
import { clusterSettings } from '../../views/cluster-settings';
import { isLocalDevEnvironment } from '../../views/common';

const CLUSTER_VERSION_ALIAS = 'clusterVersion';
const WAIT_OPTIONS = { requestTimeout: 300000 };
// List requests only (not .../machineconfigpools/<name>).
const MCP_LIST_PATTERN = '**/machineconfiguration.openshift.io/v1/machineconfigpools?*';
const visitClusterSettingsWithMcpStub = () => {
  clusterSettings.detailsIsLoaded({
    onBeforeLoad: (win) => stubMachineConfigPoolWatchWebSocket(win),
  });
};
const reloadClusterSettingsWithMcpStub = () => {
  cy.reload({
    onBeforeLoad: (win) => stubMachineConfigPoolWatchWebSocket(win),
  });
  cy.byLegacyTestID('horizontal-link-Details').should('exist');
};

describe('Cluster Settings cluster update modal', () => {
  before(() => {
    cy.login();
    cy.initAdmin();
  });

  beforeEach(() => {
    cy.intercept(
      '/api/kubernetes/apis/config.openshift.io/v1/clusterversions/version',
      clusterVersionWithAvailableUpdates,
    ).as(CLUSTER_VERSION_ALIAS);
    cy.intercept('GET', MCP_LIST_PATTERN, {
      body: machineConfigPoolListWithPausedWorker,
    });
    visitClusterSettingsWithMcpStub();
    cy.wait(`@${CLUSTER_VERSION_ALIAS}`, WAIT_OPTIONS);
  });

  afterEach(() => {
    checkErrors();
  });

  it('changes based on the cluster', () => {
    cy.log('with a paused Worker MCP');
    clusterSettings.pauseMCP();
    clusterSettings.openUpdateModalAndOpenDropdown();
    cy.byTestID('update-cluster-modal')
      .find('[data-test="dropdown-with-switch-switch"]')
      .should('exist')
      .and('have.attr', 'disabled');
    cy.byTestID('update-cluster-modal')
      .find('[data-test="dropdown-with-switch-menu-item-4.17.1"]')
      .should('exist');
    cy.byTestID('update-cluster-modal')
      .find('[data-test="dropdown-with-switch-menu-item-4.17.1"]')
      .click();
    cy.byTestID('update-cluster-modal-paused-nodes-warning').should('exist');
    cy.byTestID('update-cluster-modal-partial-update-radio').should('exist');
    cy.byTestID('update-cluster-modal-partial-update-radio').click();
    cy.byTestID('pause-mcp-checkbox-worker').should('exist').and('have.attr', 'checked');
    cy.byLegacyTestID('modal-cancel-action').should('exist');
    cy.byLegacyTestID('modal-cancel-action').click();
    clusterSettings.pauseMCP('false');

    cy.log('with available and conditional updates');
    cy.intercept(
      '/api/kubernetes/apis/config.openshift.io/v1/clusterversions/version',
      clusterVersionWithAvailableAndConditionalUpdates,
    ).as(CLUSTER_VERSION_ALIAS);
    cy.intercept('GET', MCP_LIST_PATTERN, {
      body: machineConfigPoolListWithUnpausedWorker,
    });
    reloadClusterSettingsWithMcpStub();
    cy.wait(`@${CLUSTER_VERSION_ALIAS}`, WAIT_OPTIONS);
    clusterSettings.openUpdateModalAndOpenDropdown();
    cy.byTestID('update-cluster-modal')
      .find('[data-test="dropdown-with-switch-menu-item-4.17.1"]')
      .should('exist');
    cy.byTestID('update-cluster-modal')
      .find('[data-test="dropdown-with-switch-menu-item-4.17.1"]')
      .click();
    cy.byTestID('update-cluster-modal-not-recommended-alert').should('not.exist');
    // Only run locally as this is flaking in CI
    if (isLocalDevEnvironment) {
      cy.byTestID('update-cluster-modal')
        .find('[data-test="dropdown-with-switch-toggle"]')
        .should('exist');
      cy.byTestID('update-cluster-modal').find('[data-test="dropdown-with-switch-toggle"]').click();
      cy.byTestID('update-cluster-modal')
        .find('[data-test="dropdown-with-switch-switch"]')
        .should('exist');
      cy.byTestID('update-cluster-modal').find('[data-test="dropdown-with-switch-switch"]').click();
      cy.byTestID('update-cluster-modal')
        .find('[data-test="dropdown-with-switch-menu-item-4.16.4"]')
        .should('exist');
      cy.byTestID('update-cluster-modal')
        .find('[data-test="dropdown-with-switch-menu-item-4.16.4"]')
        .click();
      cy.byTestID('update-cluster-modal-not-recommended-alert').should('exist');
    }
    cy.byLegacyTestID('modal-cancel-action').should('exist');
    cy.byLegacyTestID('modal-cancel-action').click();

    cy.log('with conditional updates');
    cy.intercept(
      '/api/kubernetes/apis/config.openshift.io/v1/clusterversions/version',
      clusterVersionWithConditionalUpdates,
    ).as(CLUSTER_VERSION_ALIAS);
    cy.intercept('GET', MCP_LIST_PATTERN, {
      body: machineConfigPoolListWithUnpausedWorker,
    });
    reloadClusterSettingsWithMcpStub();
    cy.wait(`@${CLUSTER_VERSION_ALIAS}`, WAIT_OPTIONS);
    cy.byTestID('cv-not-recommended-alert').should('exist');
    clusterSettings.openUpdateModalAndOpenDropdown();
    cy.byTestID('update-cluster-modal')
      .find('[data-test="dropdown-with-switch-switch"]')
      .should('exist');
    cy.byTestID('update-cluster-modal').find('[data-test="dropdown-with-switch-switch"]').click();
    cy.byTestID('update-cluster-modal')
      .find('[data-test="dropdown-with-switch-menu-item-4.17.1"]')
      .should('not.exist');
    cy.byTestID('update-cluster-modal')
      .find('[data-test="dropdown-with-switch-menu-item-4.16.4"]')
      .should('exist');
    cy.byTestID('update-cluster-modal')
      .find('[data-test="dropdown-with-switch-menu-item-4.16.4"]')
      .click();
    cy.byTestID('update-cluster-modal-not-recommended-alert').should('exist');
    cy.byLegacyTestID('modal-cancel-action').should('exist');
    cy.byLegacyTestID('modal-cancel-action').click();
  });
});
