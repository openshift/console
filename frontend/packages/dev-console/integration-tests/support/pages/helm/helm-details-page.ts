import { detailsPage } from '../../../../../integration-tests-cypress/views/details-page';
import { pageTitle as helmPageTitle } from '../../constants/pageTitle';
import { helmPO } from '../../pageObjects/helm-po';
import { modal } from '../../../../../integration-tests-cypress/views/modal';

export const helmDetailsPage = {
  verifyTitle: () => detailsPage.titleShouldContain(helmPageTitle.helmReleaseDetails),
  verifyResourcesTab: () => cy.get(helmPO.resourcesTab).should('be.visible'),
  verifyReleaseNotesTab: () =>
    cy.byLegacyTestID('horizontal-link-Release Notes').should('be.visible'),
  verifyActionsDropdown: () => cy.byLegacyTestID('actions-menu-button').should('be.visible'),
  verifyRevisionHistoryTab: () => cy.get(helmPO.revisionHistoryTab).should('be.visible'),
  clickActionMenu: () => cy.byLegacyTestID('actions-menu-button').click(),
  verifyActionsInActionMenu: () => {
    cy.byLegacyTestID('action-items')
      .find('li')
      .each(($el) => {
        expect($el.text()).toEqual('Upgrade');
        expect($el.text()).toEqual('Rollback');
        expect($el.text()).toEqual('Uninstall Helm Release');
      });
  },
  verifyFieldValue: (fieldName: string, fieldValue: string) => {
    cy.get('dl.co-m-pane__details dt')
      .contains(fieldName)
      .next('dd')
      .should('contain.text', fieldValue);
  },
  uninstallHelmRelease: () => {
    modal.modalTitleShouldContain('Uninstall Helm Release?');
    cy.byTestID('confirm-action')
      .should('be.enabled')
      .click();
  },
  enterReleaseNameInUninstallPopup: (releaseName: string = 'nodejs-ex-k') => {
    modal.modalTitleShouldContain('Uninstall Helm Release?');
    cy.get('form strong').should('have.text', releaseName);
    cy.get(helmPO.uninstallHelmRelease.releaseName).type(releaseName);
  },
};
