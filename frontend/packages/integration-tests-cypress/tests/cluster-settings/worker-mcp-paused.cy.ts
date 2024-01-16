import { clusterVersionWithAvailableUpdates } from '../../mocks/cluster-version';
import { checkErrors } from '../../support';
import { clusterSettings } from '../../views/cluster-settings';

const CLUSTER_VERSION_ALIAS = 'clusterVersion';
const WAIT_OPTIONS = { requestTimeout: 300000 };

describe('Cluster Settings when worker MachineConfigPool is paused', () => {
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

  it('displays an alert', () => {
    clusterSettings.pauseMCP();
    cy.intercept(
      '/api/kubernetes/apis/config.openshift.io/v1/clusterversions/version',
      clusterVersionWithAvailableUpdates,
    ).as(CLUSTER_VERSION_ALIAS);
    cy.wait(`@${CLUSTER_VERSION_ALIAS}`, WAIT_OPTIONS);
    cy.byTestID('cluster-settings-alerts-paused-nodes').should('exist');
    cy.byTestID('mcp-paused-button').should('exist');
    clusterSettings.pauseMCP('false');
  });
});
