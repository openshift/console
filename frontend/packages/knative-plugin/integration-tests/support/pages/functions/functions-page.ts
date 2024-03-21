import { topologyPage } from '@console/topology/integration-tests/support/pages/topology';
import { functionsPO } from '../../pageObjects/functions-po';

export const functionsPage = {
  verifyTitle: () => cy.byTestSectionHeading('Details').should('be.visible'),
  verifyMessage: (noFunctionsFound: string) =>
    cy.get(functionsPO.emptyState).contains(noFunctionsFound),
  verifyFunctionsListed: () => {
    cy.get(functionsPO.table).get('table').its('length').should('be.greaterThan', 0);
  },
  clickFunctionName: (name: string) => cy.get(`a[title="${name}"]`).click(),
  search: (name: string) => {
    cy.get(functionsPO.search).clear().type(name);
  },
  verifyServiceURL: () => cy.byTestID('URL').should('be.visible'),
  verifyServiceRevision: () => cy.byTestID('Revisions').should('be.visible'),
  verifyContainerSection: () =>
    cy.get('[data-test-section-heading="Containers"]').should('be.visible'),
  verifyRevisionsTab: () => cy.get(functionsPO.revisionsTab).should('be.visible'),
  verifyRoutesTab: () => cy.get(functionsPO.routesTab).should('be.visible'),
  verifyPodsTab: () => cy.get(functionsPO.podsTab).should('be.visible'),
  verifyGettingStarted: () => cy.get(functionsPO.gettingStarted).should('be.visible'),
  verifyFunctionsActionsDropdown: () =>
    cy.byLegacyTestID('dropdown-button').eq(0).should('be.visible'),
  clickFunctionsActionButton: () => cy.byLegacyTestID('dropdown-button').eq(0).click(),
  verifyActionsInCreateMenu: () => {
    cy.byLegacyTestID('dropdown-menu').contains('Import from Git').should('exist');
    cy.byLegacyTestID('dropdown-menu').contains('Samples').should('exist');
  },
  clickonEmptyAreaTopology: () => {
    topologyPage.waitForLoad();
    cy.get(functionsPO.topologyGraph).click('topLeft');
  },
};
