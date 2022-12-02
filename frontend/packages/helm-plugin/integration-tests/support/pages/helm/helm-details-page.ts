import { modal } from '@console/cypress-integration-tests/views/modal';
import { helmActions } from '@console/dev-console/integration-tests/support/constants';
import { helmPO } from '@console/dev-console/integration-tests/support/pageObjects';

const actions = [helmActions.upgrade, helmActions.rollback, helmActions.deleteHelmRelease];

export const helmDetailsPage = {
  verifyTitle: () => cy.byTestSectionHeading('Helm Release details').should('be.visible'),
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
    cy.get('dl.co-m-pane__details dt')
      .contains(fieldName)
      .next('dd')
      .should('contain.text', fieldValue);
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
    cy.byLegacyTestID(`horizontal-link-${name}`)
      .should('exist')
      .click();
  },
  selectedHelmTab: (name: string) => {
    cy.byLegacyTestID(`horizontal-link-${name}`)
      .should('exist')
      .parent('li')
      .should('have.class', 'co-m-horizontal-nav-item--active');
  },
  verifyHelmActionsDropdown: () => cy.byLegacyTestID('dropdown-button').should('be.visible'),
  clickHelmActionButton: () => cy.byLegacyTestID('dropdown-button').click(),
  verifyActionsInCreateMenu: () => {
    cy.byLegacyTestID('dropdown-menu')
      .contains('Repository')
      .should('exist');
    cy.byLegacyTestID('dropdown-menu')
      .contains('Helm Release')
      .should('exist');
  },
  clickCreateMenu: (createMenuOption: string) => {
    cy.byLegacyTestID('dropdown-button').click();
    cy.byLegacyTestID('dropdown-menu')
      .contains(createMenuOption)
      .click();
  },
  clickHelmChartRepository: (repoName: string) => cy.byLegacyTestID(repoName).click(),
  clickCreateHelmRelease: () => {
    cy.byLegacyTestID('dropdown-button').click();
    cy.byLegacyTestID('dropdown-menu')
      .contains('Helm Release')
      .click();
  },
  clickCreateRepository: () => {
    cy.byLegacyTestID('dropdown-button').click();
    cy.byLegacyTestID('dropdown-menu')
      .contains('Repository')
      .click();
  },
};
