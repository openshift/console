import { checkErrors } from '../../support';
import { clusterSettings } from '../../views/cluster-settings';
import { detailsPage } from '../../views/details-page';

describe('Cluster Settings', () => {
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

  it('displays page title, horizontal navigation tab headings and pages', () => {
    cy.byLegacyTestID('cluster-settings-page-heading').should('contain.text', 'Cluster Settings');
    detailsPage.selectTab('Details');
    detailsPage.isLoaded();
    detailsPage.selectTab('ClusterOperators');
    detailsPage.isLoaded();
    detailsPage.selectTab('Configuration');
    detailsPage.isLoaded();
  });

  it('displays Cluster Operators page and console Operator details page', () => {
    detailsPage.selectTab('ClusterOperators');
    cy.byLegacyTestID('console').should('exist').click();
    detailsPage.titleShouldContain('console');
    detailsPage.selectTab('YAML');
    detailsPage.isLoaded();
  });

  it('displays Configuration page and ClusterVersion configuration details page', () => {
    detailsPage.selectTab('Configuration');
    cy.byLegacyTestID('ClusterVersion').should('exist').click();
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
