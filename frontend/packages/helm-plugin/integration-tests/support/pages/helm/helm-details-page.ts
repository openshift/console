import { modal } from '@console/cypress-integration-tests/views/modal';
import { helmActions } from '@console/dev-console/integration-tests/support/constants';
import { helmPO } from '@console/dev-console/integration-tests/support/pageObjects';

const actions = [helmActions.upgrade, helmActions.rollback, helmActions.deleteHelmRelease];

export const helmDetailsPage = {
  verifyTitle: () => cy.byTestSectionHeading('Helm Release details').should('be.visible'),
  verifyHelmReleaseStatus: () => cy.get('[data-test="status-text"]').should('be.visible'),
  verifyResourcesTab: () => cy.get(helmPO.resourcesTab).should('be.visible'),
  verifyReleaseNotesTab: () => cy.get(helmPO.revisionHistoryTab).should('be.visible'),
  verifyActionsDropdown: () => cy.byLegacyTestID('actions-menu-button').should('be.visible'),
  verifyRevisionHistoryTab: () => cy.get(helmPO.revisionHistoryTab).should('be.visible'),
  clickActionMenu: () => cy.byLegacyTestID('actions-menu-button').click(),
  verifyActionsInActionMenu: () => {
    cy.byLegacyTestID('action-items')
      .find('li')
      .each(($ele) => {
        expect(actions).toContain($ele.text());
      });
  },
  verifyFieldValue: (fieldName: string, fieldValue: string) => {
    cy.get('dl dt').contains(fieldName).next('dd').should('contain.text', fieldValue);
  },
  uninstallHelmRelease: () => {
    cy.get('form.modal-content').within(() => {
      cy.byLegacyTestID('modal-title').should('contain.text', 'Delete Helm Release?');
      cy.get('button[type=submit]').click({ force: true });
    });
    modal.shouldBeClosed();
  },
  enterReleaseNameInUninstallPopup: (releaseName: string = 'nodejs-release') => {
    modal.modalTitleShouldContain('Delete Helm Release?');
    cy.get('form strong').should('have.text', releaseName);
    cy.get(helmPO.uninstallHelmRelease.releaseName).type(releaseName);
  },
  checkHelmTab: (name: string) => {
    cy.byLegacyTestID(`horizontal-link-${name}`).should('exist');
  },
  selectHelmTab: (name: string) => {
    cy.byLegacyTestID(`horizontal-link-${name}`).should('exist').click();
  },
  selectedHelmTab: (name: string) => {
    cy.byLegacyTestID(`horizontal-link-${name}`)
      .should('exist')
      .parent('.pf-v6-c-tabs__item')
      .should('have.class', 'pf-m-current');
  },
  verifyHelmActionsDropdown: () => cy.byTestID('console-select-menu-toggle').should('be.visible'),
  clickHelmActionButton: () => cy.byTestID('console-select-menu-toggle').click(),
  verifyActionsInCreateMenu: () => {
    cy.byTestID('console-select-item').contains('Repository').should('exist');
    cy.byTestID('console-select-item').contains('Helm Release').should('exist');
  },
  clickCreateMenu: (createMenuOption: string) => {
    cy.byTestID('console-select-menu-toggle').click();
    cy.byTestID('console-select-item').contains(createMenuOption).click();
  },
  clickHelmChartRepository: (repoName: string) => cy.byLegacyTestID(repoName).click(),
  selectHelmChartRepository: (repoName: string) =>
    cy.byTestID(`chartRepositoryTitle-${repoName}`).click(),
  clickCreateHelmRelease: () => {
    cy.byTestID('console-select-menu-toggle').click();
    cy.byTestID('console-select-item').contains('Helm Release').click();
  },
  clickCreateRepository: () => {
    cy.byTestID('console-select-menu-toggle').click();
    cy.byTestID('console-select-item').contains('Repository').click();
  },
  clickRevisionHistoryTab: () => cy.get(helmPO.revisionHistoryTab).click(),
};
