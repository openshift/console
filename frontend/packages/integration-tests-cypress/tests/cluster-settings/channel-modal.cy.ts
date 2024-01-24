import {
  clusterVersionWithDesiredChannels,
  clusterVersionWithoutChannel,
} from '../../mocks/cluster-version';
import { checkErrors } from '../../support';
import { clusterSettings } from '../../views/cluster-settings';

const CHANNEL_CANDIDATE = 'candidate-4.16';
const CHANNEL_STABLE = 'stable-4.16';
const CLUSTER_VERSION_ALIAS = 'clusterVersion';
const WAIT_OPTIONS = { requestTimeout: 300000 };

describe('Cluster Settings channel modal', () => {
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

  it('changes based on cluster version', () => {
    cy.log('when no channel is set');
    cy.intercept(
      {
        url: '/api/kubernetes/apis/config.openshift.io/v1/clusterversions/version',
        times: 1,
      },
      clusterVersionWithoutChannel,
    ).as(CLUSTER_VERSION_ALIAS);
    cy.wait(`@${CLUSTER_VERSION_ALIAS}`, WAIT_OPTIONS);
    cy.byLegacyTestID('current-channel-update-link')
      .should('exist')
      .and('contain.text', 'Not configured')
      .click();
    cy.byLegacyTestID('modal-title').should('contain.text', 'Input channel');
    cy.byTestID('channel-modal-input').should('exist').clear().type(CHANNEL_CANDIDATE);
    cy.byTestID('confirm-action').should('exist').click();
    cy.log('Reload to test changes');
    clusterSettings.detailsIsLoaded();
    cy.byLegacyTestID('current-channel-update-link')
      .should('exist')
      .and('contain.text', CHANNEL_CANDIDATE);

    cy.log('when and channel is set and channels are present');
    cy.intercept(
      {
        url: '/api/kubernetes/apis/config.openshift.io/v1/clusterversions/version',
        times: 1,
      },
      clusterVersionWithDesiredChannels,
    ).as(CLUSTER_VERSION_ALIAS);
    cy.wait(`@${CLUSTER_VERSION_ALIAS}`, WAIT_OPTIONS);
    cy.byLegacyTestID('current-channel-update-link')
      .should('exist')
      .and('contain.text', 'stable-4.16')
      .click();
    cy.byLegacyTestID('modal-title').should('contain.text', 'Select channel');
    cy.byTestID('channel-modal').find('[data-test-id="dropdown-button"]').should('exist').click();
    cy.get(`[data-test-dropdown-menu="${CHANNEL_STABLE}"]`).should('exist').click();
    cy.byTestID('confirm-action').should('exist').click();
    cy.log('Reload to test changes');
    clusterSettings.detailsIsLoaded();
    cy.byLegacyTestID('current-channel-update-link')
      .should('exist')
      .and('contain.text', CHANNEL_STABLE);
  });
});
