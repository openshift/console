import { checkErrors } from '../../support';
import { detailsPage } from '../../views/details-page';

describe('Cluster Settings', () => {
  before(() => {
    cy.login();
    cy.initAdmin();
  });

  beforeEach(() => {
    cy.visit('/settings/cluster');
  });

  afterEach(() => {
    checkErrors();
  });

  it('displays page title, horizontal navigation tab headings and pages', () => {
    cy.byLegacyTestID('cluster-settings-page-heading').should('contain.text', 'Cluster Settings');
    detailsPage.selectTab('Details');
    detailsPage.isLoaded();
    detailsPage.selectTab('ClusterOperators');
    detailsPage.isLoaded();
    detailsPage.selectTab('Configuration');
    detailsPage.isLoaded();
  });

  it('displays channel update modal and closes it', () => {
    detailsPage.selectTab('Details');
    cy.byLegacyTestID('current-channel-update-link').should('be.visible').click();
    cy.byLegacyTestID('modal-cancel-action').should('be.visible').click();
  });

  it('displays Cluster Operators page and console Operator details page', () => {
    detailsPage.selectTab('ClusterOperators');
    cy.byLegacyTestID('console').should('be.visible').click();
    detailsPage.titleShouldContain('console');
    detailsPage.selectTab('YAML');
    detailsPage.isLoaded();
  });

  it('displays Configuration page and ClusterVersion configuration details page', () => {
    detailsPage.selectTab('Configuration');
    cy.byLegacyTestID('ClusterVersion').should('be.visible').click();
    detailsPage.selectTab('YAML');
    detailsPage.isLoaded();
  });

  it('displays Configuration page and ClusterVersion Edit ClusterVersion resource details page', () => {
    detailsPage.selectTab('Configuration');
    detailsPage.isLoaded();
    cy.byTestActionID('ClusterVersion').within(() => {
      cy.get('[data-test-id="kebab-button"]').click();
    });
    cy.byTestActionID('Edit ClusterVersion resource').click();
    detailsPage.titleShouldContain('version');
  });

  it('displays Configuration page and ClusterVersion Explore Console API details page', () => {
    detailsPage.selectTab('Configuration');
    detailsPage.isLoaded();
    cy.byTestActionID('ClusterVersion').within(() => {
      cy.get('[data-test-id="kebab-button"]').click();
    });
    cy.byTestActionID('Explore ClusterVersion API').click();
    detailsPage.titleShouldContain('ClusterVersion');
  });
});
