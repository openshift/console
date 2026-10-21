import { checkErrors } from '../../support';
import { clusterSettings } from '../../views/cluster-settings';

describe('Cluster Settings upstream configuration modal', () => {
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

  it('can be opened and closed', () => {
    cy.byLegacyTestID('cv-upstream-server-url').should('be.visible').click();
    cy.byLegacyTestID('modal-title').should('contain.text', 'Edit upstream configuration');
    cy.byLegacyTestID('modal-cancel-action').should('be.visible').click();
  });
});
