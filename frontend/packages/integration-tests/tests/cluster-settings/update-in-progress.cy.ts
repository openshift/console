import { clusterVersionWithProgressing } from '../../mocks/cluster-version';
import { checkErrors } from '../../support';
import { clusterSettings } from '../../views/cluster-settings';

const CLUSTER_VERSION_ALIAS = 'clusterVersion';
const WAIT_OPTIONS = { requestTimeout: 300000 };

describe('Cluster Settings while an update is in progress', () => {
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

  it('displays information about the update', () => {
    cy.intercept(
      '/api/kubernetes/apis/config.openshift.io/v1/clusterversions/version',
      clusterVersionWithProgressing,
    ).as(CLUSTER_VERSION_ALIAS);
    cy.wait(`@${CLUSTER_VERSION_ALIAS}`, WAIT_OPTIONS);
    cy.byTestID('cv-current-version-header').should('contain.text', 'Last completed version');
    cy.byTestID('cv-current-version').should('contain.text', '4.16.0');
    cy.byTestID('cv-update-status-updating')
      .should('exist')
      .and('contain.text', 'Update to 4.16.2 in progress');
    cy.byTestID('cv-updates-progress').should('exist');
    cy.byTestID('cv-updates-group').should('have.length', 3);
    cy.byTestID('mcp-paused-button').should('exist').and('contain.text', 'Pause update').click();
    cy.byTestID('mcp-paused-button').should('exist').and('contain.text', 'Resume update').click();
    cy.byTestID('mcp-paused-button').should('exist').and('contain.text', 'Pause update');
    clusterSettings.pauseMCP('false'); // ensure MCP is not paused
    cy.byLegacyTestID('cv-update-button').should('not.exist');
  });
});
