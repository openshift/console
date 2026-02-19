import { clusterVersionWithDesiredChannels } from '../../mocks/cluster-version';
import { checkErrors } from '../../support';
import { clusterSettings } from '../../views/cluster-settings';

const CLUSTER_VERSION_ALIAS = 'clusterVersion';
const WAIT_OPTIONS = { requestTimeout: 300000 };

describe('Cluster Settings updates graph', () => {
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

  it('displays when an update is in progress', () => {
    cy.intercept(
      '/api/kubernetes/apis/config.openshift.io/v1/clusterversions/version',
      clusterVersionWithDesiredChannels,
    ).as(CLUSTER_VERSION_ALIAS);
    cy.wait(`@${CLUSTER_VERSION_ALIAS}`, WAIT_OPTIONS);
    cy.byTestID('cv-updates-graph').should('exist');
    cy.byTestID('cv-channel').should('have.length', 2);
    cy.byTestID('cv-channel-name').first().should('contain.text', 'stable-4.16 channel');
    cy.byTestID('cv-channel')
      .first()
      .find('[data-test="cv-channel-version-dot"]')
      .should('have.length', 2);
    cy.byTestID('cv-channel')
      .first()
      .find('[data-test="cv-channel-version"]')
      .should('have.length', 2);
    cy.byTestID('cv-channel')
      .first()
      .find('[data-test="cv-more-updates-button"]')
      .should('exist')
      .click();
    cy.byLegacyTestID('modal-title').should('contain.text', 'Other available paths');
    cy.byTestID('more-updates-modal-close-button').should('exist').click();
    cy.byTestID('cv-channel-name').eq(1).should('contain.text', 'stable-4.17 channel');
  });
});
